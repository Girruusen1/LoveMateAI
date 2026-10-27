/**
 * Jyotish (Vedic astrology) and love-calculator tasks. Merged into TASKS in ./tasks.ts.
 * The browser computes every number with the offline engine (src/astro); these prompts only
 * explain those numbers in friendly words, inside firm guardrails.
 */
import { z } from 'zod';
import { MAX_TEXT_CHARS } from './config.ts';
import { RASHIS } from '../../shared/jyotish.ts';
import { languageLabel } from './prompts.ts';
import type { TaskDef } from './tasks.ts';

/* Local copies of the small input helpers (importing them from tasks.ts would be circular). */
const str = (v: unknown, max = MAX_TEXT_CHARS) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max).trim();
const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};

/**
 * Answer language. `input.language` is the user's preferredLanguage (the browser client fills it in
 * when the caller does not; rashifal passes it explicitly), so the labels are the same as for every
 * other task. These tasks are also wrapped by `withLanguage` in tasks.ts, which appends the generic
 * "reply in <language>, keep JSON keys English" instruction.
 */
const TONE: Record<string, string> = {
  english: 'simple, warm',
  hinglish: 'natural, the way friends text (no Devanagari)',
  roman_hindi: 'simple, friendly',
  hindi: 'simple, friendly',
};
const lang = (v: unknown) => `${TONE[String(v)] ?? TONE.english} ${languageLabel(v)}`;

/** Shared rules for every Jyotish answer. */
export const JYOTISH_GUARDRAILS = `Rules for anything about Jyotish (Vedic astrology):
- Astrology is cultural guidance and reflection, not fact or prediction. Say so gently once, without lecturing.
- Never say "don't marry", "this relationship will fail", "bad match" or anything that frightens or shames. No doom, no fear of illness, death, divorce or bad luck.
- Never suggest paid remedies, gemstones, pujas, mantras for a fee, astrologer consultations, fasting or rituals to "fix" a chart.
- Manglik (Kuja) dosha: explain calmly. It is very common (roughly half of all charts by some counts), there are many traditional cancellations, and many Manglik people have happy marriages with non-Manglik partners.
- A low score is not a verdict: real compatibility comes from respect, communication, shared values and effort. Encourage the couple to talk openly.
- Use the numbers exactly as given; do not recalculate or invent points, signs or nakshatras.`;

const signName = (i: unknown) => {
  const n = Math.round(Number(i));
  return Number.isInteger(n) && n >= 0 && n < 12 ? `${RASHIS[n].sanskrit} (${RASHIS[n].english})` : 'unknown';
};

interface KootaIn {
  name?: unknown;
  points?: unknown;
  max?: unknown;
  boy?: unknown;
  girl?: unknown;
}
const kootaLines = (v: unknown) =>
  (Array.isArray(v) ? v : [])
    .slice(0, 8)
    .map((k: KootaIn) => `- ${str(k.name, 30)}: ${num(k.points, 0, 8, 0)}/${num(k.max, 1, 8, 1)} (boy: ${str(k.boy, 60)}, girl: ${str(k.girl, 60)})`)
    .join('\n');

const personLine = (label: string, p: unknown) => {
  const x = (p ?? {}) as Record<string, unknown>;
  return `${label}: ${str(x.name, 60) || label}; Moon sign ${signName(x.rashi)}; nakshatra ${str(x.nakshatra, 40)}${x.pada ? ` pada ${num(x.pada, 1, 4, 1)}` : ''}; Manglik: ${x.manglik ? 'yes' : 'no'}${x.timeKnown === false ? ' (birth time unknown, so the Lagna-based part is not reliable)' : ''}.`;
};

export const ASTRO_TASKS = {
  kundliExplain: {
    effort: 'low',
    schema: z.object({
      headline: z.string().describe('one warm, short line about this match (no score verdicts like "bad match")'),
      summary: z.string().describe('3-5 sentences in simple words explaining what the score means traditionally'),
      strengths: z.array(z.string()).describe('2-4 kootas or traits that look supportive, each one sentence'),
      growthAreas: z.array(z.string()).describe('1-3 gentle things to be mindful of, framed as conversation topics, never as warnings'),
      manglikNote: z.string().describe('calm one or two sentences about Manglik status for both'),
      conversationStarters: z.array(z.string()).describe('2-3 questions the couple could ask each other'),
      reminder: z.string().describe('one sentence: this is cultural guidance and the relationship is built by the two of them'),
    }),
    build: (i) =>
      `${JYOTISH_GUARDRAILS}

Explain this Ashtakoota Guna Milan (Kundli Milan) result to a young couple in ${lang(i.language)}. Keep it short, kind and practical.

${personLine('Boy', i.boy)}
${personLine('Girl', i.girl)}
Total: ${num(i.total, 0, 36, 0)} out of 36 (traditionally 18 or more is considered a good match). Label shown in the app: "${str(i.label, 80)}".
Koota points (computed by the app, do not change them):
${kootaLines(i.kootas)}
Manglik comparison: ${str(i.manglikSummary, 400)}
${str(i.notes, 600) ? `Traditional notes: ${str(i.notes, 600)}` : ''}`,
  },

  rashifal: {
    effort: 'low',
    schema: z.object({
      headline: z.string().describe('a short, upbeat title for today (max 8 words)'),
      overview: z.string().describe('2-3 sentences on the love and relationship mood today'),
      forSingles: z.string().describe('1-2 sentences for singles'),
      forCouples: z.string().describe('1-2 sentences for couples'),
      tip: z.string().describe('one small, practical, kind action for today'),
      luckyColor: z.string(),
      luckyNumber: z.number().describe('1-9'),
    }),
    build: (i) =>
      `${JYOTISH_GUARDRAILS}
- Daily rashifal is light, playful reflection. Keep it hopeful and specific, never ominous. No health, money or career predictions.

Write today's love rashifal for Moon sign ${signName(i.sign)} in ${lang(i.language)}.
Date (India): ${str(i.date, 20)}. Make it feel fresh for this date; do not mention the year.`,
  },

  compatibility: {
    effort: 'low',
    schema: z.object({
      verdict: z.string().describe('a short, upbeat title for the result (max 6 words, no emoji)'),
      analysis: z.string().describe('3-4 sentences that refer to their actual answers and signs'),
      strengths: z.array(z.string()).describe('2-3 things going well'),
      tip: z.string().describe('one concrete thing to try this week'),
    }),
    build: (i) => {
      const answers = (Array.isArray(i.answers) ? i.answers : [])
        .slice(0, 10)
        .map((a: { question?: unknown; answer?: unknown }) => `- ${str(a.question, 120)} ${str(a.answer, 80)}`)
        .join('\n');
      const b = (i.breakdown ?? {}) as Record<string, unknown>;
      const guna = (i.guna ?? null) as Record<string, unknown> | null;
      return `${guna ? `${JYOTISH_GUARDRAILS}\n\n` : ''}This is the app's love calculator: a playful, honest read for fun. The score was computed by the app from the user's answers${guna ? ' and the Guna Milan engine' : ' and sun signs'}; explain it, do not change it. Never call it a verdict on the relationship.
Write in ${lang(i.language)}.

${str(i.yourName, 60)} and ${str(i.theirName, 60)} (stage: ${str(i.relationshipType, 40) || 'not specified'}).
Mode: ${guna ? 'Jyotish (Guna Milan)' : 'fun'}. Overall: ${num(i.overallScore, 0, 100, 0)}%.
Breakdown: chemistry ${num(b.chemistry, 0, 100, 0)}%, communication ${num(b.communication, 0, 100, 0)}%, personality ${num(b.personality, 0, 100, 0)}%, emotional connection ${num(b.emotionalConnection, 0, 100, 0)}%.
${str(i.signNote, 300) ? `Sun signs: ${str(i.signNote, 300)}\n` : ''}${guna ? `Guna Milan: ${num(guna.total, 0, 36, 0)}/36 (${str(guna.label, 80)}). Kootas:\n${kootaLines(guna.kootas)}\nManglik: ${str(guna.manglikSummary, 300)}\n` : ''}${answers ? `Their answers:\n${answers}` : 'They skipped the quick questions.'}`;
    },
  },
} satisfies Record<string, TaskDef>;
