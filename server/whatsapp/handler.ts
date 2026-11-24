/**
 * WhatsApp template messages for the team (framework-free, mounted next to the other routes).
 *
 *   GET  /api/whatsapp/overview   -> enabled flags, templates, every message with its delivery state   (admins)
 *   POST /api/whatsapp/send       <- { template, language, recipients: string[] }                      (admins)
 *   POST /api/whatsapp/status     <- { statuses: [{ messageId, status, recipient, at, error }] }        (gateway)
 *
 * Sending goes straight to Meta's Cloud API with WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
 * Meta reports sent / delivered / read / failed only to the webhook of the app that owns the number,
 * which is the Researchers App server; it forwards those receipts here (POST /status, shared
 * WHATSAPP_STATUS_SECRET). Rows live in a JSON file (WHATSAPP_DATA_FILE, default ./data/whatsapp.json),
 * so the admin page can show who received and who opened each message.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { supabaseAdminEnabled, userFromToken } from '../supabaseAdmin.ts';

const MAX_PER_REQUEST = 100;
const PAUSE_BETWEEN_MS = 250;
const GRAPH = 'https://graph.facebook.com/v21.0';

const env = (k: string) => process.env[k]?.trim() || '';
const adminEmails = () => env('ADMIN_EMAILS').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const dataFile = () => resolve(process.cwd(), env('WHATSAPP_DATA_FILE') || 'data/whatsapp.json');
export const whatsappEnabled = () => !!(env('WHATSAPP_ACCESS_TOKEN') && env('WHATSAPP_PHONE_NUMBER_ID'));
const statusSecret = () => env('WHATSAPP_STATUS_SECRET');

/** Templates approved (or submitted) on the consultquark number. {{1}} is the first name. */
export const WHATSAPP_TEMPLATES = [
  { name: 'lovemate_intro_v2', label: 'LoveMate intro (link lovemate.duckdns.org)', languages: ['en_US', 'hi'] },
  { name: 'lovemate_intro_v1', label: 'LoveMate intro, old link (lovemateai.in)', languages: ['en_US', 'hi'] },
] as const;

export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';
export interface MessageRow {
  id: string; // Meta's wamid
  phone: string; // digits with country code
  name: string;
  template: string;
  language: string;
  by: string;
  sentAt: string;
  status: DeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  error?: string;
}
interface WhatsAppData {
  messages: MessageRow[];
}

async function loadData(): Promise<WhatsAppData> {
  try {
    const parsed = JSON.parse(await readFile(dataFile(), 'utf8')) as Partial<WhatsAppData>;
    return { messages: parsed.messages ?? [] };
  } catch {
    return { messages: [] };
  }
}
async function saveData(data: WhatsAppData) {
  await mkdir(dirname(dataFile()), { recursive: true });
  await writeFile(dataFile(), JSON.stringify(data, null, 2));
}

// ------------------------------------------------------------------ recipients

/** "Pooja, +91 79875 14313", "+917987514313 Pooja" or just the number -> { phone, name }. Indian 10-digit numbers get 91. */
export function parseRecipient(raw: string): { phone: string; name: string } | null {
  const s = raw.trim();
  if (!s) return null;
  const numberMatch = s.match(/\+?\d[\d\s().-]{7,}\d/);
  if (!numberMatch) return null;
  let digits = numberMatch[0].replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) digits = `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11 && /^0[6-9]/.test(digits)) digits = `91${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  const name = s.replace(numberMatch[0], ' ').replace(/[,;|\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { phone: digits, name: name || 'there' };
}

// ------------------------------------------------------------------ Meta send

async function sendTemplate(phone: string, name: string, template: string, language: string): Promise<{ id: string } | { error: string }> {
  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: { name: template, language: { code: language }, components: [{ type: 'body', parameters: [{ type: 'text', text: name }] }] },
  };
  try {
    const res = await fetch(`${GRAPH}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('WHATSAPP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; error_data?: { details?: string } } };
    if (!res.ok || !json.messages?.[0]?.id) {
      return { error: json.error?.error_data?.details || json.error?.message || `Meta answered ${res.status}` };
    }
    return { id: json.messages[0].id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ------------------------------------------------------------------ helpers

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 200_000) throw new Error('too large');
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const secretMatches = (given: string) => {
  const want = statusSecret();
  if (!want || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
};

const RANK: Record<DeliveryStatus, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

/** Apply one receipt to its row. Read beats delivered beats sent; failed is final. */
export function applyStatus(row: MessageRow, status: string, at: string | null, error: string | null): boolean {
  if (status !== 'sent' && status !== 'delivered' && status !== 'read' && status !== 'failed') return false;
  const when = at ?? new Date().toISOString();
  if (status === 'delivered' && !row.deliveredAt) row.deliveredAt = when;
  if (status === 'read') {
    if (!row.readAt) row.readAt = when;
    if (!row.deliveredAt) row.deliveredAt = when;
  }
  if (status === 'failed') {
    row.failedAt = when;
    if (error) row.error = error;
  }
  if (RANK[status] > RANK[row.status]) row.status = status;
  return true;
}

export type SendStatus = 'sent' | 'invalid' | 'duplicate' | 'failed';
export interface SendResult {
  input: string;
  phone?: string;
  name?: string;
  status: SendStatus;
  error?: string;
}

// ------------------------------------------------------------------ routes

export async function handleWhatsApp(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/whatsapp/')) return false;
  const route = url.pathname.slice('/api/whatsapp/'.length);

  try {
    // Delivery receipts forwarded by the server that owns the number's webhook.
    if (req.method === 'POST' && route === 'status') {
      if (!statusSecret()) return send(res, 503, { error: { message: 'WHATSAPP_STATUS_SECRET is not set on this server.' } }), true;
      if (!secretMatches(String(req.headers['x-status-secret'] ?? ''))) return send(res, 401, { error: { message: 'Bad secret.' } }), true;
      const body = await readJson(req);
      const list = Array.isArray(body.statuses) ? (body.statuses as Record<string, unknown>[]) : [];
      const data = await loadData();
      const byId = new Map(data.messages.map((m) => [m.id, m]));
      let applied = 0;
      for (const s of list) {
        const row = byId.get(String(s.messageId ?? ''));
        if (!row) continue; // a Researchers App message, not ours
        const atMs = Number(s.at);
        if (applyStatus(row, String(s.status ?? ''), Number.isFinite(atMs) && atMs > 0 ? new Date(atMs).toISOString() : null, s.error ? String(s.error) : null)) applied++;
      }
      if (applied) await saveData(data);
      send(res, 200, { ok: true, applied });
      return true;
    }

    if (!supabaseAdminEnabled()) return send(res, 503, { error: { message: 'Accounts are not set up on this server yet.' } }), true;
    const user = await userFromToken(req);
    if (!user) return send(res, 401, { error: { message: 'Please sign in first.' } }), true;
    if (!adminEmails().includes(user.email.toLowerCase())) return send(res, 403, { error: { message: 'Admins only.' } }), true;

    if (req.method === 'GET' && route === 'overview') {
      const data = await loadData();
      const counts = { total: data.messages.length, sent: 0, delivered: 0, read: 0, failed: 0 };
      for (const m of data.messages) counts[m.status]++;
      send(res, 200, {
        enabled: whatsappEnabled(),
        receiptsEnabled: !!statusSecret(),
        templates: WHATSAPP_TEMPLATES,
        messages: data.messages.slice(-500).reverse(),
        counts,
      });
      return true;
    }

    if (req.method === 'POST' && route === 'send') {
      if (!whatsappEnabled()) return send(res, 503, { error: { message: 'WhatsApp is not set up on this server (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).' } }), true;
      const body = await readJson(req);
      const template = WHATSAPP_TEMPLATES.find((t) => t.name === String(body.template ?? ''));
      if (!template) return send(res, 400, { error: { message: 'Choose a template.' } }), true;
      const language = String(body.language ?? '');
      if (!(template.languages as readonly string[]).includes(language)) return send(res, 400, { error: { message: 'Choose a language.' } }), true;
      const inputs = Array.isArray(body.recipients) ? body.recipients.map((r) => String(r)).filter((r) => r.trim()) : [];
      if (!inputs.length) return send(res, 400, { error: { message: 'Add at least one phone number.' } }), true;
      if (inputs.length > MAX_PER_REQUEST) return send(res, 400, { error: { message: `Send at most ${MAX_PER_REQUEST} messages at a time.` } }), true;

      const data = await loadData();
      const seen = new Set<string>();
      const results: SendResult[] = [];
      for (const input of inputs) {
        const r = parseRecipient(input);
        if (!r) {
          results.push({ input, status: 'invalid' });
          continue;
        }
        if (seen.has(r.phone)) {
          results.push({ input, phone: r.phone, name: r.name, status: 'duplicate' });
          continue;
        }
        seen.add(r.phone);
        const out = await sendTemplate(r.phone, r.name, template.name, language);
        if ('error' in out) {
          results.push({ input, phone: r.phone, name: r.name, status: 'failed', error: out.error });
        } else {
          data.messages.push({ id: out.id, phone: r.phone, name: r.name, template: template.name, language, by: user.email, sentAt: new Date().toISOString(), status: 'sent' });
          results.push({ input, phone: r.phone, name: r.name, status: 'sent' });
        }
        if (results.length < inputs.length) await sleep(PAUSE_BETWEEN_MS);
      }
      await saveData(data);
      send(res, 200, { ok: true, results, sent: results.filter((r) => r.status === 'sent').length });
      return true;
    }

    send(res, 404, { error: { message: 'Not found.' } });
    return true;
  } catch (err) {
    console.error('[whatsapp] error:', err);
    send(res, 500, { error: { message: 'Something went wrong. Please try again.' } });
    return true;
  }
}
