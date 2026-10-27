/**
 * Offline daily love rashifal: gentle, deterministic text per India date + sign + language.
 * Used by the server when AI is unavailable, and by the website when the server cannot be reached.
 * No runtime imports: this file runs in the browser and in Node.
 */
import type { AstroLanguage } from './jyotish.ts';

export interface Rashifal {
  headline: string;
  overview: string;
  forSingles: string;
  forCouples: string;
  tip: string;
  luckyColor: string;
  luckyNumber: number;
}

const BANK: Record<AstroLanguage, { headline: string[]; overview: string[]; singles: string[]; couples: string[]; tip: string[]; colors: string[] }> = {
  english: {
    headline: ['A soft, open-hearted day', 'Small gestures speak loudest', 'Honest words bring you closer', 'Let curiosity lead today', 'A calm day for real talk'],
    overview: [
      'The mood today favours gentle honesty. Saying what you feel, simply and kindly, lands better than waiting for the perfect moment.',
      'Today is good for noticing the little things: a reply, a shared joke, a kind check-in. Warmth grows from attention.',
      'Emotions may feel a little stronger than usual. Take a breath before reacting, and give the other person the benefit of the doubt.',
      'There is a light, playful energy around connection today. A fun plan or a silly message can open a sweet conversation.',
    ],
    singles: [
      'Be yourself in conversations; the right person will enjoy the real you.',
      'A friendly message to someone you like could start something nice. No pressure, just curiosity.',
      'Focus on what makes you happy today; confidence is attractive.',
    ],
    couples: [
      'Ask your partner one question you have never asked before, and really listen.',
      'Share one thing you appreciate about them today, out loud.',
      'If something has been on your mind, bring it up calmly with an "I feel" sentence.',
    ],
    tip: ['Send a voice note instead of a text today.', 'Plan a 15-minute no-phone chat.', 'Write down three things you like about yourself.', 'Say thank you for something small.'],
    colors: ['Rose pink', 'Sky blue', 'Saffron', 'Mint green', 'Lavender', 'Cream white', 'Coral'],
  },
  hinglish: {
    headline: ['Aaj dil ki baat bolne ka din', 'Chhote gestures, bada asar', 'Sachchi baatein paas laayengi', 'Thoda curious raho aaj', 'Calm vibes, real baatein'],
    overview: [
      'Aaj ka mood honest aur soft rehne ka hai. Jo feel kar rahe ho, simple aur pyaar se bolo, perfect moment ka wait mat karo.',
      'Aaj chhoti cheezein notice karo: ek reply, ek shared joke, ek "kaise ho". Attention se hi warmth badhti hai.',
      'Emotions thode strong feel ho sakte hain. React karne se pehle ek saans lo aur saamne wale ko benefit of doubt do.',
      'Aaj connection mein ek light, playful energy hai. Ek fun plan ya silly message se pyaari baat shuru ho sakti hai.',
    ],
    singles: [
      'Conversations mein bas khud jaise raho; sahi insaan ko asli tum hi pasand aaoge.',
      'Jise pasand karte ho unhe ek friendly message bhejo. No pressure, bas curiosity.',
      'Aaj apni khushi par focus karo; confidence sabse attractive hai.',
    ],
    couples: [
      'Partner se aaj ek naya sawaal poocho jo pehle kabhi nahi poocha, aur dhyaan se suno.',
      'Aaj unki ek cheez jo tumhe pasand hai, bol ke batao.',
      'Agar kuch mann mein hai, to "mujhe aisa feel hota hai" se shuru karke calmly baat karo.',
    ],
    tip: ['Aaj text ki jagah voice note bhejo.', '15 minute bina phone ke baat karo.', 'Apne baare mein teen achhi baatein likho.', 'Kisi chhoti cheez ke liye thank you bolo.'],
    colors: ['Rose pink', 'Sky blue', 'Kesariya', 'Mint green', 'Lavender', 'Cream white', 'Coral'],
  },
  hindi: {
    headline: ['आज दिल की बात कहने का दिन', 'छोटे इशारे, बड़ा असर', 'सच्ची बातें करीब लाएँगी', 'आज थोड़ी जिज्ञासा रखें', 'शांत मन, सच्ची बातचीत'],
    overview: [
      'आज का माहौल नरमी और ईमानदारी का है। जो महसूस करते हैं, सरल और प्यार भरे शब्दों में कहें।',
      'आज छोटी बातों पर ध्यान दें: एक जवाब, एक साझा हँसी, एक हालचाल। ध्यान से ही अपनापन बढ़ता है।',
      'भावनाएँ आज थोड़ी तेज़ महसूस हो सकती हैं। प्रतिक्रिया देने से पहले एक गहरी साँस लें।',
      'आज रिश्तों में हल्की, खुशनुमा ऊर्जा है। एक मज़ेदार योजना या प्यारा संदेश अच्छी बातचीत शुरू कर सकता है।',
    ],
    singles: ['बातचीत में खुद जैसे रहें; सही व्यक्ति को असली आप ही पसंद आएँगे।', 'जिन्हें आप पसंद करते हैं, उन्हें एक दोस्ताना संदेश भेजें, बिना किसी दबाव के।', 'आज अपनी खुशी पर ध्यान दें; आत्मविश्वास सबसे आकर्षक है।'],
    couples: ['आज अपने साथी से एक नया सवाल पूछें और ध्यान से सुनें।', 'आज उनकी एक अच्छी बात उन्हें ज़रूर बताएँ।', 'अगर मन में कुछ है, तो "मुझे ऐसा लगता है" से शुरू करके शांति से बात करें।'],
    tip: ['आज मैसेज की जगह वॉइस नोट भेजें।', '15 मिनट बिना फ़ोन के बातचीत करें।', 'अपने बारे में तीन अच्छी बातें लिखें।', 'किसी छोटी बात के लिए धन्यवाद कहें।'],
    colors: ['गुलाबी', 'आसमानी नीला', 'केसरिया', 'हल्का हरा', 'लैवेंडर', 'क्रीम', 'मूँगा'],
  },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

export function offlineRashifal(sign: number, language: AstroLanguage, date: string): Rashifal {
  const b = BANK[language];
  const h = hash(`${date}:${sign}`);
  const pick = <T,>(xs: T[], salt: number) => xs[(h >>> salt) % xs.length];
  return {
    headline: pick(b.headline, 0),
    overview: pick(b.overview, 3),
    forSingles: pick(b.singles, 6),
    forCouples: pick(b.couples, 9),
    tip: pick(b.tip, 12),
    luckyColor: pick(b.colors, 15),
    luckyNumber: (h % 9) + 1,
  };
}
