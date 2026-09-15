/**
 * APP-P1-03 — current city: the single source shared by the mall, the trade-in store list
 * and Settings. Resolution order: manual pick > located city > nationwide ("All India").
 * Only the city *name* is persisted; coordinates are never stored.
 */
import { CITY_LIST, NATIONAL_CITY } from '@dobara/utils';

export { NATIONAL_CITY };
export const CITIES: string[] = CITY_LIST.map((c) => c.name);

const CITY_KEY = 'dobara_user_city';
const MANUAL_KEY = 'dobara_user_city_manual';
const LOCATED_KEY = 'dobara_user_city_located';
const ASKED_KEY = 'dobara_user_city_asked';

function read(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch { /* ignore quota / private mode */ }
}

/** Current city — manual pick wins, then the located city, else nationwide. */
export function getUserCity(): string {
  return read(MANUAL_KEY) || read(LOCATED_KEY) || read(CITY_KEY) || NATIONAL_CITY;
}

export function setUserCity(city: string) {
  write(CITY_KEY, city);
  // Any explicit pick by the user outranks later location results
  write(MANUAL_KEY, city);
  window.dispatchEvent(new Event('dobara-user-city'));
}

/** Back to nationwide without picking a city */
export function clearUserCity() {
  write(CITY_KEY, '');
  write(MANUAL_KEY, '');
  write(LOCATED_KEY, '');
  window.dispatchEvent(new Event('dobara-user-city'));
}

/** True once the user has picked a city by hand (location no longer overrides it) */
export function hasManualCity(): boolean {
  return !!read(MANUAL_KEY);
}

/** City resolved from the device location; '' when not located */
export function getLocatedCity(): string {
  return read(LOCATED_KEY);
}

/** Records a located city — only becomes the current city while the user has not picked one */
export function setLocatedCity(city: string) {
  write(LOCATED_KEY, city);
  if (!hasManualCity()) window.dispatchEvent(new Event('dobara-user-city'));
}

/** Whether the one-off permission explainer has already been shown */
export function hasBeenAskedForLocation(): boolean {
  return read(ASKED_KEY) === '1';
}

export function markAskedForLocation() {
  write(ASKED_KEY, '1');
}

/** Browse nationwide — no same-city weighting, no same-city badges */
export function isNational(city: string): boolean {
  return !city || city === NATIONAL_CITY;
}

/** Located city that has no warehouse/service yet — shown but not selectable */
export function isUnserved(city: string): boolean {
  return !!city && !isNational(city) && !CITIES.includes(city);
}

/**
 * Device location → city, at city granularity. Resolves null when unavailable or refused —
 * callers take the "location denied" branch rather than guessing a city.
 */
export function locateCity(timeoutMs = 5000): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve(cityFromCoords(pos.coords.latitude, pos.coords.longitude));
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Pune: { lat: 18.5204, lng: 73.8567 },
};

/**
 * Demo stand-in for reverse geocoding. A device far from every seeded city reports an
 * unserved city, which keeps the "暂未开通" branch reachable in the demo.
 */
function cityFromCoords(lat: number, lng: number): string {
  let best: { name: string; d: number } | null = null;
  for (const [name, c] of Object.entries(CITY_COORDS)) {
    const d = Math.hypot(lat - c.lat, lng - c.lng);
    if (!best || d < best.d) best = { name, d };
  }
  return best && best.d < 3 ? best.name : 'Remote Area';
}

/** Cities sorted by available stock — the order the picker shows them in */
export function citiesByStock() {
  return [...CITY_LIST].sort((a, b) => b.devices - a.devices);
}

/** Nearest served cities — the store page's empty-state fallback */
export function nearestServedCities(count = 3): string[] {
  const current = getUserCity();
  return CITIES.filter((c) => c !== current).slice(0, count);
}
