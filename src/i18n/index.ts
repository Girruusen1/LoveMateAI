/**
 * Tiny interface-language layer.
 *
 * Keys are the English strings themselves, so `t('Sign in')` returns 'Sign in' in English,
 * 'साइन इन करें' in Hindi and 'Sign in karein' in Hinglish. Missing keys fall back to English.
 * `{name}` placeholders are filled from the optional vars argument.
 *
 * The choice is stored in localStorage (`lovemate_ui_lang_v1`). When nothing is stored it
 * follows the signed-in user's chat language (`preferredLanguage` in `lovemate_user_v2`).
 */
import React, { useCallback, useSyncExternalStore } from 'react';
import { en } from './en';
import { hi } from './hi';
import { hinglish } from './hinglish';
import { MENU_LABELS } from './menuLabels';

export type UiLanguage = 'english' | 'hinglish' | 'hindi';

export const UI_LANGUAGE_KEY = 'lovemate_ui_lang_v1';
const USER_KEY = 'lovemate_user_v2';
export const UI_LANGUAGE_EVENT = 'lovemate:ui-language';

export const LANGUAGE_OPTIONS: { id: UiLanguage; label: string; short: string }[] = [
  { id: 'english', label: 'English', short: 'EN' },
  { id: 'hinglish', label: 'Hinglish', short: 'HI-EN' },
  { id: 'hindi', label: 'हिन्दी', short: 'हि' },
];

const DICTS: Record<UiLanguage, Record<string, string>> = {
  english: en,
  hinglish: { ...MENU_LABELS.hinglish, ...hinglish },
  hindi: { ...MENU_LABELS.hindi, ...hi },
};

const isUiLanguage = (v: unknown): v is UiLanguage => v === 'english' || v === 'hinglish' || v === 'hindi';

/** The chat language the user picked during onboarding / in profile settings, if any. */
export function getStoredPreferredLanguage(): string | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { preferredLanguage?: unknown } | null;
    return typeof parsed?.preferredLanguage === 'string' ? parsed.preferredLanguage : null;
  } catch {
    return null;
  }
}

function readLanguage(): UiLanguage {
  try {
    const stored = localStorage.getItem(UI_LANGUAGE_KEY);
    if (isUiLanguage(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  const pref = getStoredPreferredLanguage();
  if (pref === 'roman_hindi') return 'hinglish';
  return isUiLanguage(pref) ? pref : 'english';
}

let current: UiLanguage = readLanguage();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(UI_LANGUAGE_EVENT, { detail: current }));
}

export function getUiLanguage(): UiLanguage {
  return current;
}

export function setUiLanguage(lang: UiLanguage) {
  if (!isUiLanguage(lang) || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(UI_LANGUAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'english' ? 'en' : 'hi';
  notify();
}

if (typeof window !== 'undefined') {
  // Another tab changed the language (or the user record it follows).
  window.addEventListener('storage', (e) => {
    if (e.key === UI_LANGUAGE_KEY || e.key === USER_KEY || e.key === null) {
      const next = readLanguage();
      if (next !== current) {
        current = next;
        notify();
      }
    }
  });
  document.documentElement.lang = current === 'english' ? 'en' : 'hi';
}

type Vars = Record<string, string | number>;

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Translate `key` into the current interface language. */
export function t(key: string, vars?: Vars): string {
  const dict = DICTS[current];
  return fill(dict[key] ?? key, vars);
}

/** Translate into a specific language regardless of the current setting. */
export function tIn(lang: UiLanguage, key: string, vars?: Vars): string {
  return fill(DICTS[lang][key] ?? key, vars);
}

/**
 * Like `t`, but placeholders may be React nodes (e.g. `<code>` chips inside a sentence).
 * Returns an array of strings and nodes, ready to render as children.
 */
export function tx(key: string, parts: Record<string, React.ReactNode>): React.ReactNode[] {
  const template = DICTS[current][key] ?? key;
  const out: React.ReactNode[] = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(template))) {
    if (m.index > last) out.push(template.slice(last, m.index));
    const name = m[1];
    out.push(name in parts ? React.createElement(React.Fragment, { key: `${name}-${i++}` }, parts[name]) : m[0]);
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push(template.slice(last));
  return out;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** React hook: re-renders the component whenever the interface language changes. */
export function useT() {
  const lang = useSyncExternalStore(subscribe, getUiLanguage, () => 'english' as UiLanguage);
  const tt = useCallback((key: string, vars?: Vars) => fill(DICTS[lang][key] ?? key, vars), [lang]);
  return { t: tt, tx, lang, setLang: setUiLanguage, isHindi: lang === 'hindi' };
}

export { MENU_LABELS };
export { LanguageSwitch } from './LanguageSwitch';
