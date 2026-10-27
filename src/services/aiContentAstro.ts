/**
 * Jyotish + love calculator: request/response shapes and the offline (demo mode) writers.
 * The numbers always come from src/astro; these only put words around them.
 */
import type { AstroLanguage } from '../../shared/jyotish';
import type { CompatibilityResult } from '../types';

export interface KootaSummary {
  name: string;
  points: number;
  max: number;
  boy: string;
  girl: string;
}

export interface KundliPersonSummary {
  name: string;
  rashi: number;
  nakshatra: string;
  pada: number;
  manglik: boolean;
  timeKnown: boolean;
}

export interface KundliExplainInput {
  boy: KundliPersonSummary;
  girl: KundliPersonSummary;
  total: number;
  label: string;
  kootas: KootaSummary[];
  manglikSummary: string;
  /** Traditional cancellation notes */
  notes: string;
  language: AstroLanguage;
}

export interface KundliExplanation {
  headline: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  manglikNote: string;
  conversationStarters: string[];
  reminder: string;
}

export interface CompatibilityInput {
  yourName: string;
  theirName: string;
  relationshipType: string;
  language: AstroLanguage;
  mode: 'fun' | 'jyotish';
  birthdaySelf?: string;
  birthdayPartner?: string;
  answers: { question: string; answer: string }[];
  overallScore: number;
  breakdown: CompatibilityResult['breakdown'];
  signNote?: string | null;
  /** Jyotish mode only */
  guna?: { total: number; label: string; kootas: KootaSummary[]; manglikSummary: string };
  verdict: string;
}

const T = (lang: AstroLanguage, en: string, hi: string, hn: string) => (lang === 'hindi' ? hi : lang === 'hinglish' ? hn : en);

export function offlineKundliExplanation(i: KundliExplainInput): KundliExplanation {
  const strong = [...i.kootas].filter((k) => k.points / k.max >= 0.75).sort((a, b) => b.max - a.max).slice(0, 3);
  const soft = [...i.kootas].filter((k) => k.points / k.max < 0.5).sort((a, b) => b.max - a.max).slice(0, 2);
  const L = i.language;
  return {
    headline: T(L, `${i.boy.name} and ${i.girl.name}: ${i.total}/36`, `${i.boy.name} और ${i.girl.name}: ${i.total}/36`, `${i.boy.name} aur ${i.girl.name}: ${i.total}/36`),
    summary: T(
      L,
      `Your Guna Milan is ${i.total} out of 36 (${i.label.toLowerCase()}). Traditionally 18 or more is seen as a good base. The score looks only at the two Moon signs and nakshatras, so it is one small cultural lens on a relationship, not a verdict.`,
      `आपका गुण मिलान 36 में से ${i.total} है। परंपरा में 18 या उससे अधिक को अच्छा आधार माना जाता है। यह केवल चंद्र राशि और नक्षत्र देखता है, इसलिए इसे एक सांस्कृतिक नज़रिया समझें, फ़ैसला नहीं।`,
      `Aapka Guna Milan 36 mein se ${i.total} hai. Traditionally 18 ya usse zyada ko achha base maana jaata hai. Ye sirf Moon sign aur nakshatra dekhta hai, to ise ek cultural lens samjho, faisla nahi.`
    ),
    strengths: strong.length
      ? strong.map((k) => T(L, `${k.name} is strong (${k.points}/${k.max}).`, `${k.name} मज़बूत है (${k.points}/${k.max})।`, `${k.name} strong hai (${k.points}/${k.max}).`))
      : [T(L, 'Every couple has strengths no chart can see: start with what you enjoy together.', 'हर जोड़ी की ताकतें कुंडली से आगे होती हैं।', 'Har couple ki strengths kundli se aage hoti hain.')],
    growthAreas: soft.map((k) =>
      T(L, `${k.name} is lower (${k.points}/${k.max}): a nice prompt to talk about how you each handle this side of life.`, `${k.name} कम है (${k.points}/${k.max}): इस विषय पर खुलकर बात करें।`, `${k.name} kam hai (${k.points}/${k.max}): is topic par khul ke baat karo.`)
    ),
    manglikNote: i.manglikSummary,
    conversationStarters: [
      T(L, 'What does a good week together look like for you?', 'आपके लिए साथ बिताया अच्छा हफ़्ता कैसा होता है?', 'Tumhare liye saath ka ek achha hafta kaisa hota hai?'),
      T(L, 'How do you like to make up after a disagreement?', 'झगड़े के बाद आप कैसे सुलह करना पसंद करते हैं?', 'Jhagde ke baad tum kaise patch-up karna pasand karte ho?'),
    ],
    reminder: T(L, 'Jyotish is cultural guidance. Your relationship is built by the two of you.', 'ज्योतिष सांस्कृतिक मार्गदर्शन है। रिश्ता आप दोनों मिलकर बनाते हैं।', 'Jyotish cultural guidance hai. Rishta tum dono milke banate ho.'),
  };
}

export function offlineCompatibility(i: CompatibilityInput): Pick<CompatibilityResult, 'aiAnalysis' | 'verdict' | 'strengths' | 'tip'> {
  const L = i.language;
  const bars = Object.entries(i.breakdown).sort((a, b) => b[1] - a[1]);
  const label: Record<string, string> = { chemistry: 'chemistry', communication: 'communication', personality: 'personality fit', emotionalConnection: 'emotional connection' };
  const top = label[bars[0][0]];
  const low = label[bars[bars.length - 1][0]];
  const base =
    i.mode === 'jyotish' && i.guna
      ? T(
          L,
          `Your Guna Milan is ${i.guna.total}/36 (${i.guna.label.toLowerCase()}). Your strongest side is ${top}; ${low} is where a little extra care goes a long way.`,
          `आपका गुण मिलान ${i.guna.total}/36 है। सबसे मज़बूत पक्ष ${top} है; ${low} पर थोड़ा ध्यान दें।`,
          `Aapka Guna Milan ${i.guna.total}/36 hai. Sabse strong side ${top} hai; ${low} par thoda extra dhyaan do.`
        )
      : T(
          L,
          `${i.yourName} and ${i.theirName} score ${i.overallScore}%. From your answers, ${top} stands out, while ${low} is the area to grow together.${i.signNote ? ` ${i.signNote}` : ''}`,
          `${i.yourName} और ${i.theirName} का स्कोर ${i.overallScore}% है। आपके जवाबों में ${top} सबसे अलग दिखता है, और ${low} में साथ बढ़ने की जगह है।`,
          `${i.yourName} aur ${i.theirName} ka score ${i.overallScore}% hai. Tumhare answers mein ${top} sabse strong hai, aur ${low} mein saath grow karne ki jagah hai.`
        );
  return {
    verdict: i.verdict,
    aiAnalysis: base,
    strengths: [T(L, `Strong ${top}`, `मज़बूत ${top}`, `Strong ${top}`)],
    tip: T(L, 'Ask them one new question this week and really listen.', 'इस हफ़्ते उनसे एक नया सवाल पूछें और ध्यान से सुनें।', 'Is hafte unse ek naya sawaal poocho aur dhyaan se suno.'),
  };
}
