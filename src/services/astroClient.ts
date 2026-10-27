/**
 * Daily love rashifal from the server (/api/astro/rashifal), which writes each sign once per
 * India date and caches it. Falls back to the offline text when the server can't be reached.
 */
import { indiaDate, type AstroLanguage } from '../../shared/jyotish';
import { offlineRashifal, type Rashifal } from '../../shared/rashifalOffline';

export interface RashifalResponse {
  sign: number;
  language: AstroLanguage;
  date: string;
  source: 'ai' | 'offline';
  rashifal: Rashifal;
}

const memo = new Map<string, RashifalResponse>();
const inflight = new Map<string, Promise<RashifalResponse>>();

export function fetchRashifal(sign: number, language: AstroLanguage): Promise<RashifalResponse> {
  const date = indiaDate();
  const key = `${date}:${sign}:${language}`;
  const hit = memo.get(key);
  if (hit) return Promise.resolve(hit);
  let p = inflight.get(key);
  if (!p) {
    p = load(sign, language, date, key).finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

async function load(sign: number, language: AstroLanguage, date: string, key: string): Promise<RashifalResponse> {
  try {
    const res = await fetch(`/api/astro/rashifal?sign=${sign}&lang=${language}`, { headers: { Accept: 'application/json' } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as RashifalResponse;
    if (body.source === 'ai') memo.set(key, body);
    return body;
  } catch {
    return { sign, language, date, source: 'offline', rashifal: offlineRashifal(sign, language, date) };
  }
}
