/**
 * Jyotish names shared by the website and the server (the daily rashifal endpoint).
 * No imports: this file runs in the browser and in Node.
 */

export type AstroLanguage = 'english' | 'hinglish' | 'hindi';
export const ASTRO_LANGUAGES: AstroLanguage[] = ['english', 'hinglish', 'hindi'];
export const isAstroLanguage = (v: unknown): v is AstroLanguage => v === 'english' || v === 'hinglish' || v === 'hindi';

export interface RashiInfo {
  /** Sanskrit name, Roman script */
  sanskrit: string;
  /** Hindi name, Devanagari */
  hindi: string;
  /** Western sign with the same span of the zodiac */
  english: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  /** Ruling planet (Moon sign lord), used by Graha Maitri */
  lord: 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
}

/** The 12 rashis in zodiac order (index 0 = Mesha / Aries). */
export const RASHIS: RashiInfo[] = [
  { sanskrit: 'Mesha', hindi: 'मेष', english: 'Aries', symbol: '♈', element: 'Fire', lord: 'Mars' },
  { sanskrit: 'Vrishabha', hindi: 'वृषभ', english: 'Taurus', symbol: '♉', element: 'Earth', lord: 'Venus' },
  { sanskrit: 'Mithuna', hindi: 'मिथुन', english: 'Gemini', symbol: '♊', element: 'Air', lord: 'Mercury' },
  { sanskrit: 'Karka', hindi: 'कर्क', english: 'Cancer', symbol: '♋', element: 'Water', lord: 'Moon' },
  { sanskrit: 'Simha', hindi: 'सिंह', english: 'Leo', symbol: '♌', element: 'Fire', lord: 'Sun' },
  { sanskrit: 'Kanya', hindi: 'कन्या', english: 'Virgo', symbol: '♍', element: 'Earth', lord: 'Mercury' },
  { sanskrit: 'Tula', hindi: 'तुला', english: 'Libra', symbol: '♎', element: 'Air', lord: 'Venus' },
  { sanskrit: 'Vrishchika', hindi: 'वृश्चिक', english: 'Scorpio', symbol: '♏', element: 'Water', lord: 'Mars' },
  { sanskrit: 'Dhanu', hindi: 'धनु', english: 'Sagittarius', symbol: '♐', element: 'Fire', lord: 'Jupiter' },
  { sanskrit: 'Makara', hindi: 'मकर', english: 'Capricorn', symbol: '♑', element: 'Earth', lord: 'Saturn' },
  { sanskrit: 'Kumbha', hindi: 'कुंभ', english: 'Aquarius', symbol: '♒', element: 'Air', lord: 'Saturn' },
  { sanskrit: 'Meena', hindi: 'मीन', english: 'Pisces', symbol: '♓', element: 'Water', lord: 'Jupiter' },
];

export const rashiLabel = (i: number) => `${RASHIS[i].sanskrit} (${RASHIS[i].english})`;

/** Calendar date in India (IST, UTC+5:30) as YYYY-MM-DD. */
export function indiaDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** Shown on every Jyotish page and in every Jyotish AI answer. */
export const JYOTISH_NOTE = 'Jyotish is shared as cultural guidance, not a prediction.';
