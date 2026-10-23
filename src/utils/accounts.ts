import type { User } from '../types';

/** Local-only account store (there is no server). Passwords are kept as SHA-256 hashes, never in plain text. */
export interface LocalAccount {
  user: User;
  passwordHash: string | null;
}

const KEY = 'lovemate_accounts_v1';

export function loadAccounts(): Record<string, LocalAccount> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, LocalAccount>;
  } catch {
    return {};
  }
}

export function saveAccounts(accounts: Record<string, LocalAccount>) {
  localStorage.setItem(KEY, JSON.stringify(accounts));
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`lovemate::${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Insecure context fallback (plain http on a LAN address): not cryptographic, but still not plain text.
  let h = 0;
  for (const c of data) h = (Math.imul(h, 31) + c) | 0;
  return `fallback_${(h >>> 0).toString(16)}`;
}
