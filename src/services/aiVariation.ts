/**
 * Deterministic variation helpers for the mock AI service.
 *
 * A module-level nonce is bumped on every generation call so that two
 * consecutive calls with identical input still produce visibly different
 * output (this is what makes every "Regenerate" button do something).
 * Everything here is pure and seed-driven — no Math.random, no network.
 */

let nonce = 0;

/** Advance and return the global call counter. */
export const nextSeed = (): number => {
  nonce = (nonce + 1) % 1_000_000_007;
  return nonce;
};

/** Read the current counter without advancing it. */
export const currentSeed = (): number => nonce;

/** FNV-1a string hash -> unsigned 32-bit integer. */
export const hashString = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Combine the nonce with the call inputs so output also depends on what the user typed. */
export const mixSeed = (
  seed: number,
  ...parts: Array<string | number | boolean | undefined | null>
): number => (Math.imul(seed, 2654435761) ^ hashString(parts.map((p) => String(p ?? '')).join('|'))) >>> 0;

/** Pick one element, deterministically, from a non-empty list. */
export const pick = <T>(arr: readonly T[], seed: number, offset = 0): T => {
  if (arr.length === 0) {
    throw new Error('pick() requires a non-empty array');
  }
  const idx = (Math.abs(seed + offset) >>> 0) % arr.length;
  return arr[idx];
};

/** Rotate a list by `seed` positions (keeps relative order, changes what comes first). */
export const rotate = <T>(arr: readonly T[], seed: number): T[] => {
  const n = arr.length;
  if (n < 2) return [...arr];
  const k = (Math.abs(seed) >>> 0) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

const lcg = (seed: number) => {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** Deterministic Fisher–Yates shuffle. */
export const shuffle = <T>(arr: readonly T[], seed: number): T[] => {
  const out = [...arr];
  const rnd = lcg(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Shuffle then keep the first `count` items. */
export const take = <T>(arr: readonly T[], count: number, seed: number): T[] =>
  shuffle(arr, seed).slice(0, Math.max(0, count));

/** Replace `{key}` placeholders. Unknown keys become an empty string. */
export const fill = (
  template: string,
  vars: Record<string, string | number | boolean | undefined | null>
): string =>
  template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });

/** First few words of a text, with an ellipsis when cut. */
export const snippet = (text: string, maxWords = 8): string => {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return '';
  const cut = words.slice(0, maxWords).join(' ');
  return words.length > maxWords ? `${cut}…` : cut;
};

/** Split free text into trimmed sentences / lines. */
export const sentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

/** Lower-case, strip punctuation, collapse whitespace. */
export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/** True when any keyword occurs in the text (case-insensitive). */
export const hasAny = (text: string, keys: readonly string[]): boolean => {
  const t = text.toLowerCase();
  return keys.some((k) => t.includes(k));
};

export const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Small deterministic offset in [-range, +range]. */
export const jitter = (seed: number, range: number): number => ((Math.abs(seed) >>> 0) % (range * 2 + 1)) - range;

const STOP_WORDS = new Set([
  'that', 'this', 'with', 'what', 'when', 'then', 'than', 'have', 'from', 'they', 'them', 'their', 'about',
  'just', 'like', 'really', 'very', 'been', 'were', 'will', 'would', 'could', 'should', 'because', 'always',
  'never', 'feel', 'feels', 'want', 'wants', 'think', 'know', 'there', 'where', 'which', 'while', 'into',
  'some', 'more', 'most', 'also', 'even', 'much', 'many', 'your', 'you', 'mine', 'ours', 'hai', 'hain',
  'nahi', 'kya', 'yaar', 'bhai', 'bhi', 'toh', 'aur', 'mujhe', 'usne', 'uska', 'uski', 'mera', 'meri',
]);

/** Distinct content words (length >= min) in order of first appearance. */
export const keywords = (text: string, min = 4): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of normalize(text).split(' ')) {
    if (raw.length < min || STOP_WORDS.has(raw) || seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
};

/** Words that appear in both texts — used to find common ground between two people. */
export const sharedKeywords = (a: string, b: string, min = 4): string[] => {
  const bSet = new Set(keywords(b, min));
  return keywords(a, min).filter((w) => bSet.has(w));
};

/** Simulated latency is kept short and bounded (300–700 ms). */
export const simulatedDelay = (ms: number): number => clamp(Math.round(ms), 300, 700);

/** Hinglish / Roman-Hindi detection used by several generators. */
export const looksHinglish = (text: string): boolean =>
  hasAny(text, [
    'kya', 'bhai', 'yaar', 'uska', 'uski', 'hai', 'kaise', 'bolu', 'batana', 'nahi', 'mujhe', 'kab',
    'acha', 'accha', 'theek', 'matlab', 'karu', 'karna', 'pata', 'dekhte', 'haan', 'bilkul',
  ]);
