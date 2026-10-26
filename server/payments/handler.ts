/**
 * Razorpay subscriptions. Framework-free (node:http), mounted next to the GenAI gateway.
 *
 *   GET  /api/pay/status      -> { enabled, keyId }
 *   POST /api/pay/subscribe   -> { subscriptionId, keyId }   (signed-in user; body { plan, cycle })
 *   POST /api/pay/verify      -> { plan, status, currentEnd } (after checkout; checks Razorpay's signature)
 *   POST /api/pay/cancel      -> { status }                   (stops renewal; access lasts until the period ends)
 *   POST /api/pay/webhook     <- Razorpay events (renewals, failures, cancellations)
 *
 * The paid plan is written to the Supabase `subscriptions` table with the secret key. Users can read their
 * own row (and their partner's) but never write it, so a plan can only come from a verified payment.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type PaidPlan = 'plus' | 'couple';
type Cycle = 'monthly' | 'yearly';

/** Prices in paise (keep in sync with src/utils/plans.ts). */
const PRICES: Record<PaidPlan, Record<Cycle, number>> = {
  plus: { monthly: 14_900, yearly: 99_900 },
  couple: { monthly: 24_900, yearly: 179_900 },
};
/** Billing cycles per subscription before it needs renewing (Razorpay requires a count). */
const TOTAL_COUNT: Record<Cycle, number> = { monthly: 120, yearly: 10 };

const env = (k: string) => process.env[k]?.trim() || '';
const cfg = () => ({
  keyId: env('RAZORPAY_KEY_ID'),
  keySecret: env('RAZORPAY_KEY_SECRET'),
  webhookSecret: env('RAZORPAY_WEBHOOK_SECRET'),
  razorpayBase: (env('RAZORPAY_BASE_URL') || 'https://api.razorpay.com/v1').replace(/\/$/, ''),
  supabaseUrl: (env('SUPABASE_URL') || env('VITE_SUPABASE_URL')).replace(/\/$/, ''),
  supabaseSecret: env('SUPABASE_SECRET_KEY'),
  publishableKey: env('VITE_SUPABASE_PUBLISHABLE_KEY'),
});
export const paymentsEnabled = () => {
  const c = cfg();
  return Boolean(c.keyId && c.keySecret && c.supabaseUrl && c.supabaseSecret);
};

class PayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 100_000) throw new PayError(413, 'Request too large.');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const hmac = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex');
function sameSignature(expected: string, given: unknown) {
  if (typeof given !== 'string' || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

// ------------------------------------------------------------------ Razorpay REST

async function razorpay<T>(method: string, path: string, body?: unknown): Promise<T> {
  const c = cfg();
  const res = await fetch(`${c.razorpayBase}${path}`, {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${c.keyId}:${c.keySecret}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) {
    console.error(`[pay] Razorpay ${method} ${path} -> ${res.status}: ${json.error?.description ?? ''}`);
    throw new PayError(502, 'The payment service had a problem. Please try again.');
  }
  return json;
}

interface RzpPlan {
  id: string;
  period: string;
  interval: number;
  item: { name: string; amount: number; currency: string };
}
interface RzpSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_end?: number | null;
  notes?: Record<string, string>;
}

const planName = (plan: PaidPlan, cycle: Cycle) => `LoveMate ${plan === 'plus' ? 'Plus' : 'Couple'} (${cycle})`;

/** Finds the Razorpay plan for this price, creating it the first time, so nothing has to be set up by hand. */
const planCache = new Map<string, string>();
async function razorpayPlanId(plan: PaidPlan, cycle: Cycle): Promise<string> {
  const key = `${plan}:${cycle}`;
  const cached = planCache.get(key);
  if (cached) return cached;
  const name = planName(plan, cycle);
  const amount = PRICES[plan][cycle];
  const period = cycle === 'monthly' ? 'monthly' : 'yearly';
  const list = await razorpay<{ items: RzpPlan[] }>('GET', '/plans?count=100');
  const found = list.items.find((p) => p.item.name === name && p.item.amount === amount && p.period === period && p.interval === 1);
  const id =
    found?.id ??
    (await razorpay<RzpPlan>('POST', '/plans', { period, interval: 1, item: { name, amount, currency: 'INR' } })).id;
  planCache.set(key, id);
  return id;
}

// ------------------------------------------------------------------ Supabase (server side)

async function userFromRequest(req: IncomingMessage): Promise<{ id: string; email: string }> {
  const c = cfg();
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new PayError(401, 'Please sign in first.');
  const res = await fetch(`${c.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: c.publishableKey || c.supabaseSecret, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new PayError(401, 'Your session expired. Please sign in again.');
  const user = (await res.json()) as { id: string; email?: string };
  return { id: user.id, email: user.email ?? '' };
}

function adminHeaders(): Record<string, string> {
  const key = cfg().supabaseSecret;
  // New-style secret keys go in the apikey header only; legacy service_role JWTs also need Authorization.
  return key.startsWith('sb_secret_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

interface SubscriptionRow {
  user_id: string;
  plan: PaidPlan;
  cycle: Cycle;
  status: string;
  current_end: string | null;
  razorpay_subscription_id: string;
}

async function saveSubscription(row: SubscriptionRow) {
  const res = await fetch(`${cfg().supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    console.error('[pay] could not save subscription:', res.status, await res.text().catch(() => ''));
    throw new PayError(502, 'Payment received, but the plan could not be saved. Please contact support.');
  }
}

/** Razorpay status -> what the app understands. */
function appStatus(s: string): string {
  if (s === 'active' || s === 'authenticated') return 'active';
  if (s === 'pending') return 'past_due';
  if (s === 'halted') return 'halted';
  if (s === 'cancelled' || s === 'completed' || s === 'expired') return 'cancelled';
  return s;
}

async function syncFromRazorpay(sub: RzpSubscription, fallbackUserId?: string, statusOverride?: string) {
  const userId = sub.notes?.user_id || fallbackUserId;
  const plan = sub.notes?.plan as PaidPlan | undefined;
  const cycle = sub.notes?.cycle as Cycle | undefined;
  if (!userId || !plan || !cycle) throw new PayError(400, 'This subscription is missing LoveMate details.');
  const row: SubscriptionRow = {
    user_id: userId,
    plan,
    cycle,
    status: statusOverride ?? appStatus(sub.status),
    current_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
    razorpay_subscription_id: sub.id,
  };
  await saveSubscription(row);
  return row;
}

// ------------------------------------------------------------------ routes

export async function handlePayments(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/pay/')) return false;
  const route = url.pathname.slice('/api/pay/'.length);

  try {
    if (route === 'status' && req.method === 'GET') {
      send(res, 200, { enabled: paymentsEnabled(), keyId: paymentsEnabled() ? cfg().keyId : null });
      return true;
    }
    if (req.method !== 'POST') throw new PayError(405, 'Method not allowed.');
    if (!paymentsEnabled()) throw new PayError(503, 'Payments are not set up yet.');
    const raw = await readBody(req);

    if (route === 'webhook') {
      const c = cfg();
      if (!c.webhookSecret || !sameSignature(hmac(c.webhookSecret, raw), req.headers['x-razorpay-signature'])) {
        throw new PayError(400, 'Invalid signature.');
      }
      const event = JSON.parse(raw) as { event: string; payload?: { subscription?: { entity?: RzpSubscription } } };
      const sub = event.payload?.subscription?.entity;
      if (sub && event.event.startsWith('subscription.')) {
        await syncFromRazorpay(sub).catch((e) => console.warn('[pay] webhook not applied:', (e as Error).message));
      }
      send(res, 200, { ok: true });
      return true;
    }

    const user = await userFromRequest(req);
    const body = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;

    if (route === 'subscribe') {
      const plan = body.plan === 'couple' ? 'couple' : body.plan === 'plus' ? 'plus' : null;
      const cycle = body.cycle === 'yearly' ? 'yearly' : body.cycle === 'monthly' ? 'monthly' : null;
      if (!plan || !cycle) throw new PayError(400, 'Choose a plan and billing cycle.');
      const sub = await razorpay<RzpSubscription>('POST', '/subscriptions', {
        plan_id: await razorpayPlanId(plan, cycle),
        total_count: TOTAL_COUNT[cycle],
        customer_notify: 1,
        notes: { user_id: user.id, email: user.email, plan, cycle },
      });
      send(res, 200, { subscriptionId: sub.id, keyId: cfg().keyId });
      return true;
    }

    if (route === 'verify') {
      const paymentId = String(body.razorpay_payment_id ?? '');
      const subscriptionId = String(body.razorpay_subscription_id ?? '');
      // Razorpay signs "payment_id|subscription_id" with the key secret; only a real payment matches.
      if (!paymentId || !subscriptionId || !sameSignature(hmac(cfg().keySecret, `${paymentId}|${subscriptionId}`), body.razorpay_signature)) {
        throw new PayError(400, 'We could not verify this payment. If money was taken, contact support with your payment ID.');
      }
      const sub = await razorpay<RzpSubscription>('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
      if (sub.notes?.user_id !== user.id) throw new PayError(403, 'This payment belongs to another account.');
      const row = await syncFromRazorpay(sub, user.id, 'active');
      send(res, 200, { plan: row.plan, status: row.status, currentEnd: row.current_end });
      return true;
    }

    if (route === 'cancel') {
      const subscriptionId = String(body.subscriptionId ?? '');
      const sub = await razorpay<RzpSubscription>('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
      if (sub.notes?.user_id !== user.id) throw new PayError(403, 'This subscription belongs to another account.');
      const cancelled = await razorpay<RzpSubscription>('POST', `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, { cancel_at_cycle_end: 1 });
      const row = await syncFromRazorpay(cancelled, user.id, 'cancelling');
      send(res, 200, { status: row.status, currentEnd: row.current_end });
      return true;
    }

    throw new PayError(404, 'Not found.');
  } catch (err) {
    if (err instanceof PayError) send(res, err.status, { error: { message: err.message } });
    else {
      console.error('[pay] unexpected error:', err);
      send(res, 500, { error: { message: 'Something went wrong with the payment. Please try again.' } });
    }
    return true;
  }
}
