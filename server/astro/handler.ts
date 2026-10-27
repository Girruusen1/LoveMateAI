/**
 * Jyotish HTTP routes.
 *
 *   GET /api/astro/rashifal?sign=<0-11>&lang=<english|hinglish|hindi>
 *     -> { sign, language, date, source: "ai" | "offline", rashifal: {...}, note }
 *
 * Each sign + language is written by the AI once per India calendar date and kept in memory,
 * so the whole site makes at most 12 x 3 = 36 AI calls a day for rashifal. When AI is not
 * configured (or fails) a gentle offline rashifal is served instead and retried later.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isConfigured } from '../genai/config.ts';
import { runTask } from '../genai/llm.ts';
import { JYOTISH_NOTE, RASHIS, indiaDate, isAstroLanguage, type AstroLanguage } from '../../shared/jyotish.ts';
import { offlineRashifal, type Rashifal } from '../../shared/rashifalOffline.ts';

interface Entry {
  date: string;
  source: 'ai' | 'offline';
  rashifal: Rashifal;
  /** Offline answers are retried after this time (ms epoch) */
  retryAfter?: number;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();
const OFFLINE_RETRY_MS = 10 * 60_000;

function send(res: ServerResponse, status: number, body: unknown, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store');
  res.end(JSON.stringify(body));
}

const clean = (r: Rashifal): Rashifal => ({ ...r, luckyNumber: Math.min(9, Math.max(1, Math.round(Number(r.luckyNumber) || 1))) });

async function generate(sign: number, language: AstroLanguage, date: string): Promise<Entry> {
  if (!isConfigured()) return { date, source: 'offline', rashifal: offlineRashifal(sign, language, date), retryAfter: Date.now() + OFFLINE_RETRY_MS };
  try {
    const r = (await runTask('rashifal', { sign, language, date })) as Rashifal;
    return { date, source: 'ai', rashifal: clean(r) };
  } catch (err) {
    console.warn(`[astro] rashifal ${RASHIS[sign].english}/${language} fell back to offline:`, err instanceof Error ? err.message : err);
    return { date, source: 'offline', rashifal: offlineRashifal(sign, language, date), retryAfter: Date.now() + OFFLINE_RETRY_MS };
  }
}

export async function getRashifal(sign: number, language: AstroLanguage, date = indiaDate()): Promise<Entry> {
  const key = `${date}:${sign}:${language}`;
  const hit = cache.get(key);
  if (hit && (hit.source === 'ai' || (hit.retryAfter ?? 0) > Date.now())) return hit;
  let p = inflight.get(key);
  if (!p) {
    p = generate(sign, language, date).finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  const entry = await p;
  // Keep only today's entries.
  for (const k of cache.keys()) if (!k.startsWith(`${date}:`)) cache.delete(k);
  if (entry.source === 'ai' || !hit || hit.source !== 'ai') cache.set(key, entry);
  return entry;
}

/** Returns true when the request was handled. */
export async function handleAstro(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/astro/')) return false;
  try {
    if (url.pathname === '/api/astro/rashifal') {
      if (req.method !== 'GET') {
        send(res, 405, { error: { code: 'bad_request', message: 'Method not allowed.' } });
        return true;
      }
      const sign = Number(url.searchParams.get('sign'));
      const lang = url.searchParams.get('lang') ?? 'english';
      if (!Number.isInteger(sign) || sign < 0 || sign > 11) {
        send(res, 400, { error: { code: 'bad_request', message: 'sign must be a number from 0 (Mesha) to 11 (Meena).' } });
        return true;
      }
      if (!isAstroLanguage(lang)) {
        send(res, 400, { error: { code: 'bad_request', message: 'lang must be english, hinglish or hindi.' } });
        return true;
      }
      const entry = await getRashifal(sign, lang);
      send(res, 200, { sign, language: lang, date: entry.date, source: entry.source, rashifal: entry.rashifal, note: JYOTISH_NOTE }, entry.source === 'ai' ? 600 : 0);
      return true;
    }
    send(res, 404, { error: { code: 'bad_request', message: 'Unknown endpoint.' } });
    return true;
  } catch (err) {
    console.error('[astro] request failed:', err);
    if (!res.headersSent) send(res, 500, { error: { code: 'upstream', message: 'Something went wrong.' } });
    else res.end();
    return true;
  }
}
