/**
 * Account routes that need the server's secret key (framework-free, mounted next to the others).
 *
 *   POST /api/referral/claim        <- new user enters a friend's invite code; both get free Plus days
 *   GET  /api/admin/me              -> { admin }                (ADMIN_EMAILS decides who is an admin)
 *   GET  /api/admin/overview        -> real numbers for the admin dashboard
 *   POST /api/admin/ticket          <- admin replies to / updates a support ticket (emails the user)
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { adminInsert, adminPatch, adminSelect, adminUpsert, listUsers, supabaseAdminEnabled, userFromToken } from '../supabaseAdmin.ts';
import { notifyEvent } from '../notify/service.ts';

const REFERRAL_DAYS = 7;
const MAX_REWARDED_REFERRALS = 10;
const PRICES: Record<string, Record<string, number>> = { plus: { monthly: 149, yearly: 999 }, couple: { monthly: 249, yearly: 1799 } };

/** Everyone's invite code is derived from their account id, so no table is needed to look it up. */
export const referralCode = (userId: string) => 'LM-' + userId.replace(/-/g, '').slice(0, 8).toUpperCase();

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 20_000) throw new Error('too large');
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

interface PlanRow {
  user_id: string;
  plan: string;
  cycle: string | null;
  status: string;
  current_end: string | null;
  razorpay_subscription_id: string | null;
}

/** Adds free Plus days. Paying, auto-renewing members are left alone (they already have the plan). */
async function grantPlusDays(userId: string, days: number) {
  const [row] = await adminSelect<PlanRow>(`subscriptions?user_id=eq.${userId}&select=*`);
  const now = Date.now();
  const end = row?.current_end ? Date.parse(row.current_end) : 0;
  if (row && ['active', 'cancelling', 'past_due'].includes(row.status) && end > now) return;
  const from = row && ['prepaid', 'bonus'].includes(row.status) && end > now ? end : now;
  await adminUpsert(
    'subscriptions',
    [
      {
        user_id: userId,
        plan: row?.status === 'prepaid' && end > now ? row.plan : 'plus',
        cycle: row?.status === 'prepaid' && end > now ? row.cycle : null,
        status: row?.status === 'prepaid' && end > now ? 'prepaid' : 'bonus',
        current_end: new Date(from + days * 86_400_000).toISOString(),
        razorpay_subscription_id: row?.status === 'prepaid' && end > now ? row.razorpay_subscription_id : null,
        updated_at: new Date().toISOString(),
      },
    ],
    'user_id'
  );
}

export async function handleAccount(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  if (!path.startsWith('/api/referral/') && !path.startsWith('/api/admin/')) return false;

  try {
    if (!supabaseAdminEnabled()) return send(res, 503, { error: { message: 'Accounts are not set up on this server yet.' } }), true;
    const user = await userFromToken(req);
    if (!user) return send(res, 401, { error: { message: 'Please sign in first.' } }), true;

    // ---------------- referrals
    if (path === '/api/referral/claim' && req.method === 'POST') {
      const code = String((await readJson(req)).code ?? '').trim().toUpperCase();
      if (!/^LM-[0-9A-F]{8}$/.test(code)) return send(res, 400, { error: { message: 'Invite codes look like LM-1A2B3C4D.' } }), true;
      if (code === referralCode(user.id)) return send(res, 400, { error: { message: "That's your own invite code. Share it with friends instead." } }), true;
      if ((await adminSelect(`referrals?referred_id=eq.${user.id}&select=referred_id`)).length) {
        return send(res, 409, { error: { message: 'You have already used an invite code.' } }), true;
      }
      const accounts = await listUsers();
      const me = accounts.find((a) => a.id === user.id);
      // Only new accounts (first 14 days) can be referred, so people can't swap codes later for free days.
      if (me?.created_at && Date.now() - Date.parse(me.created_at) > 14 * 86_400_000) {
        return send(res, 400, { error: { message: 'Invite codes can be used within 14 days of signing up.' } }), true;
      }
      const referrer = accounts.find((a) => referralCode(a.id) === code);
      if (!referrer) return send(res, 404, { error: { message: "We couldn't find that invite code." } }), true;
      await adminInsert('referrals', [{ referred_id: user.id, referrer_id: referrer.id, code }]);
      await grantPlusDays(user.id, REFERRAL_DAYS);
      const rewarded = await adminSelect(`referrals?referrer_id=eq.${referrer.id}&select=referred_id`);
      if (rewarded.length <= MAX_REWARDED_REFERRALS) await grantPlusDays(referrer.id, REFERRAL_DAYS);
      send(res, 200, { ok: true, days: REFERRAL_DAYS });
      return true;
    }

    // ---------------- admin
    const isAdmin = adminEmails().includes(user.email.toLowerCase());
    if (path === '/api/admin/me' && req.method === 'GET') return send(res, 200, { admin: isAdmin }), true;
    if (!isAdmin) return send(res, 403, { error: { message: 'Admins only.' } }), true;

    if (path === '/api/admin/overview' && req.method === 'GET') {
      const [accounts, plans, tickets, referrals, members, sent] = await Promise.all([
        listUsers(),
        adminSelect<PlanRow>('subscriptions?select=*').catch(() => []),
        adminSelect<Record<string, unknown>>('support_tickets?select=*&order=created_at.desc&limit=100').catch(() => []),
        adminSelect<{ created_at: string }>('referrals?select=created_at').catch(() => []),
        adminSelect<{ couple_id: string }>('couple_members?select=couple_id').catch(() => []),
        adminSelect<{ sent_at: string }>(`notification_log?sent_at=gte.${new Date(Date.now() - 7 * 86_400_000).toISOString()}&select=sent_at`).catch(() => []),
      ]);
      const now = Date.now();
      const since = (days: number) => accounts.filter((a) => a.created_at && now - Date.parse(a.created_at) <= days * 86_400_000).length;
      const live = plans.filter((p) => ['active', 'cancelling', 'past_due', 'prepaid', 'bonus'].includes(p.status) && (!p.current_end || Date.parse(p.current_end) > now));
      const paying = live.filter((p) => p.status !== 'bonus');
      const monthly = paying.reduce((sum, p) => sum + (p.cycle === 'yearly' ? (PRICES[p.plan]?.yearly ?? 0) / 12 : (PRICES[p.plan]?.monthly ?? 0)), 0);
      const coupleCounts = new Map<string, number>();
      for (const m of members) coupleCounts.set(m.couple_id, (coupleCounts.get(m.couple_id) ?? 0) + 1);
      const byEmail = new Map(accounts.map((a) => [a.id, a.email]));
      send(res, 200, {
        users: {
          total: accounts.length,
          new7d: since(7),
          new30d: since(30),
          active7d: accounts.filter((a) => a.last_sign_in_at && now - Date.parse(a.last_sign_in_at) <= 7 * 86_400_000).length,
          recent: [...accounts]
            .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
            .slice(0, 15)
            .map((a) => ({ email: a.email, created_at: a.created_at, last_sign_in_at: a.last_sign_in_at })),
        },
        plans: {
          plus: paying.filter((p) => p.plan === 'plus').length,
          couple: paying.filter((p) => p.plan === 'couple').length,
          bonus: live.filter((p) => p.status === 'bonus').length,
          cancelling: live.filter((p) => p.status === 'cancelling').length,
          failed: plans.filter((p) => p.status === 'halted').length,
          estimatedMonthlyRevenue: Math.round(monthly),
        },
        couples: [...coupleCounts.values()].filter((n) => n >= 2).length,
        referrals: { total: referrals.length, last30d: referrals.filter((r) => now - Date.parse(r.created_at) <= 30 * 86_400_000).length },
        emailsSent7d: sent.length,
        tickets: tickets.map((t) => ({ ...t, email: t.email ?? byEmail.get(String(t.user_id)) ?? '' })),
      });
      return true;
    }

    if (path === '/api/admin/ticket' && req.method === 'POST') {
      const body = await readJson(req);
      const id = String(body.id ?? '');
      const status = ['open', 'in_progress', 'waiting', 'resolved', 'closed'].includes(String(body.status)) ? String(body.status) : null;
      const reply = typeof body.reply === 'string' ? body.reply.trim().slice(0, 4000) : '';
      if (!/^[0-9a-f-]{36}$/.test(id) || (!status && !reply)) return send(res, 400, { error: { message: 'Choose a ticket and a status or reply.' } }), true;
      const [ticket] = await adminSelect<{ user_id: string; email: string | null; subject: string }>(`support_tickets?id=eq.${id}&select=user_id,email,subject`);
      if (!ticket) return send(res, 404, { error: { message: 'Ticket not found.' } }), true;
      await adminPatch('support_tickets', `id=eq.${id}`, { ...(status ? { status } : {}), ...(reply ? { reply } : {}), updated_at: new Date().toISOString() });
      let emailed = false;
      if (reply && ticket.email) {
        emailed = await notifyEvent({ id: ticket.user_id, email: ticket.email }, 'support_reply', { ticketSubject: ticket.subject, replyText: reply }, `support_reply:${id}:${Date.now()}`).catch(() => false);
      }
      send(res, 200, { ok: true, emailed });
      return true;
    }

    send(res, 404, { error: { message: 'Not found.' } });
    return true;
  } catch (err) {
    console.error('[account] error:', err);
    send(res, 500, { error: { message: 'Something went wrong. Please try again.' } });
    return true;
  }
}
