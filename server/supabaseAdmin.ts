/**
 * Server-side Supabase access with the secret key (bypasses Row Level Security), plus checking who is
 * calling from their access token. Used by payments and notifications. Never sent to the browser.
 */
import type { IncomingMessage } from 'node:http';

const env = (k: string) => process.env[k]?.trim() || '';

export const supabaseUrl = () => (env('SUPABASE_URL') || env('VITE_SUPABASE_URL')).replace(/\/$/, '');
export const supabaseSecret = () => env('SUPABASE_SECRET_KEY');
export const supabaseAdminEnabled = () => Boolean(supabaseUrl() && supabaseSecret());

export function adminHeaders(): Record<string, string> {
  const key = supabaseSecret();
  // New-style secret keys go in the apikey header only; legacy service_role JWTs also need Authorization.
  return key.startsWith('sb_secret_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

/** The signed-in user behind a request (Bearer access token), or null. */
export async function userFromToken(req: IncomingMessage): Promise<{ id: string; email: string } | null> {
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token || !supabaseUrl()) return null;
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: env('VITE_SUPABASE_PUBLISHABLE_KEY') || supabaseSecret(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id: string; email?: string };
  return { id: user.id, email: user.email ?? '' };
}

/** GET /rest/v1/<path> with the secret key. */
export async function adminSelect<T>(path: string): Promise<T[]> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, { headers: adminHeaders() });
  if (!res.ok) throw new Error(`Supabase ${path.split('?')[0]}: HTTP ${res.status}`);
  return (await res.json()) as T[];
}

/** Insert or update rows (on the table's primary key, or `onConflict`). */
export async function adminUpsert(table: string, rows: unknown, onConflict?: string): Promise<void> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`, {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert ${table}: HTTP ${res.status} ${await res.text().catch(() => '')}`);
}

export interface AccountRow {
  id: string;
  email: string;
  created_at?: string;
  last_sign_in_at?: string | null;
}

/** All accounts, via the Auth admin API. */
export async function listUsers(): Promise<AccountRow[]> {
  const users: AccountRow[] = [];
  for (let page = 1; page < 50; page++) {
    const res = await fetch(`${supabaseUrl()}/auth/v1/admin/users?page=${page}&per_page=500`, { headers: adminHeaders() });
    if (!res.ok) throw new Error(`Supabase list users: HTTP ${res.status}`);
    const json = (await res.json()) as { users?: { id: string; email?: string; created_at?: string; last_sign_in_at?: string | null }[] };
    const batch = json.users ?? [];
    users.push(...batch.filter((u) => u.email).map((u) => ({ id: u.id, email: u.email!, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at })));
    if (batch.length < 500) break;
  }
  return users;
}

/** PATCH rows matching `filter` (e.g. "id=eq.123"). */
export async function adminPatch(table: string, filter: string, values: unknown): Promise<void> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error(`Supabase update ${table}: HTTP ${res.status}`);
}

/** Insert rows; fails on duplicates (unlike adminUpsert). */
export async function adminInsert(table: string, rows: unknown): Promise<void> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table}: HTTP ${res.status} ${await res.text().catch(() => '')}`);
}
