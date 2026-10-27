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
