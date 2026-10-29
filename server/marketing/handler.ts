/**
 * Email marketing for the team (framework-free, mounted next to the other routes).
 *
 *   GET  /api/marketing/overview          -> templates, recent sends, unsubscribed count   (admins)
 *   GET  /api/marketing/preview/:id       -> one rendered email (HTML, sample data)         (admins)
 *   POST /api/marketing/send              <- { template, recipients: string[], test?: bool } (admins)
 *   GET  /api/marketing/unsubscribe?e=&s= <- signed link in every marketing email
 *
 * Sends and unsubscribes are kept in a small JSON file (MARKETING_DATA_FILE, default ./data/marketing.json),
 * so the same person never gets the same campaign twice and unsubscribed addresses are always skipped.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHmac } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { MARKETING_TEMPLATES, marketingTemplate, renderMarketingEmail } from '../../shared/marketing.ts';
import { supabaseAdminEnabled, supabaseSecret, userFromToken } from '../supabaseAdmin.ts';
import { emailEnabled, sendEmail } from '../notify/mailer.ts';
import { appUrl } from '../notify/service.ts';

const MAX_PER_REQUEST = 100;
const PAUSE_BETWEEN_MS = 400;

const env = (k: string) => process.env[k]?.trim() || '';
const adminEmails = () => env('ADMIN_EMAILS').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const dataFile = () => resolve(process.cwd(), env('MARKETING_DATA_FILE') || 'data/marketing.json');

interface SentRow {
  email: string;
  template: string;
  at: string;
  by: string;
  test?: boolean;
}
interface MarketingData {
  sent: SentRow[];
  unsubscribed: { email: string; at: string }[];
}

async function loadData(): Promise<MarketingData> {
  try {
    const parsed = JSON.parse(await readFile(dataFile(), 'utf8')) as Partial<MarketingData>;
    return { sent: parsed.sent ?? [], unsubscribed: parsed.unsubscribed ?? [] };
  } catch {
    return { sent: [], unsubscribed: [] };
  }
}
async function saveData(data: MarketingData) {
  await mkdir(dirname(dataFile()), { recursive: true });
  await writeFile(dataFile(), JSON.stringify(data, null, 2));
}

// ------------------------------------------------------------------ signed unsubscribe links

const linkSecret = () => env('NOTIFY_SECRET') || supabaseSecret() || 'dev-only-secret';
const normalizeEmail = (e: string) => e.trim().toLowerCase();
const unsubscribeSig = (email: string) => createHmac('sha256', linkSecret()).update(`mkt-unsub:${normalizeEmail(email)}`).digest('hex').slice(0, 32);
const unsubscribeUrl = (email: string) => `${appUrl()}/api/marketing/unsubscribe?e=${encodeURIComponent(normalizeEmail(email))}&s=${unsubscribeSig(email)}`;

// ------------------------------------------------------------------ recipients

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

/** "Priya <priya@x.com>", "priya@x.com, Priya" or just "priya@x.com" -> { email, name } */
export function parseRecipient(raw: string): { email: string; name?: string } | null {
  const s = raw.trim();
  if (!s) return null;
  const angle = s.match(/^(.*?)<([^>]+)>$/);
  if (angle) {
    const email = normalizeEmail(angle[2]);
    const name = angle[1].replace(/["']/g, '').trim();
    return EMAIL_RE.test(email) ? { email, name: name || undefined } : null;
  }
  const parts = s.split(/[,;\t]+/).map((p) => p.trim()).filter(Boolean);
  const emailPart = parts.find((p) => EMAIL_RE.test(p));
  if (!emailPart) return null;
  const name = parts.find((p) => p !== emailPart && !EMAIL_RE.test(p));
  return { email: normalizeEmail(emailPart), name: name || undefined };
}

// ------------------------------------------------------------------ http helpers

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function html(res: ServerResponse, status: number, page: string) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(page);
}
const simplePage = (title: string, text: string) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0;font-family:system-ui,sans-serif;background:#fdf2f4;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px">
<div style="background:#fff;border:1px solid #fbe1e6;border-radius:20px;padding:32px;max-width:420px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#e11d48">💗 LoveMate</div><h1 style="font-size:20px;margin:16px 0 8px">${title}</h1>
<p style="color:#52525b;line-height:1.6">${text}</p><a href="${appUrl()}" style="color:#e11d48;font-weight:600">Open LoveMate</a></div></body>`;

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

export type SendStatus = 'sent' | 'invalid' | 'unsubscribed' | 'already_sent' | 'duplicate' | 'failed';
export interface SendResult {
  input: string;
  email?: string;
  status: SendStatus;
  error?: string;
}

// ------------------------------------------------------------------ routes

export async function handleMarketing(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/marketing/')) return false;
  const route = url.pathname.slice('/api/marketing/'.length);

  try {
    // Public: the unsubscribe link in every email.
    if (req.method === 'GET' && route === 'unsubscribe') {
      const e = normalizeEmail(url.searchParams.get('e') ?? '');
      if (!e || url.searchParams.get('s') !== unsubscribeSig(e)) {
        html(res, 400, simplePage('Link not valid', 'This unsubscribe link is broken. Reply to the email and we will remove you by hand.'));
        return true;
      }
      const data = await loadData();
      if (!data.unsubscribed.some((u) => u.email === e)) {
        data.unsubscribed.push({ email: e, at: new Date().toISOString() });
        await saveData(data);
      }
      html(res, 200, simplePage('You are unsubscribed', `${e} will not get marketing emails from LoveMate any more.`));
      return true;
    }

    if (!supabaseAdminEnabled()) return send(res, 503, { error: { message: 'Accounts are not set up on this server yet.' } }), true;
    const user = await userFromToken(req);
    if (!user) return send(res, 401, { error: { message: 'Please sign in first.' } }), true;
    if (!adminEmails().includes(user.email.toLowerCase())) return send(res, 403, { error: { message: 'Admins only.' } }), true;

    if (req.method === 'GET' && route === 'overview') {
      const data = await loadData();
      const counts: Record<string, number> = {};
      for (const s of data.sent) if (!s.test) counts[s.template] = (counts[s.template] ?? 0) + 1;
      send(res, 200, {
        emailEnabled: emailEnabled(),
        templates: MARKETING_TEMPLATES.map((t) => ({ ...t, sentCount: counts[t.id] ?? 0 })),
        recent: data.sent.slice(-200).reverse(),
        unsubscribed: data.unsubscribed.length,
        totalSent: data.sent.filter((s) => !s.test).length,
      });
      return true;
    }

    if (req.method === 'GET' && route.startsWith('preview/')) {
      const id = route.slice('preview/'.length);
      const rendered = renderMarketingEmail(id, { appUrl: appUrl(), unsubscribeUrl: '#unsubscribe', name: url.searchParams.get('name') || undefined });
      if (!rendered) return html(res, 404, simplePage('Not found', 'No such template.')), true;
      html(res, 200, rendered.html);
      return true;
    }

    if (req.method === 'POST' && route === 'send') {
      if (!emailEnabled()) return send(res, 503, { error: { message: 'Email sending is not set up on this server (SMTP_USER / SMTP_PASS).' } }), true;
      const body = await readJson(req);
      const template = marketingTemplate(String(body.template ?? ''));
      if (!template) return send(res, 400, { error: { message: 'Choose a template.' } }), true;
      const test = body.test === true;
      const force = body.force === true;
      const inputs = Array.isArray(body.recipients) ? body.recipients.map((r) => String(r)).filter((r) => r.trim()) : [];
      if (!inputs.length) return send(res, 400, { error: { message: 'Add at least one email address.' } }), true;
      if (inputs.length > MAX_PER_REQUEST) return send(res, 400, { error: { message: `Send at most ${MAX_PER_REQUEST} emails at a time.` } }), true;

      const data = await loadData();
      const unsubscribed = new Set(data.unsubscribed.map((u) => u.email));
      const alreadySent = new Set(data.sent.filter((s) => s.template === template.id && !s.test).map((s) => s.email));
      const seen = new Set<string>();
      const results: SendResult[] = [];

      for (const input of inputs) {
        const r = parseRecipient(input);
        if (!r) {
          results.push({ input, status: 'invalid' });
          continue;
        }
        if (seen.has(r.email)) {
          results.push({ input, email: r.email, status: 'duplicate' });
          continue;
        }
        seen.add(r.email);
        if (unsubscribed.has(r.email)) {
          results.push({ input, email: r.email, status: 'unsubscribed' });
          continue;
        }
        if (!test && !force && alreadySent.has(r.email)) {
          results.push({ input, email: r.email, status: 'already_sent' });
          continue;
        }
        const rendered = renderMarketingEmail(template.id, { appUrl: appUrl(), unsubscribeUrl: unsubscribeUrl(r.email), name: r.name });
        if (!rendered) {
          results.push({ input, email: r.email, status: 'failed', error: 'Template did not render.' });
          continue;
        }
        try {
          await sendEmail(r.email, (test ? '[Test] ' : '') + rendered.subject, rendered.html, rendered.text, { 'List-Unsubscribe': `<${unsubscribeUrl(r.email)}>` });
          data.sent.push({ email: r.email, template: template.id, at: new Date().toISOString(), by: user.email, ...(test ? { test: true } : {}) });
          results.push({ input, email: r.email, status: 'sent' });
        } catch (e) {
          results.push({ input, email: r.email, status: 'failed', error: (e as Error).message });
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
    console.error('[marketing] error:', err);
    send(res, 500, { error: { message: 'Something went wrong. Please try again.' } });
    return true;
  }
}
