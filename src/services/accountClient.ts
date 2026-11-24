/** Server routes that need the server's secret key: referral rewards and the admin dashboard. */
import { cloudAccessToken } from './cloud';

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ ok: boolean; data?: T; message?: string }> {
  const token = await cloudAccessToken();
  if (!token) return { ok: false, message: 'Please sign in first.' };
  try {
    const res = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
    return res.ok ? { ok: true, data: json } : { ok: false, message: json.error?.message ?? 'Something went wrong. Please try again.' };
  } catch {
    return { ok: false, message: 'Could not reach the server.' };
  }
}

export const claimReferral = (code: string) => call<{ ok: boolean; days: number }>('POST', '/api/referral/claim', { code });
export const checkAdmin = () => call<{ admin: boolean }>('GET', '/api/admin/me');

export interface AdminOverview {
  users: { total: number; new7d: number; new30d: number; active7d: number; recent: { email: string; created_at?: string; last_sign_in_at?: string | null }[] };
  plans: { plus: number; couple: number; bonus: number; cancelling: number; failed: number; estimatedMonthlyRevenue: number };
  couples: number;
  referrals: { total: number; last30d: number };
  emailsSent7d: number;
  tickets: { id: string; email: string; category: string; subject: string; description: string; status: string; reply: string | null; created_at: string; updated_at: string }[];
}
export const loadAdminOverview = () => call<AdminOverview>('GET', '/api/admin/overview');
export const updateTicket = (id: string, changes: { status?: string; reply?: string }) =>
  call<{ ok: boolean; emailed: boolean }>('POST', '/api/admin/ticket', { id, ...changes });

// ---------------------------------------------------------------- email marketing (admins)

export interface MarketingTemplateInfo {
  id: string;
  name: string;
  language: 'hinglish' | 'english';
  audience: 'new' | 'users';
  subject: string;
  description: string;
  sentCount: number;
}
export interface MarketingOverview {
  emailEnabled: boolean;
  templates: MarketingTemplateInfo[];
  recent: { email: string; template: string; at: string; by: string; test?: boolean }[];
  unsubscribed: number;
  totalSent: number;
}
export type MarketingSendStatus = 'sent' | 'invalid' | 'unsubscribed' | 'already_sent' | 'duplicate' | 'failed';
export interface MarketingSendResult {
  input: string;
  email?: string;
  status: MarketingSendStatus;
  error?: string;
}
export const loadMarketing = () => call<MarketingOverview>('GET', '/api/marketing/overview');
export const sendMarketing = (template: string, recipients: string[], options: { test?: boolean; force?: boolean } = {}) =>
  call<{ ok: boolean; results: MarketingSendResult[]; sent: number }>('POST', '/api/marketing/send', { template, recipients, ...options });

/** The rendered email as HTML (for an iframe preview). */
export async function previewMarketing(template: string): Promise<string | null> {
  const token = await cloudAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`/api/marketing/preview/${encodeURIComponent(template)}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- WhatsApp templates (admins)

export type WhatsAppDeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';
export interface WhatsAppMessageRow {
  id: string;
  phone: string;
  name: string;
  template: string;
  language: string;
  by: string;
  sentAt: string;
  status: WhatsAppDeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  error?: string;
}
export interface WhatsAppOverview {
  enabled: boolean;
  receiptsEnabled: boolean;
  templates: { name: string; label: string; languages: readonly string[] }[];
  messages: WhatsAppMessageRow[];
  counts: { total: number; sent: number; delivered: number; read: number; failed: number };
}
export type WhatsAppSendStatus = 'sent' | 'invalid' | 'duplicate' | 'failed';
export interface WhatsAppSendResult {
  input: string;
  phone?: string;
  name?: string;
  status: WhatsAppSendStatus;
  error?: string;
}
export const loadWhatsApp = () => call<WhatsAppOverview>('GET', '/api/whatsapp/overview');
export const sendWhatsApp = (template: string, language: string, recipients: string[]) =>
  call<{ ok: boolean; results: WhatsAppSendResult[]; sent: number }>('POST', '/api/whatsapp/send', { template, language, recipients });
