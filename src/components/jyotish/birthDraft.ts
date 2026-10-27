import { CITIES, cityLabel } from '../../astro/cities';
import { indiaOffsetHours, type BirthDetails } from '../../astro/engine';

/** What the birth details form edits (strings, so half-typed values are allowed). */
export interface BirthDraft {
  name: string;
  date: string;
  time: string;
  timeUnknown: boolean;
  /** Selected city label, or the manual place name */
  placeName: string;
  manual: boolean;
  lat: string;
  lon: string;
  /** UTC offset in hours (manual places only) */
  tz: string;
  /** True once a city was picked from the list */
  cityPicked: boolean;
}

export const emptyDraft = (name = ''): BirthDraft => ({ name, date: '', time: '', timeUnknown: false, placeName: '', manual: false, lat: '', lon: '', tz: '5.5', cityPicked: false });

export function draftFromDetails(d: BirthDetails): BirthDraft {
  const manual = !CITIES.some((c) => cityLabel(c) === d.place.name);
  return {
    name: d.name,
    date: d.date,
    time: d.timeUnknown ? '' : d.time,
    timeUnknown: d.timeUnknown,
    placeName: d.place.name,
    manual,
    lat: String(d.place.lat),
    lon: String(d.place.lon),
    tz: String(d.place.tzOffset),
    cityPicked: !manual,
  };
}

const numberOrNaN = (s: string) => (s.trim() === '' ? NaN : Number(s));

/** Validates a draft. Returns the birth details or a friendly error. */
export function detailsFromDraft(d: BirthDraft, who = 'Birth details'): { details?: BirthDetails; error?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return { error: `${who}: please enter the date of birth.` };
  const year = Number(d.date.slice(0, 4));
  if (year < 1900 || year > 2100) return { error: `${who}: please use a year between 1900 and 2100.` };
  if (!d.timeUnknown && !/^\d{1,2}:\d{2}$/.test(d.time)) return { error: `${who}: enter the birth time, or tick "I don't know the time".` };
  if (!d.manual && !d.cityPicked) return { error: `${who}: pick the birth city from the list (or enter latitude and longitude).` };
  const lat = numberOrNaN(d.lat);
  const lon = numberOrNaN(d.lon);
  if (!Number.isFinite(lat) || lat < -66 || lat > 66) return { error: `${who}: latitude should be a number between -66 and 66.` };
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { error: `${who}: longitude should be a number between -180 and 180.` };
  const tz = d.manual ? numberOrNaN(d.tz) : indiaOffsetHours(d.date);
  if (!Number.isFinite(tz) || tz < -12 || tz > 14) return { error: `${who}: the UTC offset should be between -12 and +14 hours.` };
  return {
    details: {
      name: d.name.trim(),
      date: d.date,
      time: d.timeUnknown ? '' : d.time,
      timeUnknown: d.timeUnknown,
      place: { name: d.manual ? d.placeName.trim() || `Custom (${lat.toFixed(2)}, ${lon.toFixed(2)})` : d.placeName, lat, lon, tzOffset: tz },
    },
  };
}
