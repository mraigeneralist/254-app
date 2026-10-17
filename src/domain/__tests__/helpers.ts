import { addDays, type DateKey } from '../dates';

export const D0: DateKey = '2026-01-01';

/** `n` consecutive date keys starting at `from`. */
export const run = (from: DateKey, n: number): DateKey[] => Array.from({ length: n }, (_, i) => addDays(from, i));

/** Day number (1-based) relative to D0 → date key. */
export const day = (n: number): DateKey => addDays(D0, n - 1);
