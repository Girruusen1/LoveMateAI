/**
 * Love calculator "fun mode": a playful score computed from what the user actually tells us
 * (their answers, and Western sun signs from the birthdays). Same inputs, same score.
 * The AI only writes the words around these numbers.
 */
import { RASHIS } from '../../shared/jyotish.ts';
import { westernSignFromDate } from './engine.ts';

export interface QuizQuestion {
  id: string;
  label: string;
  options: string[];
  /** Which breakdown bars this answer feeds */
  feeds: ('chemistry' | 'communication' | 'personality' | 'emotionalConnection')[];
}

export const LOVE_QUIZ: QuizQuestion[] = [
  { id: 'talk', label: 'How often do you two talk?', options: ['Rarely', 'Some days', 'Most days', 'All day'], feeds: ['communication', 'emotionalConnection'] },
  { id: 'flow', label: 'How do your conversations feel?', options: ['A bit awkward', 'Okay', 'Easy', "Can't stop talking"], feeds: ['communication', 'chemistry'] },
  { id: 'laugh', label: 'Do you laugh together?', options: ['Not really', 'Sometimes', 'Often', 'All the time'], feeds: ['chemistry', 'personality'] },
  { id: 'conflict', label: 'When something feels off, you two…', options: ['Avoid it', 'Wait it out', 'Talk eventually', 'Talk it out kindly'], feeds: ['communication', 'emotionalConnection'] },
  { id: 'shared', label: 'Shared interests or plans?', options: ['Very few', 'Some', 'Many', 'We plan things together'], feeds: ['personality', 'emotionalConnection'] },
  { id: 'safe', label: 'Can you be your real self around them?', options: ['Not yet', 'Mostly', 'Yes', 'Completely'], feeds: ['emotionalConnection', 'personality'] },
];

export type QuizAnswers = Record<string, number>;

export interface FunScore {
  overallScore: number;
  breakdown: { chemistry: number; communication: number; personality: number; emotionalConnection: number };
  yourSign: number | null;
  theirSign: number | null;
  /** One line on the sun-sign pairing, if both birthdays were given */
  signNote: string | null;
  answeredCount: number;
}

/** Western element pairing: same element or complementary (fire–air, earth–water) is the classic "easy" match. */
export function elementScore(a: number, b: number): { score: number; note: string } {
  const ea = RASHIS[a].element;
  const eb = RASHIS[b].element;
  const pair = [ea, eb].sort().join('+');
  if (a === b) return { score: 86, note: `Both ${RASHIS[a].english}: you just get each other, and you can mirror each other's moods too.` };
  if (ea === eb) return { score: 90, note: `Two ${ea.toLowerCase()} signs (${RASHIS[a].english} and ${RASHIS[b].english}): a natural shared rhythm.` };
  if (pair === 'Air+Fire' || pair === 'Earth+Water') return { score: 88, note: `${ea} and ${eb} (${RASHIS[a].english} and ${RASHIS[b].english}) feed each other: a classic easy pairing.` };
  if (pair === 'Earth+Fire' || pair === 'Air+Water') return { score: 68, note: `${ea} and ${eb} (${RASHIS[a].english} and ${RASHIS[b].english}) see life differently: more to learn from each other.` };
  return { score: 74, note: `${ea} and ${eb} (${RASHIS[a].english} and ${RASHIS[b].english}): opposites with spark that need patience.` };
}

/** Tiny deterministic "name chemistry" nudge (−4..+4) so it still feels like a love calculator. */
function nameNudge(a: string, b: string): number {
  const s = [a, b].map((x) => x.trim().toLowerCase()).sort().join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 9) - 4;
}

const clamp = (n: number) => Math.max(5, Math.min(99, Math.round(n)));

export function funLoveScore(input: { yourName: string; theirName: string; birthdaySelf?: string; birthdayPartner?: string; answers: QuizAnswers }): FunScore {
  const yourSign = input.birthdaySelf ? westernSignFromDate(input.birthdaySelf) : null;
  const theirSign = input.birthdayPartner ? westernSignFromDate(input.birthdayPartner) : null;
  const signs = yourSign != null && theirSign != null ? elementScore(yourSign, theirSign) : null;

  const sums = { chemistry: [] as number[], communication: [] as number[], personality: [] as number[], emotionalConnection: [] as number[] };
  let answered = 0;
  for (const q of LOVE_QUIZ) {
    const a = input.answers[q.id];
    if (a == null || a < 0 || a > 3) continue;
    answered++;
    const value = 40 + a * 19; // 40, 59, 78, 97
    for (const f of q.feeds) sums[f].push(value);
  }
  const avg = (xs: number[], fallback: number) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : fallback);
  const neutral = 70;
  const nudge = nameNudge(input.yourName, input.theirName);
  const chemistry = clamp(avg(sums.chemistry, neutral) * (signs ? 0.8 : 1) + (signs ? signs.score * 0.2 : 0) + nudge);
  const communication = clamp(avg(sums.communication, neutral));
  const personality = clamp(signs ? avg(sums.personality, neutral) * 0.6 + signs.score * 0.4 : avg(sums.personality, neutral));
  const emotionalConnection = clamp(avg(sums.emotionalConnection, neutral));
  const overallScore = clamp(chemistry * 0.25 + communication * 0.3 + personality * 0.2 + emotionalConnection * 0.25);
  return { overallScore, breakdown: { chemistry, communication, personality, emotionalConnection }, yourSign, theirSign, signNote: signs?.note ?? null, answeredCount: answered };
}

export function funVerdict(score: number): string {
  if (score >= 88) return 'Rare, easy chemistry';
  if (score >= 76) return 'Warm and promising';
  if (score >= 62) return 'A good base to build on';
  if (score >= 48) return 'Still finding your rhythm';
  return 'Early days: lots to discover';
}
