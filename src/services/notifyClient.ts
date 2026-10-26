/** Talks to the server's notification routes (emails). In-app and browser notifications run in AppContext. */
import { cloudAccessToken } from './cloud';

let status: Promise<{ email: boolean }> | null = null;

/** Whether the server can send emails (SMTP + database configured). Cached. */
export function getNotifyStatus() {
  status ??= fetch('/api/notify/status')
    .then((r) => (r.ok ? r.json() : { email: false }))
    .catch(() => ({ email: false }));
  return status;
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; message?: string }> {
  const token = await cloudAccessToken();
  if (!token) return { ok: false, message: 'Please sign in first.' };
  try {
    const res = await fetch(`/api/notify/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: { message?: string } };
    return { ok: res.ok, message: json.message ?? json.error?.message };
  } catch {
    return { ok: false, message: 'Could not reach the server.' };
  }
}

/** Tell the server about an event so it can email the right person (fire and forget). */
export function reportEvent(type: 'welcome' | 'partner_joined', name?: string) {
  void getNotifyStatus().then((s) => {
    if (s.email) void post('event', { type, name });
  });
}

export const sendTestEmail = (name?: string) => post('test', { name });
