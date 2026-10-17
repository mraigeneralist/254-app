/**
 * Local calendar dates as `YYYY-MM-DD` strings ("date keys").
 *
 * All daily logic in 254 works on the device's *local* calendar day. A date key carries no time or
 * timezone, so arithmetic on it is done in UTC purely as a calendar, which makes it immune to DST
 * shifts (a "day" is always exactly one calendar step, never 23 or 25 hours).
 */
export type DateKey = string;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar date of `date` on this device (device timezone). */
export function toDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDateKey(s: string): s is DateKey {
  if (!DATE_KEY.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function toUtcMs(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): DateKey {
  const t = new Date(ms);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromUtcMs(toUtcMs(key) + days * DAY_MS);
}

/** Whole calendar days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

export const maxKey = (a: DateKey, b: DateKey): DateKey => (a > b ? a : b);
export const minKey = (a: DateKey, b: DateKey): DateKey => (a < b ? a : b);

/** Day of week for a date key, 0 = Monday … 6 = Sunday (calendars in the designs start on Monday). */
export function weekdayMon0(key: DateKey): number {
  return (new Date(toUtcMs(key)).getUTCDay() + 6) % 7;
}

/** Sorted, de-duplicated, valid date keys. */
export function normalizeKeys(keys: Iterable<string>): DateKey[] {
  return [...new Set(keys)].filter(isDateKey).sort();
}
