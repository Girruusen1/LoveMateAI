/**
 * Sends notification emails: respects each user's settings and quiet hours, and records what was sent
 * (table notification_log) so the same reminder never goes out twice.
 */
import { createHmac } from 'node:crypto';
import {
  NOTIFICATION_CATALOG,
  dueReminders,
  inQuietHours,
  normalizePrefs,
  renderEmailHtml,
  renderEmailText,
  renderNotification,
  wantsChannel,
  type NotificationData,
  type NotificationPrefs,
  type NotificationType,
  type ReminderInput,
} from '../../shared/notifications.ts';
import { adminSelect, adminUpsert, listUsers, supabaseAdminEnabled, supabaseSecret } from '../supabaseAdmin.ts';
import { emailEnabled, sendEmail } from './mailer.ts';

const env = (k: string) => process.env[k]?.trim() || '';
export const appUrl = () => (env('LOVEMATE_PUBLIC_URL') || 'http://localhost:5173').replace(/\/$/, '');
export const notificationsEnabled = () => emailEnabled() && supabaseAdminEnabled();

const KEYS = {
  user: 'lovemate_user_v2',
  dates: 'lovemate_dates_v2',
  subscription: 'lovemate_subscription_v5',
  daily: 'lovemate_daily_v1',
  prefs: 'lovemate_notify_prefs_v1',
} as const;

// ------------------------------------------------------------------ signed unsubscribe links

const linkSecret = () => env('NOTIFY_SECRET') || supabaseSecret() || 'dev-only-secret';
export const unsubscribeSig = (userId: string, type: string) => createHmac('sha256', linkSecret()).update(`unsub:${userId}:${type}`).digest('hex').slice(0, 32);
export const unsubscribeUrl = (userId: string, type: string) =>
  `${appUrl()}/api/notify/unsubscribe?u=${encodeURIComponent(userId)}&t=${encodeURIComponent(type)}&s=${unsubscribeSig(userId, type)}`;

// ------------------------------------------------------------------ helpers

interface StateRow {
  user_id: string;
  key: string;
  value: string | null;
}
const parse = <T>(v: string | null | undefined, fallback: T): T => {
  try {
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

async function loadPrefs(userId: string): Promise<NotificationPrefs> {
  const rows = await adminSelect<StateRow>(`user_state?user_id=eq.${userId}&key=eq.${KEYS.prefs}&select=value`);
  return normalizePrefs(parse(rows[0]?.value, null));
}

export async function savePrefs(userId: string, prefs: NotificationPrefs) {
  await adminUpsert('user_state', [{ user_id: userId, key: KEYS.prefs, value: JSON.stringify(prefs), updated_at: new Date().toISOString() }]);
}

async function alreadySent(userId: string, key: string): Promise<boolean> {
  const rows = await adminSelect<{ key: string }>(`notification_log?user_id=eq.${userId}&key=eq.${encodeURIComponent(key)}&channel=eq.email&select=key`);
  return rows.length > 0;
}
const markSent = (userId: string, key: string, type: NotificationType) =>
  adminUpsert('notification_log', [{ user_id: userId, key, type, channel: 'email', sent_at: new Date().toISOString() }]);

/** Render and send one notification email (no checks). */
export async function deliverEmail(userId: string, to: string, type: NotificationType, data: NotificationData) {
  const n = renderNotification(type, data);
  const required = NOTIFICATION_CATALOG[type].emailRequired;
  const unsub = required ? undefined : unsubscribeUrl(userId, type);
  const html = renderEmailHtml(type, n, { appUrl: appUrl(), unsubscribeUrl: unsub, manageUrl: `${appUrl()}/#/notification-settings`, footerAddress: env('MAIL_FOOTER_ADDRESS') || undefined });
  await sendEmail(to, n.emailSubject, html, renderEmailText(n, appUrl()), unsub ? { 'List-Unsubscribe': `<${unsub}>` } : {});
}

/**
 * An event email right now (partner joined, payment received…), if the user wants it.
 * `key` dedupes (e.g. one receipt per payment). Returns whether an email was sent.
 */
export async function notifyEvent(user: { id: string; email: string }, type: NotificationType, data: NotificationData, key: string): Promise<boolean> {
  if (!notificationsEnabled()) return false;
  const prefs = await loadPrefs(user.id);
  if (!wantsChannel(prefs, type, 'email')) return false;
  if (await alreadySent(user.id, key)) return false;
  await deliverEmail(user.id, user.email, type, data);
  await markSent(user.id, key, type);
  return true;
}

// ------------------------------------------------------------------ hourly reminders

/** Builds every user's reminder input from the database and emails what is due. */
export async function runReminders(now = new Date()): Promise<{ users: number; sent: number; skipped: number; errors: number }> {
  const stats = { users: 0, sent: 0, skipped: 0, errors: 0 };
  if (!notificationsEnabled()) return stats;

  const users = await listUsers();
  stats.users = users.length;
  const keys = Object.values(KEYS).join(',');
  const [state, members, sharedDates, paid, sentLog] = await Promise.all([
    adminSelect<StateRow>(`user_state?key=in.(${keys})&select=user_id,key,value`),
    adminSelect<{ couple_id: string; user_id: string; display_name: string | null }>('couple_members?select=couple_id,user_id,display_name'),
    adminSelect<{ couple_id: string; value: string | null }>(`couple_state?key=eq.${KEYS.dates}&select=couple_id,value`),
    adminSelect<{ user_id: string; plan: string; status: string; current_end: string | null }>('subscriptions?select=user_id,plan,status,current_end').catch(() => []),
    adminSelect<{ user_id: string; key: string }>(`notification_log?channel=eq.email&sent_at=gte.${new Date(now.getTime() - 400 * 86_400_000).toISOString()}&select=user_id,key`),
  ]);

  const byUser = new Map<string, Record<string, string | null>>();
  for (const r of state) byUser.set(r.user_id, { ...(byUser.get(r.user_id) ?? {}), [r.key]: r.value });
  const sent = new Set(sentLog.map((r) => `${r.user_id}|${r.key}`));

  for (const u of users) {
    try {
      const s = byUser.get(u.id) ?? {};
      const prefs = normalizePrefs(parse(s[KEYS.prefs], null));
      if (inQuietHours(prefs, now)) continue;
      const profile = parse<{ name?: string; streak?: number; partnerName?: string }>(s[KEYS.user], {});
      const me = members.find((m) => m.user_id === u.id);
      const partner = me ? members.find((m) => m.couple_id === me.couple_id && m.user_id !== u.id) : undefined;
      // Linked partners keep their dates in the shared space.
      const coupleDates = me ? sharedDates.find((d) => d.couple_id === me.couple_id)?.value : null;
      const input: ReminderInput = {
        userName: profile.name,
        partnerName: partner?.display_name || profile.partnerName,
        importantDates: parse(coupleDates ?? s[KEYS.dates], []),
        subscription: parse(s[KEYS.subscription], undefined),
        paid: paid.find((p) => p.user_id === u.id) ?? null,
        streak: profile.streak,
        lastActive: parse<{ lastActive?: string }>(s[KEYS.daily], {}).lastActive,
      };
      for (const due of dueReminders(input, now)) {
        if (!wantsChannel(prefs, due.type, 'email') || sent.has(`${u.id}|${due.key}`)) {
          stats.skipped++;
          continue;
        }
        await deliverEmail(u.id, u.email, due.type, due.data);
        await markSent(u.id, due.key, due.type);
        sent.add(`${u.id}|${due.key}`);
        stats.sent++;
      }
    } catch (e) {
      stats.errors++;
      console.warn(`[notify] reminders for ${u.id} failed:`, (e as Error).message);
    }
  }
  return stats;
}
