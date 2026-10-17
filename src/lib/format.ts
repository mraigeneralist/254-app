import { format } from 'date-fns';
import type { DateKey } from '@/domain/dates';

/** Date key → local Date at midnight. */
export function keyToDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Saturday, 17 October 2026" */
export const longDate = (k: DateKey) => format(keyToDate(k), 'EEEE, d MMMM yyyy');
/** "Saturday, 17 October" */
export const longDateNoYear = (k: DateKey) => format(keyToDate(k), 'EEEE, d MMMM');
/** "Sat, 17 October 2026" */
export const mediumDate = (k: DateKey) => format(keyToDate(k), 'EEE, d MMMM yyyy');
/** "Sat, 17 Oct" */
export const shortDate = (k: DateKey) => format(keyToDate(k), 'EEE, d MMM');
/** "28 Jun 2026" */
export const dayMonthYear = (k: DateKey) => format(keyToDate(k), 'd MMM yyyy');
/** "17 Oct" */
export const dayMonth = (k: DateKey) => format(keyToDate(k), 'd MMM');
/** "Sunday" */
export const weekdayName = (k: DateKey) => format(keyToDate(k), 'EEEE');
/** "October 2026" */
export const monthTitle = (year: number, month0: number) => format(new Date(year, month0, 1), 'MMMM yyyy');

/** "06:30" → "6:30 am" */
export function time12(hhmm: string | null | undefined): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${ap}`;
}

/** ISO timestamp → "7:24 am" in local time */
export const clockTime = (iso: string) => format(new Date(iso), 'h:mm a').toLowerCase();

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** 1265 → "1,265" */
export const num = (n: number) => n.toLocaleString('en-US');

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
