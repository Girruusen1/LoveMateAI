/**
 * Vedic (sidereal) birth chart engine.
 *
 * Positions come from astronomy-engine (MIT, VSOP87 / NOAA lunar theory, accurate to about an
 * arcminute). We take true (of-date) tropical longitudes, then subtract the true Lahiri
 * (Chitrapaksha) ayanamsa: the Swiss Ephemeris / Indian Ephemeris definition of 23°15'00.658"
 * on 1956-03-21, carried forward with the IAU 2006 general precession, plus nutation.
 * Houses are whole-sign from the Lagna (the usual North Indian rashi chart).
 *
 * Runs in the browser and in Node (see ./__check__.ts).
 */
import { Body, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime, SiderealTime, SunPosition, e_tilt, type AstroTime } from 'astronomy-engine';
import { RASHIS } from '../../shared/jyotish.ts';
import { NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN, PLANET_IDS, type PlanetId } from './constants.ts';

export interface BirthPlace {
  name: string;
  lat: number;
  lon: number;
  /** Hours east of UTC. For Indian cities use indiaOffsetHours(date) (handles the 1940s war time). */
  tzOffset: number;
}

export interface BirthDetails {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (24h). Ignored when timeUnknown. */
  time: string;
  timeUnknown: boolean;
  place: BirthPlace;
}

export interface Position {
  /** Sidereal longitude 0..360 */
  longitude: number;
  /** Rashi index 0..11 */
  sign: number;
  /** Degrees inside the sign 0..30 */
  degree: number;
  /** Nakshatra index 0..26 */
  nakshatra: number;
  /** Pada 1..4 */
  pada: number;
}

export interface PlanetPosition extends Position {
  id: PlanetId;
  /** Tropical longitude of date */
  tropical: number;
  /** Whole-sign house from Lagna, 1..12 */
  house: number;
}

export interface ManglikInfo {
  /** House of Mars counted from the Lagna (whole sign) */
  fromLagnaHouse: number;
  /** House of Mars counted from the Moon */
  fromMoonHouse: number;
  fromLagna: boolean;
  fromMoon: boolean;
  /** True when Mars sits in 1, 2, 4, 7, 8 or 12 from the Lagna or from the Moon */
  isManglik: boolean;
  /** Lagna-based part is not reliable without a birth time */
  lagnaReliable: boolean;
}

export interface Chart {
  input: BirthDetails;
  /** Moment used, ISO in UTC */
  utc: string;
  ayanamsa: number;
  lagna: Position;
  planets: Record<PlanetId, PlanetPosition>;
  /** Moon sign (Rashi) */
  rashi: number;
  nakshatra: number;
  pada: number;
  /** Western tropical Sun sign (for the fun mode) */
  westernSunSign: number;
  /** Sidereal Sun sign */
  vedicSunSign: number;
  timeKnown: boolean;
  /** Lagna, houses and the Lagna part of Manglik need a birth time */
  lagnaReliable: boolean;
  manglik: ManglikInfo;
  /** When the time is unknown: every Moon sign / nakshatra the Moon passes through that day */
  dayRange?: { rashis: number[]; nakshatras: number[] };
  warnings: string[];
}

const norm = (x: number) => ((x % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** India's UTC offset on a given date (tz database Asia/Kolkata): +6:30 war time 1941-45, else +5:30. */
export function indiaOffsetHours(date: string): number {
  if ((date >= '1941-10-01' && date < '1942-05-15') || (date >= '1942-09-01' && date < '1945-10-15')) return 6.5;
  return 5.5;
}

/** Mean Lahiri ayanamsa (degrees) for a TT day number counted from J2000. */
export function lahiriMeanAyanamsa(ttDays: number): number {
  const T0 = (2435553.5 - 2451545.0) / 36525; // 1956-03-21 00:00
  const AYAN_T0 = 23.245524743; // Swiss Ephemeris SE_SIDM_LAHIRI value at T0
  const p = (T: number) => (5028.796195 * T + 1.1054348 * T * T + 0.00007964 * T * T * T) / 3600; // IAU 2006 general precession
  return AYAN_T0 + p(ttDays / 36525) - p(T0);
}

/** True Lahiri ayanamsa (with nutation in longitude), the value used by Indian panchangs. */
export function lahiriAyanamsa(time: AstroTime): number {
  return lahiriMeanAyanamsa(time.tt) + e_tilt(time).dpsi / 3600;
}

export function position(longitude: number): Position {
  const lon = norm(longitude);
  const nak = Math.min(26, Math.floor(lon / NAKSHATRA_SPAN));
  return {
    longitude: lon,
    sign: Math.min(11, Math.floor(lon / 30)),
    degree: lon % 30,
    nakshatra: nak,
    pada: Math.min(4, Math.floor((lon - nak * NAKSHATRA_SPAN) / PADA_SPAN) + 1),
  };
}

/** UTC moment for a local date/time. */
export function toUtc(date: string, time: string, tzOffset: number): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0) - tzOffset * 3_600_000);
}

const BODY: Partial<Record<PlanetId, Body>> = {
  Mars: Body.Mars,
  Mercury: Body.Mercury,
  Jupiter: Body.Jupiter,
  Venus: Body.Venus,
  Saturn: Body.Saturn,
};

/** Tropical (true equinox of date) longitudes of the planets, the mean lunar node and the ascendant. */
export function tropicalPositions(when: Date, lat: number, lon: number) {
  const time = MakeTime(when);
  const tilt = e_tilt(time);
  const out = {} as Record<PlanetId, number>;
  out.Sun = SunPosition(time).elon;
  out.Moon = EclipticGeoMoon(time).lon;
  for (const id of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) out[id] = Ecliptic(GeoVector(BODY[id]!, time, true)).elon;
  // Mean node (Meeus 47.7), referred to the mean equinox: shift by nutation so it is "of date" like the rest.
  const T = time.tt / 36525;
  const meanNode = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000;
  out.Rahu = norm(meanNode + tilt.dpsi / 3600);
  out.Ketu = norm(out.Rahu + 180);
  // Ascendant from local apparent sidereal time and the true obliquity.
  const theta = rad(norm(SiderealTime(time) * 15 + lon));
  const eps = rad(tilt.tobl);
  const asc = norm(deg(Math.atan2(Math.cos(theta), -(Math.sin(theta) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)))));
  for (const k of Object.keys(out) as PlanetId[]) out[k] = norm(out[k]);
  return { time, planets: out, ascendant: asc, ayanamsa: lahiriAyanamsa(time) };
}

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];
const houseFrom = (fromSign: number, sign: number) => ((sign - fromSign + 12) % 12) + 1;

/** Moon's sidereal longitude at a moment (used to scan a whole day when the birth time is unknown). */
function moonSidereal(when: Date): number {
  const time = MakeTime(when);
  return norm(EclipticGeoMoon(time).lon - lahiriAyanamsa(time));
}

export function computeChart(input: BirthDetails): Chart {
  const timeKnown = !input.timeUnknown && /^\d{1,2}:\d{2}$/.test(input.time);
  const when = toUtc(input.date, timeKnown ? input.time : '12:00', input.place.tzOffset);
  if (Number.isNaN(when.getTime())) throw new Error('Please enter a valid birth date.');
  const trop = tropicalPositions(when, input.place.lat, input.place.lon);
  const ayan = trop.ayanamsa;
  const lagna = position(trop.ascendant - ayan);

  const planets = {} as Record<PlanetId, PlanetPosition>;
  for (const id of PLANET_IDS) {
    const p = position(trop.planets[id] - ayan);
    planets[id] = { ...p, id, tropical: trop.planets[id], house: houseFrom(lagna.sign, p.sign) };
  }
  const moon = planets.Moon;
  const mars = planets.Mars;
  const fromLagnaHouse = houseFrom(lagna.sign, mars.sign);
  const fromMoonHouse = houseFrom(moon.sign, mars.sign);
  const fromLagna = timeKnown && MANGLIK_HOUSES.includes(fromLagnaHouse);
  const fromMoon = MANGLIK_HOUSES.includes(fromMoonHouse);

  const warnings: string[] = [];
  let dayRange: Chart['dayRange'];
  if (!timeKnown) {
    warnings.push('Birth time not given: the chart uses 12:00 noon. Lagna, houses and the Lagna-based Manglik check are not reliable.');
    // Scan the local day every hour (the Moon moves about 0.5° an hour, so nothing is skipped).
    const rashis = new Set<number>();
    const naks = new Set<number>();
    const start = toUtc(input.date, '00:00', input.place.tzOffset).getTime();
    for (let h = 0; h <= 24; h++) {
      const lon = moonSidereal(new Date(start + Math.min(h, 23.99) * 3_600_000));
      rashis.add(Math.floor(lon / 30));
      naks.add(Math.floor(lon / NAKSHATRA_SPAN));
    }
    dayRange = { rashis: [...rashis], nakshatras: [...naks] };
    if (rashis.size > 1) {
      warnings.push(`The Moon changed sign that day (${[...rashis].map((r) => RASHIS[r].sanskrit).join(' → ')}). Your Rashi depends on the birth time.`);
    }
    if (naks.size > 1) {
      warnings.push(`The Moon moved from ${[...naks].map((n) => NAKSHATRAS[n].name).join(' to ')} that day. Your nakshatra depends on the birth time, so Guna Milan may change.`);
    }
  }

  return {
    input,
    utc: when.toISOString(),
    ayanamsa: ayan,
    lagna,
    planets,
    rashi: moon.sign,
    nakshatra: moon.nakshatra,
    pada: moon.pada,
    westernSunSign: Math.floor(trop.planets.Sun / 30),
    vedicSunSign: planets.Sun.sign,
    timeKnown,
    lagnaReliable: timeKnown,
    manglik: { fromLagnaHouse, fromMoonHouse, fromLagna, fromMoon, isManglik: fromLagna || fromMoon, lagnaReliable: timeKnown },
    dayRange,
    warnings,
  };
}

/** Western (tropical) sun sign from a birthday alone, using the usual calendar boundaries. */
export function westernSignFromDate(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const md = Number(m[2]) * 100 + Number(m[3]);
  // Start dates (MMDD) of Aries..Pisces
  const starts = [321, 420, 521, 621, 723, 823, 923, 1023, 1122, 1222, 120, 219];
  for (let i = 0; i < 12; i++) {
    const s = starts[i];
    const e = starts[(i + 1) % 12];
    if (s < e ? md >= s && md < e : md >= s || md < e) return i;
  }
  return null;
}

/** 23.4567 -> 23°27' */
export function formatDegree(d: number): string {
  let whole = Math.floor(d);
  let min = Math.round((d - whole) * 60);
  if (min === 60) {
    whole += 1;
    min = 0;
  }
  return `${whole}°${String(min).padStart(2, '0')}'`;
}
