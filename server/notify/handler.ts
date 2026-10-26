/**
 * Notification routes (framework-free, mounted next to the GenAI gateway and payments).
 *
 *   GET  /api/notify/status            -> { email }                  is email sending set up
 *   GET  /api/notify/preview           -> list of email templates    (sample data, for checking the design)
 *   GET  /api/notify/preview/:type     -> one rendered email
 *   GET  /api/notify/unsubscribe       <- signed link in each email
 *   POST /api/notify/test              -> sends a test email to the signed-in user
 *   POST /api/notify/event             <- the app reports "welcome" or "partner joined"
 *   POST /api/notify/run               <- hourly reminders (x-cron-secret header, for an external cron)
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  NOTIFICATION_CATALOG,
  NOTIFICATION_TYPES,
  renderEmailHtml,
  normalizePrefs,
  renderNotification,
  type NotificationData,
  type NotificationType,
} from '../../shared/notifications.ts';
import { adminHeaders, adminSelect, supabaseUrl, userFromToken } from '../supabaseAdmin.ts';
import { verifyEmail } from './mailer.ts';
import { appUrl, deliverEmail, notificationsEnabled, notifyEvent, runReminders, savePrefs, unsubscribeSig } from './service.ts';

const SAMPLE: Record<NotificationType, NotificationData> = {
  welcome: { userName: 'Priya' },
  date_reminder: { userName: 'Priya', dateTitle: "Arjun's birthday", dateType: 'birthday', daysLeft: 3, dateLabel: '29 Oct 2026' },
  streak_reminder: { userName: 'Priya', streak: 12 },
  partner_joined: { userName: 'Priya', partnerName: 'Arjun' },
  partner_activity: { userName: 'Priya', partnerName: 'Arjun', activity: 'added a new memory' },
  trial_ending: { userName: 'Priya' },
  trial_ended: { userName: 'Priya' },
  payment_success: { userName: 'Priya', planName: 'Plus', amount: '₹149', endDate: '25 Nov 2026', autoRenew: true },
  renewal_reminder: { userName: 'Priya', planName: 'Plus', amount: '₹149', endDate: '25 Nov 2026', autoRenew: true },
  payment_failed: { userName: 'Priya', planName: 'Plus' },
};

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
<p style="color:#52525b;line-height:1.6">${text}</p><a href="${appUrl()}/#/notification-settings" style="color:#e11d48;font-weight:600">Notification settings</a></div></body>`;

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

async function accountEmail(userId: string): Promise<string | null> {
  const res = await fetch(`${supabaseUrl()}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers: adminHeaders() });
  if (!res.ok) return null;
  return ((await res.json()) as { email?: string }).email ?? null;
}

export async function handleNotify(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/notify/')) return false;
  const route = url.pathname.slice('/api/notify/'.length);

  try {
    if (req.method === 'GET' && route === 'status') {
      send(res, 200, { email: notificationsEnabled() });
      return true;
    }

    if (req.method === 'GET' && route === 'preview') {
      const items = NOTIFICATION_TYPES.map((t) => `<li style="margin:6px 0"><a href="/api/notify/preview/${t}" style="color:#e11d48">${NOTIFICATION_CATALOG[t].label}</a> <span style="color:#71717a">· ${renderNotification(t, SAMPLE[t]).emailSubject}</span></li>`).join('');
      html(res, 200, `<!doctype html><meta charset="utf-8"><title>LoveMate email templates</title><body style="font-family:system-ui;padding:24px;max-width:720px;margin:auto"><h1>LoveMate email templates</h1><p style="color:#71717a">Sample data. Real emails use each person's own names and dates.</p><ul>${items}</ul></body>`);
      return true;
    }
    const previewType = route.startsWith('preview/') ? (route.slice(8) as NotificationType) : null;
    if (req.method === 'GET' && previewType) {
      if (!NOTIFICATION_CATALOG[previewType]) return html(res, 404, simplePage('Not found', 'No such template.')), true;
      const n = renderNotification(previewType, SAMPLE[previewType]);
      html(res, 200, renderEmailHtml(previewType, n, {
        appUrl: appUrl(),
        unsubscribeUrl: NOTIFICATION_CATALOG[previewType].emailRequired ? undefined : '#unsubscribe',
        manageUrl: '#manage',
        footerAddress: process.env.MAIL_FOOTER_ADDRESS || undefined,
      }));
      return true;
    }

    if (req.method === 'GET' && route === 'unsubscribe') {
      const u = url.searchParams.get('u') ?? '';
      const t = url.searchParams.get('t') ?? '';
      if (!u || !t || url.searchParams.get('s') !== unsubscribeSig(u, t) || !NOTIFICATION_CATALOG[t as NotificationType]) {
        html(res, 400, simplePage('Link not valid', 'This unsubscribe link is broken or expired. You can change emails in your notification settings.'));
        return true;
      }
      const rows = await adminSelect<{ value: string | null }>(`user_state?user_id=eq.${encodeURIComponent(u)}&key=eq.lovemate_notify_prefs_v1&select=value`);
      const prefs = normalizePrefs(rows[0]?.value ? JSON.parse(rows[0].value) : null);
      prefs.channels[t as NotificationType].email = false;
      await savePrefs(u, prefs);
      html(res, 200, simplePage('You are unsubscribed', `You won't get "${NOTIFICATION_CATALOG[t as NotificationType].label}" emails any more. Other notifications are unchanged.`));
      return true;
    }

    if (req.method !== 'POST') return send(res, 405, { error: { message: 'Method not allowed.' } }), true;

    if (route === 'run') {
      const secret = process.env.NOTIFY_CRON_SECRET?.trim();
      if (!secret || req.headers['x-cron-secret'] !== secret) return send(res, 403, { error: { message: 'Forbidden.' } }), true;
      send(res, 200, await runReminders());
      return true;
    }

    if (!notificationsEnabled()) return send(res, 503, { error: { message: 'Email notifications are not set up on this server yet.' } }), true;
    const user = await userFromToken(req);
    if (!user) return send(res, 401, { error: { message: 'Please sign in first.' } }), true;
    const body = await readJson(req);

    if (route === 'test') {
      const check = await verifyEmail();
      if (!check.ok) return send(res, 502, { error: { message: `Email server problem: ${check.message}` } }), true;
      await deliverEmail(user.id, user.email, 'welcome', { userName: String(body.name ?? '') || undefined });
      send(res, 200, { ok: true, message: `Test email sent to ${user.email}.` });
      return true;
    }

    if (route === 'event') {
      const type = String(body.type ?? '');
      const name = typeof body.name === 'string' ? body.name.slice(0, 60) : undefined;
      if (type === 'welcome') {
        const sent = await notifyEvent(user, 'welcome', { userName: name }, `welcome:${user.id}`);
        send(res, 200, { sent });
        return true;
      }
      if (type === 'partner_joined') {
        // The person who just joined tells the server; the email goes to the partner who shared the code.
        const mine = await adminSelect<{ couple_id: string }>(`couple_members?user_id=eq.${user.id}&select=couple_id`);
        if (!mine[0]) return send(res, 400, { error: { message: 'Not linked with a partner.' } }), true;
        const others = await adminSelect<{ user_id: string; display_name: string | null }>(`couple_members?couple_id=eq.${mine[0].couple_id}&user_id=neq.${user.id}&select=user_id,display_name`);
        const partner = others[0];
        const email = partner ? await accountEmail(partner.user_id) : null;
        if (!partner || !email) return send(res, 200, { sent: false }), true;
        const sent = await notifyEvent({ id: partner.user_id, email }, 'partner_joined', { userName: partner.display_name ?? undefined, partnerName: name }, `partner_joined:${mine[0].couple_id}`);
        send(res, 200, { sent });
        return true;
      }
      return send(res, 400, { error: { message: 'Unknown event.' } }), true;
    }

    send(res, 404, { error: { message: 'Not found.' } });
    return true;
  } catch (err) {
    console.error('[notify] error:', err);
    send(res, 500, { error: { message: 'Something went wrong while sending the notification.' } });
    return true;
  }
}
