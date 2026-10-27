/**
 * Jyotish reference data: the 27 nakshatras and the planets we draw.
 * Gana, yoni and nadi follow the standard Ashtakoota assignments.
 */

export type Gana = 'Deva' | 'Manushya' | 'Rakshasa';
export type Nadi = 'Adi' | 'Madhya' | 'Antya';

export const YONIS = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'] as const;
export type Yoni = (typeof YONIS)[number];

export interface NakshatraInfo {
  name: string;
  hindi: string;
  /** Vimshottari lord */
  lord: string;
  gana: Gana;
  yoni: Yoni;
  nadi: Nadi;
}

const N = (name: string, hindi: string, lord: string, gana: Gana, yoni: Yoni, nadi: Nadi): NakshatraInfo => ({ name, hindi, lord, gana, yoni, nadi });

/** Index 0 = Ashwini (0°–13°20' Mesha). Each nakshatra spans 13°20', each pada 3°20'. */
export const NAKSHATRAS: NakshatraInfo[] = [
  N('Ashwini', 'अश्विनी', 'Ketu', 'Deva', 'Horse', 'Adi'),
  N('Bharani', 'भरणी', 'Venus', 'Manushya', 'Elephant', 'Madhya'),
  N('Krittika', 'कृत्तिका', 'Sun', 'Rakshasa', 'Sheep', 'Antya'),
  N('Rohini', 'रोहिणी', 'Moon', 'Manushya', 'Serpent', 'Antya'),
  N('Mrigashira', 'मृगशिरा', 'Mars', 'Deva', 'Serpent', 'Madhya'),
  N('Ardra', 'आर्द्रा', 'Rahu', 'Manushya', 'Dog', 'Adi'),
  N('Punarvasu', 'पुनर्वसु', 'Jupiter', 'Deva', 'Cat', 'Adi'),
  N('Pushya', 'पुष्य', 'Saturn', 'Deva', 'Sheep', 'Madhya'),
  N('Ashlesha', 'आश्लेषा', 'Mercury', 'Rakshasa', 'Cat', 'Antya'),
  N('Magha', 'मघा', 'Ketu', 'Rakshasa', 'Rat', 'Antya'),
  N('Purva Phalguni', 'पूर्व फाल्गुनी', 'Venus', 'Manushya', 'Rat', 'Madhya'),
  N('Uttara Phalguni', 'उत्तर फाल्गुनी', 'Sun', 'Manushya', 'Cow', 'Adi'),
  N('Hasta', 'हस्त', 'Moon', 'Deva', 'Buffalo', 'Adi'),
  N('Chitra', 'चित्रा', 'Mars', 'Rakshasa', 'Tiger', 'Madhya'),
  N('Swati', 'स्वाती', 'Rahu', 'Deva', 'Buffalo', 'Antya'),
  N('Vishakha', 'विशाखा', 'Jupiter', 'Rakshasa', 'Tiger', 'Antya'),
  N('Anuradha', 'अनुराधा', 'Saturn', 'Deva', 'Deer', 'Madhya'),
  N('Jyeshtha', 'ज्येष्ठा', 'Mercury', 'Rakshasa', 'Deer', 'Adi'),
  N('Mula', 'मूल', 'Ketu', 'Rakshasa', 'Dog', 'Adi'),
  N('Purva Ashadha', 'पूर्वाषाढ़ा', 'Venus', 'Manushya', 'Monkey', 'Madhya'),
  N('Uttara Ashadha', 'उत्तराषाढ़ा', 'Sun', 'Manushya', 'Mongoose', 'Antya'),
  N('Shravana', 'श्रवण', 'Moon', 'Deva', 'Monkey', 'Antya'),
  N('Dhanishta', 'धनिष्ठा', 'Mars', 'Rakshasa', 'Lion', 'Madhya'),
  N('Shatabhisha', 'शतभिषा', 'Rahu', 'Rakshasa', 'Horse', 'Adi'),
  N('Purva Bhadrapada', 'पूर्व भाद्रपद', 'Jupiter', 'Manushya', 'Lion', 'Adi'),
  N('Uttara Bhadrapada', 'उत्तर भाद्रपद', 'Saturn', 'Manushya', 'Cow', 'Madhya'),
  N('Revati', 'रेवती', 'Mercury', 'Deva', 'Elephant', 'Antya'),
];

export const NAKSHATRA_SPAN = 360 / 27;
export const PADA_SPAN = NAKSHATRA_SPAN / 4;

export type PlanetId = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';
export const PLANET_IDS: PlanetId[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export const PLANET_INFO: Record<PlanetId, { abbr: string; hindi: string; sanskrit: string }> = {
  Sun: { abbr: 'Su', hindi: 'सूर्य', sanskrit: 'Surya' },
  Moon: { abbr: 'Mo', hindi: 'चंद्र', sanskrit: 'Chandra' },
  Mars: { abbr: 'Ma', hindi: 'मंगल', sanskrit: 'Mangal' },
  Mercury: { abbr: 'Me', hindi: 'बुध', sanskrit: 'Budh' },
  Jupiter: { abbr: 'Ju', hindi: 'गुरु', sanskrit: 'Guru' },
  Venus: { abbr: 'Ve', hindi: 'शुक्र', sanskrit: 'Shukra' },
  Saturn: { abbr: 'Sa', hindi: 'शनि', sanskrit: 'Shani' },
  Rahu: { abbr: 'Ra', hindi: 'राहु', sanskrit: 'Rahu' },
  Ketu: { abbr: 'Ke', hindi: 'केतु', sanskrit: 'Ketu' },
};
