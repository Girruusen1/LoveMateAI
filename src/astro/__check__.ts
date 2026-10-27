/**
 * Reference checks for the Jyotish engine. Run:
 *   node --experimental-strip-types src/astro/__check__.ts
 * Throws (non-zero exit) when any check fails.
 *
 * References (looked up 2026-10-27):
 *  [1] Jagannatha Hora, "Historical Lahiri ayanamsa values" (true Lahiri, 00:00 UT 1 Jan):
 *      https://jagannathhora.com/historical-lahiri-ayanamsa-values-tables/
 *  [2] Drik Panchang, sidereal planetary positions, New Delhi, 27 Oct 2026 12:16:50 IST:
 *      https://www.drikpanchang.com/planet/position/planetary-positions-sidereal.html
 *  [3] Drik Panchang, Udaya Lagna table, New Delhi, 27 Oct 2026:
 *      https://www.drikpanchang.com/muhurat/lagna.html
 *  [4] Drik Panchang, Narendra Modi kundali (17 Sep 1950, 09:35, Vadnagar 23°47'04"N 72°38'21"E):
 *      https://www.drikpanchang.com/astrology/horoscope/politician/narendra-modi/2019/narendra-modi-kundali-analysis.html
 *  [5] CalcaTools worked Guna Milan example (Rohini girl, Mrigashira boy, both Taurus = 35/36):
 *      https://calcatools.com/how-guna-milan-score-is-calculated-worked-example/
 *  [6] Dekho Panchang matching guide (Ashwini groom + Bharani bride: Varna 1, Gana 5, Nadi 8;
 *      Aries + Virgo Bhakoot 0 with no cancellation): https://dekhopanchang.com/learn/matching
 *  [7] OnlineJyotish Gana / Vashya tables (rows = bride):
 *      https://www.onlinejyotish.com/articles/marriage-matching/english/gana-kootam.php
 */
import { HorizonFromVector, MakeTime, Observer, RotateVector, Rotation_ECT_EQD, Rotation_EQD_HOR, Vector } from 'astronomy-engine';
import { RASHIS } from '../../shared/jyotish.ts';
import { CITIES, searchCities } from './cities.ts';
import { NAKSHATRAS } from './constants.ts';
import { computeChart, lahiriAyanamsa, position, tropicalPositions } from './engine.ts';
import { compareManglik, gunaMilan, type MoonPlacement } from './gunaMilan.ts';

let failures = 0;
const rows: string[] = [];
function check(name: string, expected: string, got: string, ok: boolean) {
  if (!ok) failures++;
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      expected: ${expected}\n      got:      ${got}`);
}
const dms = (x: number) => {
  const d = Math.floor(x);
  const m = Math.floor((x - d) * 60);
  const s = ((x - d) * 60 - m) * 60;
  return `${d}°${String(m).padStart(2, '0')}'${s.toFixed(1).padStart(4, '0')}"`;
};
const toDeg = (d: number, m: number, s: number) => d + m / 60 + s / 3600;
const arcsec = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180) * 3600;

/* ---------- 1. Lahiri ayanamsa [1] ---------- */
const AYAN: [number, [number, number, number]][] = [
  [1950, [23, 9, 28]],
  [1970, [23, 26, 22]],
  [1990, [23, 43, 15]],
  [2000, [23, 51, 12]],
  [2010, [24, 0, 5]],
  [2020, [24, 7, 55]],
  [2026, [24, 13, 19]],
];
for (const [year, [d, m, s]] of AYAN) {
  const got = lahiriAyanamsa(MakeTime(new Date(Date.UTC(year, 0, 1))));
  const want = toDeg(d, m, s);
  check(`Lahiri ayanamsa 1 Jan ${year}`, `${dms(want)} (±3")`, `${dms(got)} (diff ${arcsec(got, want).toFixed(1)}")`, arcsec(got, want) <= 3);
}

/* ---------- 2. Sidereal positions vs Drik Panchang [2] ---------- */
const DELHI = { lat: toDeg(28, 38, 8), lon: toDeg(77, 13, 28) };
const drikMoment = new Date(Date.UTC(2026, 9, 27, 6, 46, 50)); // 12:16:50 IST
const drik = tropicalPositions(drikMoment, DELHI.lat, DELHI.lon);
const sid = (x: number) => (((x - drik.ayanamsa) % 360) + 360) % 360;
const DRIK: [string, number, [number, number, number], string, number, number][] = [
  // body, sign, d m s, nakshatra, pada, tolerance arcsec
  ['Sun', 6, [9, 37, 42.21], 'Swati', 1, 120],
  ['Moon', 0, [24, 36, 52.8], 'Bharani', 4, 120],
  ['Mars', 3, [21, 58, 22.34], 'Ashlesha', 2, 120],
  ['Venus', 6, [4, 36, 48], 'Chitra', 4, 120],
];
for (const [body, sign, [d, m, s], nak, pada, tol] of DRIK) {
  const want = sign * 30 + toDeg(d, m, s);
  const got = sid(drik.planets[body as 'Sun']);
  const p = position(got);
  check(
    `${body} sidereal, Delhi 27 Oct 2026 12:16:50`,
    `${RASHIS[sign].sanskrit} ${dms(want - sign * 30)}, ${nak} pada ${pada} (±${tol / 60}')`,
    `${RASHIS[p.sign].sanskrit} ${dms(p.degree)}, ${NAKSHATRAS[p.nakshatra].name} pada ${p.pada} (diff ${arcsec(got, want).toFixed(0)}")`,
    arcsec(got, want) <= tol && NAKSHATRAS[p.nakshatra].name === nak && p.pada === pada
  );
}
{
  const want = 8 * 30 + toDeg(26, 13, 11.18);
  const got = sid(drik.ascendant);
  const p = position(got);
  check(
    'Lagna, Delhi 27 Oct 2026 12:16:50',
    `Dhanu ${dms(want - 240)}, Purva Ashadha pada 4 (±20', about 1 minute of clock time)`,
    `${RASHIS[p.sign].sanskrit} ${dms(p.degree)}, ${NAKSHATRAS[p.nakshatra].name} pada ${p.pada} (diff ${(arcsec(got, want) / 60).toFixed(1)}')`,
    arcsec(got, want) <= 1200 && p.sign === 8 && p.nakshatra === 19 && p.pada === 4
  );
}

/* ---------- 3. Lagna change times vs Drik Panchang [3] ---------- */
{
  const table: [number, string][] = [
    [6, '05:49'], [7, '08:09'], [8, '10:27'], [9, '12:31'], [10, '14:14'], [11, '15:41'],
    [0, '17:06'], [1, '18:41'], [2, '20:37'], [3, '22:51'], [4, '01:12'], [5, '03:29'],
  ];
  const lagnaSign = (t: number) => {
    const p = tropicalPositions(new Date(t), DELHI.lat, DELHI.lon);
    return Math.floor(((((p.ascendant - p.ayanamsa) % 360) + 360) % 360) / 30);
  };
  const start = Date.UTC(2026, 9, 26, 23, 0); // 04:30 IST on the 27th
  const changes = new Map<number, number>();
  let prev = lagnaSign(start);
  for (let t = start + 15_000; t < start + 25 * 3_600_000; t += 15_000) {
    const s = lagnaSign(t);
    if (s !== prev && !changes.has(s)) changes.set(s, t);
    prev = s;
  }
  let worst = 0;
  const got: string[] = [];
  for (const [sign, hhmm] of table) {
    const t = changes.get(sign);
    if (t == null) {
      worst = Infinity;
      continue;
    }
    const ist = new Date(t + 5.5 * 3_600_000);
    const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes() + ist.getUTCSeconds() / 60;
    const [h, m] = hhmm.split(':').map(Number);
    let diff = mins - (h * 60 + m);
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    worst = Math.max(worst, Math.abs(diff));
    got.push(`${RASHIS[sign].sanskrit} ${ist.toISOString().slice(11, 16)}`);
  }
  check('Udaya Lagna start times, Delhi 27 Oct 2026 (12 signs)', `${table.map(([s, t]) => `${RASHIS[s].sanskrit} ${t}`).join(', ')} (±2 min)`, `${got.join(', ')} (worst ${worst.toFixed(1)} min)`, worst <= 2);
}

/* ---------- 4. Ascendant formula vs horizon geometry ---------- */
{
  const time = MakeTime(drikMoment);
  const r1 = Rotation_ECT_EQD(time);
  const r2 = Rotation_EQD_HOR(time, new Observer(DELHI.lat, DELHI.lon, 0));
  let best = { lam: 0, alt: 99 };
  for (let l = 0; l < 360; l += 0.002) {
    const r = (l * Math.PI) / 180;
    const h = HorizonFromVector(RotateVector(r2, RotateVector(r1, new Vector(Math.cos(r), Math.sin(r), 0, time))), '' as never);
    if (h.lon > 0 && h.lon < 180 && Math.abs(h.lat) < Math.abs(best.alt)) best = { lam: l, alt: h.lat };
  }
  check('Ascendant formula = ecliptic point on the eastern horizon', `${best.lam.toFixed(3)}° (±0.01°)`, `${drik.ascendant.toFixed(3)}°`, arcsec(best.lam, drik.ascendant) < 36);
}

/* ---------- 5. Published kundli [4] ---------- */
{
  const c = computeChart({ name: 'Ref', date: '1950-09-17', time: '09:35', timeUnknown: false, place: { name: 'Vadnagar', lat: toDeg(23, 47, 4), lon: toDeg(72, 38, 21), tzOffset: 5.5 } });
  const got = `Lagna ${RASHIS[c.lagna.sign].sanskrit}, Moon ${RASHIS[c.rashi].sanskrit} ${NAKSHATRAS[c.nakshatra].name} pada ${c.pada}, Sun house ${c.planets.Sun.house}, Mars ${RASHIS[c.planets.Mars.sign].sanskrit} house ${c.planets.Mars.house}, Venus house ${c.planets.Venus.house}`;
  check(
    'Kundli 17 Sep 1950 09:35 Vadnagar (Drik Panchang)',
    'Lagna Tula, Moon Vrishchika Anuradha pada 2, Sun house 12, Mars Vrishchika house 2, Venus house 11',
    got,
    got === 'Lagna Tula, Moon Vrishchika Anuradha pada 2, Sun house 12, Mars Vrishchika house 2, Venus house 11'
  );
  check('Manglik for that chart (Mars in 2nd from Lagna, 1st from Moon)', 'Manglik from Lagna and Moon', `fromLagna=${c.manglik.fromLagna}, fromMoon=${c.manglik.fromMoon}`, c.manglik.fromLagna && c.manglik.fromMoon);
}

/* ---------- 6. Guna Milan [5][6][7] ---------- */
const pts = (r: ReturnType<typeof gunaMilan>) => r.kootas.map((k) => `${k.name} ${k.points}`).join(', ');
{
  const girl: MoonPlacement = { nakshatra: 3, rashi: 1, degree: 15 }; // Rohini, Vrishabha
  const boy: MoonPlacement = { nakshatra: 4, rashi: 1, degree: 25 }; // Mrigashira 1-2, Vrishabha
  const r = gunaMilan(boy, girl);
  check('Guna Milan: Rohini girl + Mrigashira boy, both Vrishabha [5]', 'Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 5, Bhakoot 7, Nadi 8 = 35', `${pts(r)} = ${r.total}`, r.total === 35 && pts(r) === 'Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 5, Bhakoot 7, Nadi 8');
}
{
  const r = gunaMilan({ nakshatra: 0, rashi: 0, degree: 5 }, { nakshatra: 1, rashi: 0, degree: 20 }); // Ashwini groom, Bharani bride
  const k = Object.fromEntries(r.kootas.map((x) => [x.key, x.points]));
  check('Ashwini groom + Bharani bride [6]', 'Varna 1, Gana 5, Nadi 8', `Varna ${k.varna}, Gana ${k.gana}, Nadi ${k.nadi}`, k.varna === 1 && k.gana === 5 && k.nadi === 8);
}
{
  const r = gunaMilan({ nakshatra: 0, rashi: 0, degree: 5 }, { nakshatra: 12, rashi: 5, degree: 15 }); // Mesha + Kanya
  const b = r.kootas.find((x) => x.key === 'bhakoot')!;
  check('Mesha + Kanya Bhakoot (6/8, Mars-Mercury) [6]', 'Bhakoot 0, not cancelled', `Bhakoot ${b.points}, cancellation: ${b.cancellation ?? 'none'}`, b.points === 0 && !b.cancellation);
}
{
  const r = gunaMilan({ nakshatra: 7, rashi: 3, degree: 10 }, { nakshatra: 7, rashi: 3, degree: 10 }); // same Pushya
  check('Same nakshatra, same sign (rule: everything but Nadi)', '28 (Nadi 0)', `${r.total} (Nadi ${r.kootas[7].points})`, r.total === 28 && r.kootas[7].points === 0);
}
{
  // Gana grid direction [7]: Deva girl + Manushya boy = 6, Manushya girl + Deva boy = 5, Rakshasa girl + Deva boy = 1, Deva girl + Rakshasa boy = 0
  const g = (boyNak: number, girlNak: number) => gunaMilan({ nakshatra: boyNak, rashi: 0, degree: 0 }, { nakshatra: girlNak, rashi: 0, degree: 0 }).kootas[5].points;
  const got = [g(1, 0), g(0, 1), g(0, 2), g(2, 0)];
  check('Gana grid direction [7]', '6, 5, 1, 0', got.join(', '), got.join(',') === '6,5,1,0');
}
check('Manglik cancellation when both are Manglik', 'both -> neutralised', compareManglik({ isManglik: true } as never, { isManglik: true } as never).status, compareManglik({ isManglik: true } as never, { isManglik: true } as never).status === 'both');

/* ---------- 7. Unknown birth time ---------- */
{
  const c = computeChart({ name: 'x', date: '2026-10-27', time: '', timeUnknown: true, place: { name: 'Delhi', lat: DELHI.lat, lon: DELHI.lon, tzOffset: 5.5 } });
  check('Unknown time: uses noon, flags Lagna, scans the day', 'lagnaReliable=false, Moon range listed', `lagnaReliable=${c.lagnaReliable}, nakshatras that day: ${c.dayRange?.nakshatras.map((n) => NAKSHATRAS[n].name).join(' -> ')}`, !c.lagnaReliable && (c.dayRange?.nakshatras.length ?? 0) >= 1 && c.utc === '2026-10-27T06:30:00.000Z');
}

/* ---------- 8. Cities ---------- */
check('Offline city list', 'at least 150 cities, search works', `${CITIES.length} cities; "luck" -> ${searchCities('luck')[0]?.name}`, CITIES.length >= 150 && searchCities('luck')[0]?.name === 'Lucknow');

console.log(rows.join('\n'));
console.log(`\n${rows.length - failures}/${rows.length} checks passed`);
if (failures) throw new Error(`${failures} Jyotish reference check(s) failed`);
