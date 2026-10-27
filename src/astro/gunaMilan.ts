/**
 * Ashtakoota Guna Milan (36 points) from each person's Moon nakshatra and Moon sign,
 * plus the Manglik (Kuja) dosha comparison.
 *
 * Tables: the standard North Indian ones. Gana and Vashya grids follow OnlineJyotish
 * (rows = girl, columns = boy); the Yoni grid is the common 14x14 table; Graha Maitri is
 * derived from the natural planetary friendships. Some families and software use slightly
 * different variants, which is noted in the UI. The base score is shown; traditional
 * cancellations (parihara) are listed as notes and never change the number silently.
 */
import { RASHIS } from '../../shared/jyotish.ts';
import { NAKSHATRAS, YONIS, type Gana, type Nadi } from './constants.ts';
import type { Chart, ManglikInfo } from './engine.ts';

export interface MoonPlacement {
  nakshatra: number;
  rashi: number;
  /** Moon's degree inside its sign (Vashya splits Dhanu and Makara in halves) */
  degree: number;
}

export type KootaKey = 'varna' | 'vashya' | 'tara' | 'yoni' | 'grahaMaitri' | 'gana' | 'bhakoot' | 'nadi';

export interface KootaResult {
  key: KootaKey;
  name: string;
  max: number;
  points: number;
  /** What it looks at, one line */
  meaning: string;
  boy: string;
  girl: string;
  /** Short reading of this pair */
  detail: string;
  /** Traditional cancellation, when one applies */
  cancellation?: string;
}

export interface GunaMilanResult {
  total: number;
  max: 36;
  kootas: KootaResult[];
  label: string;
  tone: 'excellent' | 'good' | 'average' | 'low';
}

/* ---------- Varna (1) ---------- */
const VARNAS = ['Shudra', 'Vaishya', 'Kshatriya', 'Brahmin'] as const;
/** Rank by Moon sign: water Brahmin, fire Kshatriya, earth Vaishya, air Shudra. */
const varnaOf = (rashi: number) => ({ Water: 3, Fire: 2, Earth: 1, Air: 0 })[RASHIS[rashi].element];

/* ---------- Vashya (2) ---------- */
const VASHYAS = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'] as const;
function vashyaOf(rashi: number, degree: number): number {
  switch (rashi) {
    case 0:
    case 1:
      return 0;
    case 2:
    case 5:
    case 6:
    case 10:
      return 1;
    case 3:
    case 11:
      return 2;
    case 4:
      return 3;
    case 7:
      return 4;
    case 8:
      return degree < 15 ? 1 : 0; // Dhanu: first half human, second half quadruped
    default:
      return degree < 15 ? 0 : 2; // Makara: first half quadruped, second half aquatic
  }
}
/** rows = girl, columns = boy */
const VASHYA_GRID = [
  [2, 1, 1, 0, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0, 0, 1, 2, 0],
  [1, 0, 1, 0, 2],
];

/* ---------- Tara (3) ---------- */
const TARAS = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra'];
/** Tara (1..9) of `to` counted from `from`, both nakshatra indexes. */
const taraOf = (from: number, to: number) => (((to - from + 27) % 27) % 9) + 1;
const taraGood = (t: number) => t !== 3 && t !== 5 && t !== 7;

/* ---------- Yoni (4) ---------- */
/** Order follows YONIS. Symmetric. */
const YONI_GRID = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
];

/* ---------- Graha Maitri (5) ---------- */
type Lord = (typeof RASHIS)[number]['lord'];
const FRIENDS: Record<Lord, { f: Lord[]; e: Lord[] }> = {
  Sun: { f: ['Moon', 'Mars', 'Jupiter'], e: ['Venus', 'Saturn'] },
  Moon: { f: ['Sun', 'Mercury'], e: [] },
  Mars: { f: ['Sun', 'Moon', 'Jupiter'], e: ['Mercury'] },
  Mercury: { f: ['Sun', 'Venus'], e: ['Moon'] },
  Jupiter: { f: ['Sun', 'Moon', 'Mars'], e: ['Mercury', 'Venus'] },
  Venus: { f: ['Mercury', 'Saturn'], e: ['Sun', 'Moon'] },
  Saturn: { f: ['Mercury', 'Venus'], e: ['Sun', 'Moon', 'Mars'] },
};
type Relation = 'friend' | 'neutral' | 'enemy';
export const relation = (a: Lord, b: Lord): Relation => (a === b || FRIENDS[a].f.includes(b) ? 'friend' : FRIENDS[a].e.includes(b) ? 'enemy' : 'neutral');
function maitriPoints(a: Lord, b: Lord): number {
  if (a === b) return 5;
  const pair = [relation(a, b), relation(b, a)].sort().join('+');
  return ({ 'friend+friend': 5, 'friend+neutral': 4, 'neutral+neutral': 3, 'enemy+friend': 1, 'enemy+neutral': 0.5, 'enemy+enemy': 0 } as Record<string, number>)[pair];
}

/* ---------- Gana (6) ---------- */
const GANA_INDEX: Record<Gana, number> = { Deva: 0, Manushya: 1, Rakshasa: 2 };
/** rows = girl, columns = boy */
const GANA_GRID = [
  [6, 6, 0],
  [5, 6, 0],
  [1, 0, 6],
];

/* ---------- Bhakoot (7) ---------- */
/** Position of `to` counted from `from` (1..12). */
const signCount = (from: number, to: number) => ((to - from + 12) % 12) + 1;

const MEANINGS: Record<KootaKey, string> = {
  varna: 'Work style and ego balance',
  vashya: 'Natural pull and give-and-take',
  tara: 'Wellbeing and fortune, from the birth stars',
  yoni: 'Physical comfort and intimacy',
  grahaMaitri: 'Mental wavelength: friendship of the Moon-sign lords',
  gana: 'Temperament (Deva, Manushya, Rakshasa)',
  bhakoot: 'Emotional rhythm and family growth, from the Moon signs',
  nadi: 'Health and constitution (the most weighted koota)',
};

export function gunaMilan(boy: MoonPlacement, girl: MoonPlacement): GunaMilanResult {
  const bN = NAKSHATRAS[boy.nakshatra];
  const gN = NAKSHATRAS[girl.nakshatra];
  const bLord = RASHIS[boy.rashi].lord;
  const gLord = RASHIS[girl.rashi].lord;
  const kootas: KootaResult[] = [];

  // 1. Varna
  const bv = varnaOf(boy.rashi);
  const gv = varnaOf(girl.rashi);
  kootas.push({
    key: 'varna',
    name: 'Varna',
    max: 1,
    points: bv >= gv ? 1 : 0,
    meaning: MEANINGS.varna,
    boy: VARNAS[bv],
    girl: VARNAS[gv],
    detail: bv >= gv ? 'Traditionally balanced.' : "The boy's varna is traditionally read as lower than the girl's.",
  });

  // 2. Vashya
  const bVa = vashyaOf(boy.rashi, boy.degree);
  const gVa = vashyaOf(girl.rashi, girl.degree);
  const vashya = VASHYA_GRID[gVa][bVa];
  kootas.push({
    key: 'vashya',
    name: 'Vashya',
    max: 2,
    points: vashya,
    meaning: MEANINGS.vashya,
    boy: VASHYAS[bVa],
    girl: VASHYAS[gVa],
    detail: vashya === 2 ? 'Same group: easy mutual influence.' : vashya >= 1 ? 'Compatible groups.' : vashya > 0 ? 'Partly compatible groups.' : 'Groups that traditionally pull in different directions.',
  });

  // 3. Tara
  const tGirlToBoy = taraOf(girl.nakshatra, boy.nakshatra);
  const tBoyToGirl = taraOf(boy.nakshatra, girl.nakshatra);
  const tara = (taraGood(tGirlToBoy) ? 1.5 : 0) + (taraGood(tBoyToGirl) ? 1.5 : 0);
  kootas.push({
    key: 'tara',
    name: 'Tara',
    max: 3,
    points: tara,
    meaning: MEANINGS.tara,
    boy: `${TARAS[tBoyToGirl - 1]} (to girl)`,
    girl: `${TARAS[tGirlToBoy - 1]} (to boy)`,
    detail: tara === 3 ? 'Both star counts are auspicious.' : tara > 0 ? 'One of the two star counts is auspicious.' : 'Neither star count is traditionally auspicious.',
  });

  // 4. Yoni
  const bY = YONIS.indexOf(bN.yoni);
  const gY = YONIS.indexOf(gN.yoni);
  const yoni = YONI_GRID[gY][bY];
  kootas.push({
    key: 'yoni',
    name: 'Yoni',
    max: 4,
    points: yoni,
    meaning: MEANINGS.yoni,
    boy: bN.yoni,
    girl: gN.yoni,
    detail: ['Traditionally opposite natures.', 'Some natural friction.', 'Neutral.', 'Friendly natures.', 'Same nature.'][yoni],
  });

  // 5. Graha Maitri
  const maitri = maitriPoints(bLord, gLord);
  kootas.push({
    key: 'grahaMaitri',
    name: 'Graha Maitri',
    max: 5,
    points: maitri,
    meaning: MEANINGS.grahaMaitri,
    boy: bLord,
    girl: gLord,
    detail: bLord === gLord ? 'Same lord: a shared wavelength.' : `${bLord} sees ${gLord} as ${relation(bLord, gLord)}; ${gLord} sees ${bLord} as ${relation(gLord, bLord)}.`,
  });

  // 6. Gana
  const gana = GANA_GRID[GANA_INDEX[gN.gana]][GANA_INDEX[bN.gana]];
  kootas.push({
    key: 'gana',
    name: 'Gana',
    max: 6,
    points: gana,
    meaning: MEANINGS.gana,
    boy: bN.gana,
    girl: gN.gana,
    detail: bN.gana === gN.gana ? 'Same temperament.' : gana >= 5 ? 'Close temperaments.' : 'Different temperaments: patience and talking help.',
  });

  // 7. Bhakoot
  const c1 = signCount(girl.rashi, boy.rashi);
  const c2 = signCount(boy.rashi, girl.rashi);
  const pair = [c1, c2].sort((a, b) => a - b).join('/');
  const dosha = ['2/12', '5/9', '6/8'].includes(pair);
  let bhakootCancel: string | undefined;
  if (dosha) {
    const mutualFriends = bLord === gLord || (relation(bLord, gLord) === 'friend' && relation(gLord, bLord) === 'friend');
    const oneFriendly = relation(bLord, gLord) === 'friend' || relation(gLord, bLord) === 'friend';
    if (mutualFriends || (pair !== '6/8' && oneFriendly)) bhakootCancel = 'The Moon-sign lords are friendly, which tradition counts as cancelling this Bhakoot dosha.';
  }
  kootas.push({
    key: 'bhakoot',
    name: 'Bhakoot',
    max: 7,
    points: dosha ? 0 : 7,
    meaning: MEANINGS.bhakoot,
    boy: RASHIS[boy.rashi].sanskrit,
    girl: RASHIS[girl.rashi].sanskrit,
    detail: dosha ? `The Moon signs sit ${pair} from each other (Bhakoot dosha).` : `The Moon signs sit ${pair} from each other: a supportive placement.`,
    cancellation: bhakootCancel,
  });

  // 8. Nadi
  const sameNadi = bN.nadi === gN.nadi;
  let nadiCancel: string | undefined;
  if (sameNadi) {
    if (boy.rashi === girl.rashi && boy.nakshatra !== girl.nakshatra) nadiCancel = 'Same Moon sign but different nakshatras: tradition counts this Nadi dosha as cancelled.';
    else if (boy.nakshatra === girl.nakshatra && boy.rashi !== girl.rashi) nadiCancel = 'Same nakshatra but different Moon signs: tradition counts this Nadi dosha as cancelled.';
    else if (bLord === gLord || (relation(bLord, gLord) === 'friend' && relation(gLord, bLord) === 'friend')) nadiCancel = 'The Moon-sign lords are the same or mutual friends, which many families accept as a cancellation.';
  }
  kootas.push({
    key: 'nadi',
    name: 'Nadi',
    max: 8,
    points: sameNadi ? 0 : 8,
    meaning: MEANINGS.nadi,
    boy: bN.nadi as Nadi,
    girl: gN.nadi as Nadi,
    detail: sameNadi ? 'Same nadi (Nadi dosha).' : 'Different nadis: no Nadi dosha.',
    cancellation: nadiCancel,
  });

  const total = kootas.reduce((s, k) => s + k.points, 0);
  return { total, max: 36, kootas, ...scoreLabel(total) };
}

export function scoreLabel(total: number): { label: string; tone: GunaMilanResult['tone'] } {
  if (total >= 28) return { label: 'Excellent match traditionally', tone: 'excellent' };
  if (total >= 18) return { label: 'Good match traditionally', tone: 'good' };
  if (total >= 12) return { label: 'Below the traditional 18 mark', tone: 'average' };
  return { label: 'Low on the traditional scale', tone: 'low' };
}

export const placementOf = (c: Chart): MoonPlacement => ({ nakshatra: c.nakshatra, rashi: c.rashi, degree: c.planets.Moon.degree });

export type ManglikMatch = 'none' | 'both' | 'one';

export interface ManglikComparison {
  status: ManglikMatch;
  summary: string;
}

/** Common rule: Manglik dosha is neutralised when both partners are Manglik. */
export function compareManglik(boy: ManglikInfo, girl: ManglikInfo): ManglikComparison {
  if (boy.isManglik && girl.isManglik) return { status: 'both', summary: 'Both are Manglik, so by the common rule the dosha is neutralised (cancelled).' };
  if (!boy.isManglik && !girl.isManglik) return { status: 'none', summary: 'Neither chart has Manglik dosha.' };
  return {
    status: 'one',
    summary: `${boy.isManglik ? 'The boy' : 'The girl'} is Manglik and the other is not. This is very common; families often look at the full chart, where many cancellations apply, and lots of such couples are happily married.`,
  };
}

export interface ChartMatch {
  guna: GunaMilanResult;
  manglik: ManglikComparison;
  /** Traditional cancellation notes, joined */
  notes: string;
  /** Birth-time caveats for either person */
  caveats: string[];
}

/** Guna Milan + Manglik for two computed charts. */
export function matchCharts(boy: Chart, girl: Chart): ChartMatch {
  const guna = gunaMilan(placementOf(boy), placementOf(girl));
  const caveats: string[] = [];
  for (const [who, c] of [
    ['Boy', boy],
    ['Girl', girl],
  ] as const) {
    if (!c.timeKnown) {
      const naks = c.dayRange?.nakshatras ?? [];
      const rashis = c.dayRange?.rashis ?? [];
      caveats.push(
        naks.length > 1
          ? `${who}'s birth time is unknown and the Moon moved from ${naks.map((n) => NAKSHATRAS[n].name).join(' to ')} that day, so the score could change with the real time.`
          : rashis.length > 1
            ? `${who}'s birth time is unknown and the Moon changed sign (${rashis.map((r) => RASHIS[r].sanskrit).join(' to ')}) that day, so the score could change with the real time.`
          : `${who}'s birth time is unknown: the Moon stayed in ${NAKSHATRAS[c.nakshatra].name} all day, so the score holds, but the Lagna-based Manglik check is skipped.`
      );
    }
  }
  return {
    guna,
    manglik: compareManglik(boy.manglik, girl.manglik),
    notes: guna.kootas
      .filter((k) => k.cancellation)
      .map((k) => `${k.name}: ${k.cancellation}`)
      .join(' '),
    caveats,
  };
}

export function describeManglik(m: ManglikInfo): string {
  const parts: string[] = [];
  if (m.lagnaReliable) parts.push(`Mars is in house ${m.fromLagnaHouse} from the Lagna${m.fromLagna ? ' (a Manglik house)' : ''}`);
  else parts.push('Lagna-based check skipped (birth time unknown)');
  parts.push(`house ${m.fromMoonHouse} from the Moon${m.fromMoon ? ' (a Manglik house)' : ''}`);
  return `${parts.join('; ')}.`;
}
