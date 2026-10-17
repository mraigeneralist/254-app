import { canCheckInChallenge, challengeEndDate, computeChallenge, isValidDuration } from '../challenges';
import { day, run } from './helpers';

const ch = (checkins: string[], today: string, durationDays = 30) => computeChallenge({ startDate: day(1), durationDays, checkins, today });

describe('computeChallenge', () => {
  it('starts active on Day 0 of Y', () => {
    expect(ch([], day(1))).toMatchObject({ status: 'active', day: 0, daysLeft: 30, endDate: day(30), checkedInToday: false });
  });

  it('counts "Day X of Y" while every day is done', () => {
    expect(ch(run(day(1), 19), day(19))).toMatchObject({ status: 'active', day: 19, daysLeft: 11, checkedInToday: true });
  });

  it('today not done yet is still active (until midnight)', () => {
    expect(ch(run(day(1), 19), day(20))).toMatchObject({ status: 'active', day: 19, checkedInToday: false });
  });

  it('missing a day marks it failed on that day — no checkpoints', () => {
    const s = ch([...run(day(1), 25), ...run(day(27), 3)], day(30));
    expect(s).toMatchObject({ status: 'failed', failedDate: day(26), day: 25 });
    expect(canCheckInChallenge(s, day(30))).toBe(false);
  });

  it('missing day 1 fails immediately once day 2 begins', () => {
    expect(ch([], day(2))).toMatchObject({ status: 'failed', failedDate: day(1), day: 0 });
  });

  it('checking in every day completes it', () => {
    const s = ch(run(day(1), 30), day(30));
    expect(s).toMatchObject({ status: 'completed', day: 30, daysLeft: 0, completedDate: day(30) });
    expect(ch(run(day(1), 30), day(45)).status).toBe('completed'); // stays completed afterwards
  });

  it('ignores check-ins outside the challenge window', () => {
    expect(ch([day(0), ...run(day(1), 3), day(40)], day(3))).toMatchObject({ day: 3, status: 'active' });
  });

  it('supports custom durations 1–365', () => {
    expect(isValidDuration(1)).toBe(true);
    expect(isValidDuration(365)).toBe(true);
    expect(isValidDuration(0)).toBe(false);
    expect(isValidDuration(366)).toBe(false);
    expect(isValidDuration(2.5)).toBe(false);
    expect(computeChallenge({ startDate: day(1), durationDays: 1, checkins: [day(1)], today: day(1) }).status).toBe('completed');
    expect(() => ch([], day(1), 0)).toThrow(RangeError);
    expect(challengeEndDate(day(1), 90)).toBe(day(90));
  });

  it('restart = a new attempt starting today; the failed one is unchanged', () => {
    const failed = ch(run(day(1), 5), day(8));
    const restarted = computeChallenge({ startDate: day(8), durationDays: 30, checkins: [day(8)], today: day(8) });
    expect(failed.status).toBe('failed');
    expect(restarted).toMatchObject({ status: 'active', day: 1, endDate: day(37) });
  });

  it('timezone moving west behind a check-in never double counts', () => {
    const s = ch(run(day(1), 10), day(9));
    expect(s).toMatchObject({ day: 10, checkedInToday: true, status: 'active' });
    expect(canCheckInChallenge(s, day(9))).toBe(false);
  });
});
