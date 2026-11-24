/**
 * LoveMate notifications: one catalogue, one set of templates, one set of rules.
 * Used by the website (bell + browser pop-ups) and by the server (emails, later WhatsApp),
 * so a reminder reads the same everywhere. Only dependency-free shared imports: this file runs in the browser and in Node.
 */
import { SOCIAL } from './links.ts';

export type NotificationType =
  | 'welcome'
  | 'date_reminder'
  | 'streak_reminder'
  | 'partner_joined'
  | 'partner_activity'
  | 'trial_ending'
  | 'trial_ended'
  | 'payment_success'
  | 'renewal_reminder'
  | 'payment_failed'
  | 'support_reply';

export type Channel = 'inApp' | 'email' | 'browser';
export type NotificationCategory = 'reminders' | 'partner' | 'account';

export interface CatalogEntry {
  label: string;
  description: string;
  category: NotificationCategory;
  defaults: Record<Channel, boolean>;
  /** Receipts and payment problems are always emailed (they are about money, not engagement). */
  emailRequired?: boolean;
  /** Shown on the website only (no email version yet). */
  noEmail?: boolean;
}

export const NOTIFICATION_CATALOG: Record<NotificationType, CatalogEntry> = {
  welcome: {
    label: 'Welcome',
    description: 'A short hello with the best tools to start with.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: false },
  },
  date_reminder: {
    label: 'Birthdays & anniversaries',
    description: 'A heads-up 7, 3 and 1 day before your important dates, and on the day.',
    category: 'reminders',
    defaults: { inApp: true, email: true, browser: true },
  },
  streak_reminder: {
    label: 'Streak reminder',
    description: 'An evening nudge when your daily streak is about to break.',
    category: 'reminders',
    defaults: { inApp: true, email: false, browser: true },
  },
  partner_joined: {
    label: 'Partner joined',
    description: 'When your partner links with you using your invite code.',
    category: 'partner',
    defaults: { inApp: true, email: true, browser: true },
  },
  partner_activity: {
    label: 'Partner activity',
    description: 'When your partner adds a memory, plan or wish to your shared space.',
    category: 'partner',
    defaults: { inApp: true, email: false, browser: true },
    noEmail: true,
  },
  trial_ending: {
    label: 'Trial ending',
    description: 'A day before your free Plus trial ends.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: false },
  },
  trial_ended: {
    label: 'Trial ended',
    description: 'When your free Plus trial is over.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: false },
  },
  payment_success: {
    label: 'Payment receipts',
    description: 'Confirmation when a payment goes through.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: false },
    emailRequired: true,
  },
  renewal_reminder: {
    label: 'Plan renewal',
    description: '3 days before your plan renews or runs out.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: false },
  },
  payment_failed: {
    label: 'Payment problems',
    description: 'If a renewal payment fails, so you keep your plan.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: true },
    emailRequired: true,
  },
  support_reply: {
    label: 'Support replies',
    description: 'When the LoveMate team answers your support request.',
    category: 'account',
    defaults: { inApp: true, email: true, browser: true },
    emailRequired: true,
  },
};

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_CATALOG) as NotificationType[];

export interface NotificationPrefs {
  channels: Record<NotificationType, Record<Channel, boolean>>;
  /** No emails or pop-ups between these hours (India time). In-app notifications still collect. */
  quietHours: { enabled: boolean; start: number; end: number };
}

export function defaultPrefs(): NotificationPrefs {
  const channels = {} as NotificationPrefs['channels'];
  for (const t of NOTIFICATION_TYPES) channels[t] = { ...NOTIFICATION_CATALOG[t].defaults };
  return { channels, quietHours: { enabled: true, start: 22, end: 8 } };
}

/** Saved prefs merged over the defaults, so new notification types get sensible settings. */
export function normalizePrefs(saved: Partial<NotificationPrefs> | null | undefined): NotificationPrefs {
  const base = defaultPrefs();
  if (!saved) return base;
  for (const t of NOTIFICATION_TYPES) base.channels[t] = { ...base.channels[t], ...(saved.channels?.[t] ?? {}) };
  if (saved.quietHours) base.quietHours = { ...base.quietHours, ...saved.quietHours };
  return base;
}

export function wantsChannel(prefs: NotificationPrefs, type: NotificationType, channel: Channel): boolean {
  if (channel === 'email' && NOTIFICATION_CATALOG[type].noEmail) return false;
  if (channel === 'email' && NOTIFICATION_CATALOG[type].emailRequired) return true;
  return !!prefs.channels[type]?.[channel];
}

/** Current hour in India (all scheduling uses IST, where nearly all users are). */
export function istHour(now: Date): number {
  return Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(now));
}
export function istDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now); // YYYY-MM-DD
}

export function inQuietHours(prefs: NotificationPrefs, now: Date): boolean {
  const { enabled, start, end } = prefs.quietHours;
  if (!enabled || start === end) return false;
  const h = istHour(now);
  return start < end ? h >= start && h < end : h >= start || h < end;
}

// ------------------------------------------------------------------ templates

export interface NotificationData {
  userName?: string;
  partnerName?: string;
  /** date_reminder */
  dateTitle?: string;
  dateType?: string;
  daysLeft?: number;
  dateLabel?: string;
  /** streak_reminder */
  streak?: number;
  /** partner_activity */
  activity?: string;
  /** trial / plans */
  planName?: string;
  amount?: string;
  endDate?: string;
  autoRenew?: boolean;
  /** support_reply */
  ticketSubject?: string;
  replyText?: string;
}

export interface RenderedNotification {
  emoji: string;
  title: string;
  body: string;
  /** Page to open from the notification or email button. */
  actionTab: string;
  actionLabel: string;
  emailSubject: string;
  /** Short line shown in inbox previews. */
  emailPreheader: string;
  /** Extra paragraphs for the email. */
  emailParagraphs: string[];
  /** Text for a future WhatsApp template (Meta needs each one approved). */
  whatsapp: string;
}

const first = (name?: string) => (name || 'there').split(' ')[0];

function when(days: number) {
  return days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
}

export function renderNotification(type: NotificationType, d: NotificationData): RenderedNotification {
  const name = first(d.userName);
  const partner = d.partnerName || 'your partner';
  switch (type) {
    case 'welcome':
      return {
        emoji: '💗',
        title: `Welcome to LoveMate, ${name}!`,
        body: 'Your 7-day Plus trial has started. Try decoding a confusing text or planning a date.',
        actionTab: 'decode',
        actionLabel: 'Decode a message',
        emailSubject: `Welcome to LoveMate, ${name} 💗`,
        emailPreheader: 'Your 7-day Plus trial has started.',
        emailParagraphs: [
          'LoveMate is your private AI wingman: decode confusing texts, find the right reply, plan dates and grow closer as a couple, in English or Hinglish.',
          'Your 7-day Plus trial has started, so every tool is unlocked. A good first step: paste a message you are not sure about into Decode.',
        ],
        whatsapp: `Hi ${name}! Welcome to LoveMate 💗 Your 7-day Plus trial has started. Open the app to decode your first message.`,
      };
    case 'date_reminder': {
      const days = d.daysLeft ?? 0;
      const what = d.dateTitle || 'Your special day';
      const idea = d.dateType === 'birthday' ? 'a thoughtful gift' : d.dateType === 'anniversary' ? 'a date to remember' : 'something special';
      return {
        emoji: d.dateType === 'birthday' ? '🎂' : d.dateType === 'anniversary' ? '💞' : '📅',
        title: days === 0 ? `${what} is today!` : `${what} is ${when(days)}`,
        body: days === 0 ? `Make it special. LoveMate can help with a sweet message in seconds.` : `${d.dateLabel ? d.dateLabel + '. ' : ''}Want ideas for ${idea}?`,
        actionTab: days <= 1 ? 'confession' : 'date-planner',
        actionLabel: days <= 1 ? 'Write a sweet message' : 'Get ideas',
        emailSubject: days === 0 ? `Today: ${what} 💗` : `Reminder: ${what} is ${when(days)}`,
        emailPreheader: days === 0 ? 'A little message goes a long way.' : `Plenty of time to plan ${idea}.`,
        emailParagraphs: [
          days === 0
            ? `${what} is today${d.dateLabel ? ` (${d.dateLabel})` : ''}. Even a short, honest message can make the day.`
            : `${what} is ${when(days)}${d.dateLabel ? `, on ${d.dateLabel}` : ''}. Planning a little ahead makes it easier, and cheaper.`,
          `LoveMate can suggest ${idea}, a plan that fits your budget, or the words for a card.`,
        ],
        whatsapp: `Reminder from LoveMate: ${what} is ${when(days)} 💗 Need ideas? Open LoveMate.`,
      };
    }
    case 'streak_reminder':
      return {
        emoji: '🔥',
        title: `Keep your ${d.streak ?? ''}-day streak going`.replace('  ', ' '),
        body: 'You have not checked in today yet. One question takes 30 seconds.',
        actionTab: 'home',
        actionLabel: "Answer today's question",
        emailSubject: `Your ${d.streak ?? ''}-day LoveMate streak ends at midnight 🔥`.replace('  ', ' '),
        emailPreheader: 'One quick question keeps it alive.',
        emailParagraphs: ["You've been showing up for your relationship every day. Today's question is waiting, and it takes less than a minute."],
        whatsapp: `🔥 Your ${d.streak ?? ''}-day LoveMate streak ends at midnight. Answer today's question to keep it.`,
      };
    case 'partner_joined':
      return {
        emoji: '💞',
        title: `${partner} joined your couple space`,
        body: 'You are linked now. Shared memories, plans and games sync between you both.',
        actionTab: 'our-space',
        actionLabel: 'Open Our Space',
        emailSubject: `${partner} joined you on LoveMate 💞`,
        emailPreheader: 'Your shared space is ready.',
        emailParagraphs: [
          `${partner} used your invite code, so the two of you are linked. Everything you add to Our Space, the calendar and your bucket list now shows up for both of you.`,
          'A nice first step: add one favourite memory together.',
        ],
        whatsapp: `${partner} just joined your LoveMate couple space 💞 Open LoveMate to see your shared space.`,
      };
    case 'partner_activity':
      return {
        emoji: '✨',
        title: `${partner} ${d.activity || 'added something to your shared space'}`,
        body: 'Take a look and add your own.',
        actionTab: 'our-space',
        actionLabel: 'See it',
        emailSubject: `${partner} ${d.activity || 'added something to your shared space'}`,
        emailPreheader: 'New in your shared space.',
        emailParagraphs: [`${partner} ${d.activity || 'added something to your shared space'}. It's waiting in Our Space.`],
        whatsapp: `✨ ${partner} ${d.activity || 'added something to your shared space'} on LoveMate.`,
      };
    case 'trial_ending':
      return {
        emoji: '⏳',
        title: 'Your Plus trial ends tomorrow',
        body: 'Keep unlimited tools for ₹149/month, or stay on the free plan.',
        actionTab: 'pro',
        actionLabel: 'See plans',
        emailSubject: 'Your LoveMate Plus trial ends tomorrow',
        emailPreheader: 'Nothing is charged automatically.',
        emailParagraphs: [
          'Your free 7-day Plus trial ends tomorrow. Nothing is charged automatically: you simply move to the free plan unless you choose a plan.',
          'Plus keeps every AI tool unlimited for ₹149/month (or ₹999 a year). Couple covers you and your partner for ₹249/month.',
        ],
        whatsapp: 'Your LoveMate Plus trial ends tomorrow. Nothing is charged automatically. See plans in the app.',
      };
    case 'trial_ended':
      return {
        emoji: '💗',
        title: 'Your Plus trial has ended',
        body: 'You are on the free plan now. Upgrade anytime to unlock every tool again.',
        actionTab: 'pro',
        actionLabel: 'See plans',
        emailSubject: 'Your LoveMate trial has ended',
        emailPreheader: 'You are on the free plan now.',
        emailParagraphs: [
          'Your 7-day Plus trial is over and your account is on the free plan. You still get daily chats, decodes, replies and confessions.',
          'Whenever you want every tool back, Plus is ₹149/month.',
        ],
        whatsapp: 'Your LoveMate Plus trial has ended. You are on the free plan now.',
      };
    case 'payment_success':
      return {
        emoji: '✅',
        title: `Payment received: ${d.planName || 'LoveMate'}`,
        body: `${d.amount ? d.amount + ' paid. ' : ''}${d.endDate ? `Active until ${d.endDate}.` : 'Your plan is active.'}`,
        actionTab: 'home',
        actionLabel: 'Open LoveMate',
        emailSubject: `Payment received: LoveMate ${d.planName || ''}`.trim(),
        emailPreheader: d.amount ? `${d.amount} received with thanks.` : 'Thank you for your payment.',
        emailParagraphs: [
          `Thank you! We received ${d.amount || 'your payment'} for LoveMate ${d.planName || ''}.`.replace(' .', '.'),
          d.endDate ? `Your plan is active until ${d.endDate}${d.autoRenew ? ' and renews automatically. You can cancel anytime from the plans window' : ''}.` : 'Your plan is active.',
          'Razorpay also sends a payment receipt. Keep it if you ever need a refund.',
        ],
        whatsapp: `✅ LoveMate: payment of ${d.amount || ''} received for ${d.planName || 'your plan'}.`,
      };
    case 'renewal_reminder':
      return {
        emoji: '🔁',
        title: d.autoRenew ? `${d.planName || 'Your plan'} renews in 3 days` : `${d.planName || 'Your plan'} ends in 3 days`,
        body: d.autoRenew ? `It renews on ${d.endDate || 'the renewal date'}. Cancel anytime from the plans window.` : `It ends on ${d.endDate || 'the end date'}. Renew to keep your tools.`,
        actionTab: 'pro',
        actionLabel: d.autoRenew ? 'Manage plan' : 'Renew plan',
        emailSubject: d.autoRenew ? `Your LoveMate ${d.planName || ''} renews in 3 days` : `Your LoveMate ${d.planName || ''} ends in 3 days`,
        emailPreheader: d.endDate ? `On ${d.endDate}.` : 'A quick heads-up.',
        emailParagraphs: [
          d.autoRenew
            ? `Your LoveMate ${d.planName || ''} renews automatically on ${d.endDate || 'the renewal date'}${d.amount ? ` for ${d.amount}` : ''}. If you'd like to stop, cancel before then; you keep access until the end of the period.`
            : `Your prepaid LoveMate ${d.planName || ''} ends on ${d.endDate || 'the end date'}. Renew in the app to keep every tool unlocked.`,
        ],
        whatsapp: d.autoRenew ? `LoveMate: your plan renews on ${d.endDate || ''}.` : `LoveMate: your plan ends on ${d.endDate || ''}. Renew in the app.`,
      };
    case 'payment_failed':
      return {
        emoji: '⚠️',
        title: 'Your renewal payment failed',
        body: 'Please update your payment method so your plan stays active.',
        actionTab: 'pro',
        actionLabel: 'Fix payment',
        emailSubject: 'Action needed: your LoveMate payment failed',
        emailPreheader: 'Update your payment method to keep your plan.',
        emailParagraphs: [
          `The renewal payment for LoveMate ${d.planName || ''} did not go through. No money was taken for this attempt.`,
          'Open the plans window and choose your plan again to pay with UPI, a card or netbanking.',
        ],
        whatsapp: '⚠️ LoveMate: your renewal payment failed. Open the app to keep your plan.',
      };
    case 'support_reply':
      return {
        emoji: '💬',
        title: 'We replied to your support request',
        body: d.ticketSubject ? `About "${d.ticketSubject}". Open Support to read it.` : 'Open Support to read our reply.',
        actionTab: 'support',
        actionLabel: 'Read the reply',
        emailSubject: `Re: ${d.ticketSubject || 'your LoveMate support request'}`,
        emailPreheader: 'The LoveMate team has answered.',
        emailParagraphs: [
          `Hi ${name}, thanks for writing to us${d.ticketSubject ? ` about "${d.ticketSubject}"` : ''}. Here is our reply:`,
          d.replyText || 'Please open Support in LoveMate to read the reply.',
          'If you need anything else, just reply in Support.',
        ],
        whatsapp: 'LoveMate support replied to your request. Open the app to read it.',
      };
  }
}

// ------------------------------------------------------------------ email HTML

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface EmailLayoutOptions {
  appUrl: string;
  /** One-click unsubscribe for this kind of email (omitted for required emails). */
  unsubscribeUrl?: string;
  manageUrl?: string;
  footerAddress?: string;
}

/** Branded, mobile-friendly email (tables and inline styles so it renders in Gmail, Outlook and phones). */
export function renderEmailHtml(type: NotificationType, n: RenderedNotification, o: EmailLayoutOptions): string {
  const base = o.appUrl.replace(/\/$/, '');
  const action = `${base}/#/${n.actionTab === 'home' ? '' : n.actionTab}`;
  const why = `You're getting this because "${NOTIFICATION_CATALOG[type].label}" emails are on for your LoveMate account.`;
  const link = (href: string, label: string) => `<a href="${esc(href)}" style="color:#be123c;text-decoration:underline;">${esc(label)}</a>`;
  const footerLinks = [o.manageUrl ? link(o.manageUrl, 'Notification settings') : '', o.unsubscribeUrl ? link(o.unsubscribeUrl, 'Unsubscribe') : '', link(base, 'Open LoveMate'), link(SOCIAL.instagram, 'Instagram')]
    .filter(Boolean)
    .join('<span style="color:#d4d4d8;">&nbsp;&nbsp;·&nbsp;&nbsp;</span>');
  const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(n.emailSubject)}</title></head>
<body style="margin:0;padding:0;background:#fff1f4;${font}color:#18181b;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(n.emailPreheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff1f4;">
<tr><td align="center" style="padding:32px 12px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

    <!-- Wordmark -->
    <tr><td align="center" style="padding:0 0 22px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:44px;height:44px;"><img src="${base}/brand/email-mark.png" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border:0;"></td>
        <td style="padding-left:9px;font-size:22px;font-weight:800;letter-spacing:-0.4px;color:#18181b;${font}">Love<span style="color:#f43f5e;">Mate</span></td>
      </tr></table>
    </td></tr>

    <!-- Card -->
    <tr><td style="background:#ffffff;border-radius:24px;border:1px solid #ffd9e1;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="height:6px;background:#e11d48;background-image:linear-gradient(90deg,#e11d48,#f43f5e,#fb7185);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 32px 36px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:76px;height:76px;border-radius:38px;background:#fff1f3;border:1px solid #fecdd3;text-align:center;font-size:36px;line-height:76px;">${n.emoji}</td>
          </tr></table>
          <h1 style="margin:22px 0 12px;font-size:26px;line-height:1.25;font-weight:800;letter-spacing:-0.4px;color:#111827;${font}">${esc(n.title)}</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:460px;"><tr><td align="center">
            ${n.emailParagraphs.map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#4b5563;${font}">${esc(p)}</p>`).join('')}
          </td></tr></table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0;"><tr>
            <td style="border-radius:999px;background:#e11d48;background-image:linear-gradient(90deg,#e11d48,#f43f5e);">
              <a href="${esc(action)}" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;${font}">${esc(n.actionLabel)}&nbsp;&rarr;</a>
            </td>
          </tr></table>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;${font}">Button not working? Open ${link(action, action.replace(/^https?:\/\//, ''))}</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:24px 16px 0;font-size:12px;line-height:1.7;color:#9ca3af;${font}">
      <p style="margin:0 0 8px;">${footerLinks}</p>
      <p style="margin:0 0 6px;">${esc(why)}</p>
      <p style="margin:0;">LoveMate offers relationship suggestions, not professional counselling.${o.footerAddress ? `<br>${esc(o.footerAddress)}` : ''}</p>
      <p style="margin:10px 0 0;color:#be123c;">Made with &#128151; in India</p>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

export function renderEmailText(n: RenderedNotification, appUrl: string): string {
  return [n.title, '', ...n.emailParagraphs, '', `${n.actionLabel}: ${appUrl}/#/${n.actionTab === 'home' ? '' : n.actionTab}`].join('\n');
}

// ------------------------------------------------------------------ rules (what is due now)

export interface ReminderInput {
  userName?: string;
  partnerName?: string;
  importantDates?: { id: string; title: string; date: string; type: string; reminderEnabled: boolean }[];
  subscription?: { tier?: string; status?: string; trialEndsAt?: string };
  paid?: { plan: string; status: string; current_end: string | null } | null;
  streak?: number;
  /** YYYY-MM-DD of the last day the user opened the app. */
  lastActive?: string;
}

export interface DueNotification {
  /** Stable id: the same reminder is never sent twice on a channel. */
  key: string;
  type: NotificationType;
  data: NotificationData;
}

const DAY = 86_400_000;
const REMINDER_DAYS = [7, 3, 1, 0];

/** Next occurrence (yearly) of a date like "2026-06-12" or "Jun 12", in IST days from today; milestones are one-time. */
function daysUntil(dateStr: string, type: string, today: string): { days: number; occurrence: string } | null {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00Z` : `${dateStr} UTC`);
  if (Number.isNaN(parsed.getTime())) return null;
  const t = new Date(`${today}T00:00:00Z`);
  let occ = new Date(Date.UTC(t.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  if (type === 'milestone') occ = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  else if (occ.getTime() < t.getTime()) occ = new Date(Date.UTC(t.getUTCFullYear() + 1, parsed.getUTCMonth(), parsed.getUTCDate()));
  const days = Math.round((occ.getTime() - t.getTime()) / DAY);
  return days < 0 ? null : { days, occurrence: occ.toISOString().slice(0, 10) };
}

const PLAN_LABEL: Record<string, string> = { plus: 'Plus', couple: 'Couple', premium: 'Couple' };
const PLAN_PRICE: Record<string, string> = { plus: '₹149', couple: '₹249', premium: '₹249' };
const prettyDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Scheduled reminders due at `now` (event notifications like "partner joined" are sent when they happen). */
export function dueReminders(input: ReminderInput, now: Date): DueNotification[] {
  const out: DueNotification[] = [];
  const today = istDate(now);
  const base = { userName: input.userName, partnerName: input.partnerName };

  for (const d of input.importantDates ?? []) {
    if (!d.reminderEnabled) continue;
    const u = daysUntil(d.date, d.type, today);
    if (!u || !REMINDER_DAYS.includes(u.days)) continue;
    out.push({
      key: `date:${d.id}:${u.occurrence}:${u.days}`,
      type: 'date_reminder',
      data: { ...base, dateTitle: d.title, dateType: d.type, daysLeft: u.days, dateLabel: prettyDate(`${u.occurrence}T00:00:00Z`) },
    });
  }

  const sub = input.subscription;
  if (sub?.status === 'trialing' && sub.trialEndsAt) {
    const left = Date.parse(sub.trialEndsAt) - now.getTime();
    if (left > 0 && left <= DAY) out.push({ key: `trial_ending:${sub.trialEndsAt}`, type: 'trial_ending', data: base });
    if (left <= 0) out.push({ key: `trial_ended:${sub.trialEndsAt}`, type: 'trial_ended', data: base });
  }

  const paid = input.paid;
  if (paid?.current_end && ['active', 'prepaid'].includes(paid.status)) {
    const left = Date.parse(paid.current_end) - now.getTime();
    if (left > 0 && left <= 3 * DAY) {
      out.push({
        key: `renewal:${paid.current_end}`,
        type: 'renewal_reminder',
        data: { ...base, planName: PLAN_LABEL[paid.plan], amount: PLAN_PRICE[paid.plan], endDate: prettyDate(paid.current_end), autoRenew: paid.status === 'active' },
      });
    }
  }

  // Evening nudge when yesterday was the last check-in and the streak is worth keeping.
  const yesterday = istDate(new Date(now.getTime() - DAY));
  if ((input.streak ?? 0) >= 2 && input.lastActive === yesterday && istHour(now) >= 19) {
    out.push({ key: `streak:${today}`, type: 'streak_reminder', data: { ...base, streak: input.streak } });
  }
  return out;
}
