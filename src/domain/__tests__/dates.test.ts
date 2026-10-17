import { addDays, daysBetween, isDateKey, normalizeKeys, toDateKey, weekdayMon0 } from '../dates';

describe('dates', () => {
  it('formats the local calendar date, not UTC', () => {
    expect(toDateKey(new Date(2026, 9, 17, 0, 0, 0))).toBe('2026-10-17');
    expect(toDateKey(new Date(2026, 9, 17, 23, 59, 59, 999))).toBe('2026-10-17');
    expect(toDateKey(new Date(2026, 9, 18, 0, 0, 0, 0))).toBe('2026-10-18');
  });

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not affected by daylight-saving transitions', () => {
    // EU (29 Mar / 25 Oct 2026) and US (8 Mar / 1 Nov 2026) DST changes
    for (const [a, b] of [['2026-03-28', '2026-03-29'], ['2026-10-24', '2026-10-25'], ['2026-03-07', '2026-03-08'], ['2026-10-31', '2026-11-01']]) {
      expect(addDays(a, 1)).toBe(b);
      expect(addDays(b, 1)).toBe(addDays(a, 2));
      expect(daysBetween(a, b)).toBe(1);
    }
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('validates date keys', () => {
    expect(isDateKey('2026-10-17')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026-10-17T00:00:00Z')).toBe(false);
    expect(normalizeKeys(['2026-10-02', 'bad', '2026-10-01', '2026-10-02'])).toEqual(['2026-10-01', '2026-10-02']);
  });

  it('computes Monday-first weekdays', () => {
    expect(weekdayMon0('2026-10-12')).toBe(0); // Monday
    expect(weekdayMon0('2026-10-17')).toBe(5); // Saturday
    expect(weekdayMon0('2026-10-18')).toBe(6); // Sunday
  });
});
