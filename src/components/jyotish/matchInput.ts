import type { AstroLanguage } from '../../../shared/jyotish';
import { NAKSHATRAS } from '../../astro/constants';
import type { Chart } from '../../astro/engine';
import type { ChartMatch, GunaMilanResult } from '../../astro/gunaMilan';
import type { KootaSummary, KundliExplainInput, KundliPersonSummary } from '../../services/aiContentAstro';

export const kootaSummaries = (g: GunaMilanResult): KootaSummary[] => g.kootas.map((k) => ({ name: k.name, points: k.points, max: k.max, boy: k.boy, girl: k.girl }));

const person = (c: Chart, fallback: string): KundliPersonSummary => ({
  name: c.input.name || fallback,
  rashi: c.rashi,
  nakshatra: NAKSHATRAS[c.nakshatra].name,
  pada: c.pada,
  manglik: c.manglik.isManglik,
  timeKnown: c.timeKnown,
});

export function kundliExplainInput(boy: Chart, girl: Chart, m: ChartMatch, language: AstroLanguage): KundliExplainInput {
  return {
    boy: person(boy, 'Boy'),
    girl: person(girl, 'Girl'),
    total: m.guna.total,
    label: m.guna.label,
    kootas: kootaSummaries(m.guna),
    manglikSummary: m.manglik.summary,
    notes: [m.notes, ...m.caveats].filter(Boolean).join(' '),
    language,
  };
}

/** Guna Milan mapped onto the love calculator's four bars (percent). */
export function gunaBreakdown(g: GunaMilanResult) {
  const pts = Object.fromEntries(g.kootas.map((k) => [k.key, k.points])) as Record<string, number>;
  const pct = (n: number, d: number) => Math.round((n / d) * 100);
  return {
    chemistry: pct(pts.yoni + pts.vashya, 6),
    communication: pct(pts.grahaMaitri + pts.tara, 8),
    personality: pct(pts.gana + pts.varna, 7),
    emotionalConnection: pct(pts.bhakoot + pts.nadi, 15),
  };
}
