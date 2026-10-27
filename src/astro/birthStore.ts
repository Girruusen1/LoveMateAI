/**
 * "My birth details", kept in localStorage. Every `lovemate_*` key is copied to the signed-in
 * account by services/cloud.ts, so this follows the user to other devices.
 */
import type { BirthDetails } from './engine.ts';

export const BIRTH_DETAILS_KEY = 'lovemate_birth_details_v1';

const valid = (d: unknown): d is BirthDetails => {
  const x = d as BirthDetails;
  return Boolean(
    x && typeof x.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.place && Number.isFinite(x.place.lat) && Number.isFinite(x.place.lon) && Number.isFinite(x.place.tzOffset)
  );
};

export function loadBirthDetails(): BirthDetails | null {
  try {
    const raw = localStorage.getItem(BIRTH_DETAILS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return valid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBirthDetails(details: BirthDetails): void {
  try {
    localStorage.setItem(BIRTH_DETAILS_KEY, JSON.stringify(details));
  } catch {
    /* storage full or blocked: the page still works for this visit */
  }
}

export function clearBirthDetails(): void {
  try {
    localStorage.removeItem(BIRTH_DETAILS_KEY);
  } catch {
    /* ignore */
  }
}
