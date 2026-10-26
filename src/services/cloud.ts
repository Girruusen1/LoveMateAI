/**
 * Cloud accounts and sync (Supabase).
 *
 * The app keeps reading and writing localStorage exactly as before. This module adds:
 * - real accounts (email + password) with Supabase Auth;
 * - a copy of every `lovemate_*` key in the signed-in user's private rows, loaded before the app renders;
 * - for linked partners, the shared keys below go to the couple's rows instead, with live updates.
 *
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY the app stays local-only (dev, tests).
 */
import { createClient, type RealtimeChannel, type User as AuthUser } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const cloudEnabled = Boolean(url && publishableKey);
// PKCE: Google sign-in and password-reset links come back with a one-time ?code= that the client exchanges.
const sb = cloudEnabled ? createClient(url!, publishableKey!, { auth: { flowType: 'pkce' } }) : null;

/** Which account the local data belongs to, and its couple. Never uploaded. */
const OWNER_KEY = 'lovemate_cloud_owner_v1';
const COUPLE_KEY = 'lovemate_cloud_couple_v1';
const LOCAL_ONLY = new Set([OWNER_KEY, COUPLE_KEY, 'lovemate_session_v1', 'lovemate_accounts_v1']);
const MAX_VALUE_CHARS = 2_000_000;

/** Keys both partners see once linked (storage keys from AppContext). */
export const SHARED_KEYS = new Set([
  'lovemate_shared_memories_v3',
  'lovemate_shared_goals_v3',
  'lovemate_shared_plans_v3',
  'lovemate_couple_journal_v3',
  'lovemate_long_distance_v3',
  'lovemate_calendar_v4',
  'lovemate_wishlist_v4',
  'lovemate_timeline_v2',
  'lovemate_dates_v2',
  'lovemate_couple_streak_v2',
  'lovemate_real_story_v1',
  'lovemate_couple_plan_v1',
]);

export interface CloudAccount {
  id: string;
  email: string;
  name: string;
}
export interface CloudCouple {
  id: string;
  inviteCode: string | null;
  partnerName: string | null;
  createdByMe: boolean;
}

let account: CloudAccount | null = null;
let couple: CloudCouple | null = null;
let syncing = false;
let recoveryPending = false;
/** True when this sign-in created the account's first cloud data (used to start onboarding). */
let newAccount = false;

// ------------------------------------------------------------------ raw storage (bypasses sync)

const proto = Storage.prototype;
const origSetItem = proto.setItem;
const origRemoveItem = proto.removeItem;
const rawSet = (k: string, v: string) => origSetItem.call(localStorage, k, v);
const rawRemove = (k: string) => origRemoveItem.call(localStorage, k);

function wipeLocal() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('lovemate_'))
    .forEach(rawRemove);
}

// ------------------------------------------------------------------ upload queue

/** Last value known to be in the cloud per key, so unchanged writes are not re-sent. */
const lastSynced = new Map<string, string | null>();
const pending = new Map<string, string | null>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

const syncable = (key: string) => syncing && key.startsWith('lovemate_') && !LOCAL_ONLY.has(key);

function queue(key: string, value: string | null) {
  if (!syncable(key)) return;
  if (lastSynced.get(key) === value && !pending.has(key)) return;
  if (value !== null && value.length > MAX_VALUE_CHARS) {
    console.warn(`[cloud] ${key} is too large to sync (${value.length} chars); kept on this device only.`);
    return;
  }
  pending.set(key, value);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), 1000);
}

/** Send queued changes now. Failed writes stay queued and are retried. */
export async function flush(): Promise<void> {
  if (!sb || !account || !pending.size) return;
  const batch = [...pending];
  pending.clear();
  const now = new Date().toISOString();
  const target = (k: string) => (couple && SHARED_KEYS.has(k) ? 'couple' : 'user');
  const upsertUser = batch.filter(([k, v]) => v !== null && target(k) === 'user').map(([key, value]) => ({ user_id: account!.id, key, value, updated_at: now }));
  const upsertCouple = batch
    .filter(([k, v]) => v !== null && target(k) === 'couple')
    .map(([key, value]) => ({ couple_id: couple!.id, key, value, updated_by: account!.id, updated_at: now }));
  const delUser = batch.filter(([k, v]) => v === null && target(k) === 'user').map(([k]) => k);
  const delCouple = batch.filter(([k, v]) => v === null && target(k) === 'couple').map(([k]) => k);

  const results = await Promise.all([
    upsertUser.length ? sb.from('user_state').upsert(upsertUser) : null,
    upsertCouple.length ? sb.from('couple_state').upsert(upsertCouple) : null,
    delUser.length ? sb.from('user_state').delete().eq('user_id', account.id).in('key', delUser) : null,
    delCouple.length ? sb.from('couple_state').delete().eq('couple_id', couple!.id).in('key', delCouple) : null,
  ]);
  const failed = results.find((r) => r?.error);
  if (failed?.error) {
    console.warn('[cloud] sync failed, will retry:', failed.error.message);
    for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void flush(), 15_000);
    return;
  }
  for (const [k, v] of batch) lastSynced.set(k, v);
}

function installStorageHooks() {
  proto.setItem = function (this: Storage, key: string, value: string) {
    origSetItem.call(this, key, value);
    if (this === localStorage) queue(key, String(value));
  };
  proto.removeItem = function (this: Storage, key: string) {
    origRemoveItem.call(this, key);
    if (this === localStorage) queue(key, null);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
}

// ------------------------------------------------------------------ loading

function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([Promise.resolve(p), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

const toAccount = (u: AuthUser): CloudAccount => ({
  id: u.id,
  email: u.email ?? '',
  name: String(u.user_metadata?.name ?? u.user_metadata?.full_name ?? '').trim() || (u.email ?? 'friend').split('@')[0],
});

/** Load the account's data into localStorage. First sign-in uploads what is already on the device. */
async function hydrate(u: AuthUser) {
  if (!sb) return;
  const owner = localStorage.getItem(OWNER_KEY);
  if (owner && owner !== u.id) wipeLocal();

  const { data: rows, error } = await sb.from('user_state').select('key,value');
  if (error) throw error;
  for (const r of rows) {
    if (r.value === null) continue;
    rawSet(r.key, r.value);
    lastSynced.set(r.key, r.value);
  }
  const firstSync = rows.length === 0;
  newAccount = firstSync;

  const { data: me } = await sb.from('couple_members').select('couple_id').eq('user_id', u.id).maybeSingle();
  couple = null;
  if (me) {
    const [shared, members, info] = await Promise.all([
      sb.from('couple_state').select('key,value').eq('couple_id', me.couple_id),
      sb.from('couple_members').select('user_id,display_name').eq('couple_id', me.couple_id),
      sb.from('couples').select('invite_code,created_by').eq('id', me.couple_id).maybeSingle(),
    ]);
    for (const r of shared.data ?? []) {
      if (r.value === null) continue;
      rawSet(r.key, r.value);
      lastSynced.set(r.key, r.value);
    }
    const partner = (members.data ?? []).find((m) => m.user_id !== u.id);
    couple = {
      id: me.couple_id,
      inviteCode: info.data?.invite_code ?? null,
      partnerName: partner ? partner.display_name || 'Partner' : null,
      createdByMe: info.data?.created_by === u.id,
    };
    rawSet(COUPLE_KEY, me.couple_id);
  } else {
    rawRemove(COUPLE_KEY);
  }

  rawSet(OWNER_KEY, u.id);
  account = toAccount(u);
  syncing = true;
  if (firstSync) {
    for (const k of Object.keys(localStorage)) {
      const v = localStorage.getItem(k);
      if (v !== null) queue(k, v);
    }
  }
}

/**
 * Run before the first render: restore the session and load the account's latest data.
 * If the network is down the app starts with the data already on this device.
 */
export async function bootstrapCloud(): Promise<void> {
  if (!sb) return;
  installStorageHooks();
  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') recoveryPending = true;
  });
  try {
    const { data } = await withTimeout(sb.auth.getSession(), 6000);
    const user = data.session?.user;
    if (!user) {
      // Not signed in: keep nothing from an earlier session, an expired login or the old browser-only
      // accounts (including the former sample user and its data). Visitors start clean every time.
      wipeLocal();
      return;
    }
    await withTimeout(hydrate(user), 8000);
  } catch (e) {
    console.warn('[cloud] could not load account data, using what is on this device:', e);
    const owner = localStorage.getItem(OWNER_KEY);
    const { data } = await sb.auth.getSession().catch(() => ({ data: { session: null } }));
    if (owner && data.session?.user.id === owner) {
      account = toAccount(data.session.user);
      syncing = true;
    }
  }
  if (couple) subscribeCouple(couple.id);
}

export const cloudAccount = () => account;
export const cloudIsNewAccount = () => newAccount;
export const cloudCouple = () => couple;
export const takePasswordRecovery = () => {
  const r = recoveryPending;
  recoveryPending = false;
  return r;
};

// ------------------------------------------------------------------ auth

export type SignInResult = 'ok' | 'wrong_password' | 'not_confirmed' | 'error';
export type SignUpResult = 'ok' | 'exists' | 'confirm_email' | 'error';

export async function cloudSignIn(email: string, password: string): Promise<SignInResult> {
  if (!sb) return 'error';
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (error.code === 'email_not_confirmed') return 'not_confirmed';
    if (error.code === 'invalid_credentials' || error.status === 400) return 'wrong_password';
    console.warn('[cloud] sign in failed:', error.message);
    return 'error';
  }
  await hydrate(data.user);
  await flush();
  return 'ok';
}

export async function cloudSignUp(name: string, email: string, password: string): Promise<SignUpResult> {
  if (!sb) return 'error';
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin },
  });
  if (error) {
    if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) return 'exists';
    console.warn('[cloud] sign up failed:', error.message);
    return 'error';
  }
  // With email confirmation on, an existing address comes back as a user without identities.
  if (data.user && data.user.identities?.length === 0) return 'exists';
  if (!data.session || !data.user) return 'confirm_email';
  await hydrate(data.user);
  await flush();
  return 'ok';
}

/** Upload pending changes, end the session and clear this device. */
/** Redirects to Google; the page comes back signed in (handled by bootstrapCloud). */
export async function cloudSignInWithGoogle(): Promise<'redirecting' | 'not_enabled' | 'error'> {
  if (!sb) return 'error';
  // The redirect itself never fails, so ask first whether Google is switched on for this project.
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publishableKey! } });
    const settings = (await res.json()) as { external?: { google?: boolean } };
    if (!settings.external?.google) return 'not_enabled';
  } catch {
    return 'error';
  }
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  if (!error) return 'redirecting';
  console.warn('[cloud] Google sign-in failed:', error.message);
  return /not enabled|unsupported provider/i.test(error.message) ? 'not_enabled' : 'error';
}

export async function cloudSignOut(): Promise<void> {
  if (!sb) return;
  await flush().catch(() => undefined);
  syncing = false;
  account = null;
  couple = null;
  await sb.auth.signOut().catch(() => undefined);
  wipeLocal();
}

export async function cloudDeleteAccount(): Promise<boolean> {
  if (!sb) return false;
  syncing = false;
  const { error } = await sb.rpc('delete_my_account');
  if (error) {
    console.warn('[cloud] delete failed:', error.message);
    syncing = true;
    return false;
  }
  account = null;
  couple = null;
  await sb.auth.signOut({ scope: 'local' }).catch(() => undefined);
  wipeLocal();
  return true;
}

export async function cloudSendPasswordReset(email: string): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
  if (error) console.warn('[cloud] reset email failed:', error.message);
  return !error;
}

export async function cloudUpdatePassword(password: string): Promise<boolean> {
  if (!sb) return false;
  const { error } = await sb.auth.updateUser({ password });
  return !error;
}

// ------------------------------------------------------------------ partners

type SharedListener = (key: string, value: string) => void;
type PartnerListener = (partnerName: string) => void;
const sharedListeners = new Set<SharedListener>();
const partnerListeners = new Set<PartnerListener>();
let channel: RealtimeChannel | null = null;

/** Called when the partner changes a shared key. Returns an unsubscribe function. */
export function onSharedChange(fn: SharedListener) {
  sharedListeners.add(fn);
  return () => void sharedListeners.delete(fn);
}
/** Called when the partner joins. Returns an unsubscribe function. */
export function onPartnerJoined(fn: PartnerListener) {
  partnerListeners.add(fn);
  return () => void partnerListeners.delete(fn);
}

function subscribeCouple(coupleId: string) {
  if (!sb) return;
  if (channel) void sb.removeChannel(channel);
  channel = sb
    .channel(`couple:${coupleId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_state', filter: `couple_id=eq.${coupleId}` }, (payload) => {
      const row = payload.new as { key?: string; value?: string | null; updated_by?: string };
      if (!row?.key || row.value == null || row.updated_by === account?.id) return;
      rawSet(row.key, row.value);
      lastSynced.set(row.key, row.value);
      sharedListeners.forEach((fn) => fn(row.key!, row.value!));
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${coupleId}` }, (payload) => {
      const row = payload.new as { user_id?: string; display_name?: string | null };
      if (!row?.user_id || row.user_id === account?.id) return;
      if (couple) couple = { ...couple, partnerName: row.display_name || 'Partner', inviteCode: null };
      partnerListeners.forEach((fn) => fn(row.display_name || 'Partner'));
    })
    .subscribe();
}

export type CoupleError = 'invalid_code' | 'own_code' | 'already_connected' | 'couple_full' | 'error';
const coupleError = (message: string): CoupleError =>
  (['invalid_code', 'own_code', 'already_connected', 'couple_full'] as const).find((c) => message.includes(c)) ?? 'error';

/** Create (or refresh) this user's invite code. Shared data on this device becomes the couple's starting point. */
export async function cloudCreateCouple(displayName: string): Promise<{ code: string } | { error: CoupleError }> {
  if (!sb || !account) return { error: 'error' };
  const { data, error } = await sb.rpc('create_couple', { p_name: displayName });
  if (error) return { error: coupleError(error.message) };
  const row = (Array.isArray(data) ? data[0] : data) as { couple_id: string; invite_code: string };
  const isNew = couple?.id !== row.couple_id;
  couple = { id: row.couple_id, inviteCode: row.invite_code, partnerName: null, createdByMe: true };
  rawSet(COUPLE_KEY, row.couple_id);
  if (isNew) {
    for (const k of SHARED_KEYS) {
      const v = localStorage.getItem(k);
      lastSynced.delete(k);
      if (v !== null) queue(k, v);
    }
    await flush();
  }
  subscribeCouple(row.couple_id);
  return { code: row.invite_code };
}

/** Join the partner's couple. The caller reloads so the shared space is loaded fresh. */
export async function cloudJoinCouple(code: string, displayName: string): Promise<{ ok: true } | { error: CoupleError }> {
  if (!sb || !account) return { error: 'error' };
  await flush();
  const { error } = await sb.rpc('join_couple', { p_code: code, p_name: displayName });
  if (error) return { error: coupleError(error.message) };
  return { ok: true };
}

export async function cloudLeaveCouple(): Promise<boolean> {
  if (!sb || !account) return false;
  await flush();
  const { error } = await sb.rpc('leave_couple');
  if (error) return false;
  if (channel) void sb.removeChannel(channel);
  channel = null;
  couple = null;
  rawRemove(COUPLE_KEY);
  // Keep the shared data on this device as a personal copy from now on.
  for (const k of SHARED_KEYS) {
    const v = localStorage.getItem(k);
    lastSynced.delete(k);
    if (v !== null) queue(k, v);
  }
  return true;
}
