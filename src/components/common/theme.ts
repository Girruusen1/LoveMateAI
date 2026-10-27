/**
 * Theme store: 'light' | 'dark' | 'system', persisted in localStorage (`lovemate_theme_v1`)
 * and applied by toggling the `dark` class on <html>. `applyStoredTheme()` runs before the
 * first render (see main.tsx) so there is no flash of the wrong theme.
 */
import { useCallback, useSyncExternalStore } from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';

export const THEME_KEY = 'lovemate_theme_v1';
export const THEME_EVENT = 'lovemate:theme';

const isTheme = (v: unknown): v is ThemeSetting => v === 'light' || v === 'dark' || v === 'system';

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

let setting: ThemeSetting = readSetting();
const listeners = new Set<() => void>();
const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function systemPrefersDark(): boolean {
  return !!media?.matches;
}

/** The theme actually shown right now. */
export function resolvedTheme(s: ThemeSetting = setting): 'light' | 'dark' {
  return s === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : s;
}

function apply() {
  if (typeof document === 'undefined') return;
  const dark = resolvedTheme() === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = dark ? '#0c0c0e' : '#fdfbf7';
}

function notify() {
  listeners.forEach((l) => l());
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { setting, resolved: resolvedTheme() } }));
}

export function getThemeSetting(): ThemeSetting {
  return setting;
}

export function setThemeSetting(next: ThemeSetting) {
  if (!isTheme(next)) return;
  setting = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage unavailable */
  }
  apply();
  notify();
}

/** Apply the stored theme immediately. Safe to call more than once. */
export function applyStoredTheme() {
  setting = readSetting();
  apply();
}

if (media) {
  const onChange = () => {
    if (setting === 'system') {
      apply();
      notify();
    }
  };
  if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange);
  else media.addListener(onChange);
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY || e.key === null) {
      const next = readSetting();
      if (next !== setting) {
        setting = next;
        apply();
        notify();
      }
    }
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** React hook for the theme setting and the resolved light/dark value. */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, getThemeSetting, () => 'system' as ThemeSetting);
  const set = useCallback((s: ThemeSetting) => setThemeSetting(s), []);
  return { theme: current, resolved: resolvedTheme(current), setTheme: set, isDark: resolvedTheme(current) === 'dark' };
}
