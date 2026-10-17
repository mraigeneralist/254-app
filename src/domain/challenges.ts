/**
 * Challenge engine. Unlike habits, challenges have no checkpoints:
 *
 * - A challenge starts on `startDate` and lasts `durationDays` (1–365) consecutive local days.
 * - The user marks it done once per day. Missing any day marks the challenge **failed** on that day.
 * - Checking in on every day completes it ("Challenge Complete!").
 * - "Restart" creates a new attempt starting today; the failed attempt is kept for the profile.
 */
import { addDays, maxKey, normalizeKeys, type DateKey } from './dates';

export const CHALLENGE_PRESETS = [30, 60, 90] as const;
export const CHALLENGE_MIN_DAYS = 1;
export const CHALLENGE_MAX_DAYS = 365;

export type ChallengeStatus = 'active' | 'failed' | 'completed';

export type ChallengeInput = {
  startDate: DateKey;
  durationDays: number;
  checkins: Iterable<DateKey>;
  today: DateKey;
};

export type ChallengeState = {
  status: ChallengeStatus;
  /** Days done so far — "Day X of Y". */
  day: number;
  durationDays: number;
  daysLeft: number;
  /** Last day of the challenge. */
  endDate: DateKey;
  failedDate: DateKey | null;
  completedDate: DateKey | null;
  checkedInToday: boolean;
  effectiveToday: DateKey;
};

export function isValidDuration(days: number): boolean {
  return Number.isInteger(days) && days >= CHALLENGE_MIN_DAYS && days <= CHALLENGE_MAX_DAYS;
}

export function challengeEndDate(startDate: DateKey, durationDays: number): DateKey {
  return addDays(startDate, durationDays - 1);
}

export function computeChallenge({ startDate, durationDays, checkins, today }: ChallengeInput): ChallengeState {
  if (!isValidDuration(durationDays)) throw new RangeError(`Challenge duration must be ${CHALLENGE_MIN_DAYS}–${CHALLENGE_MAX_DAYS} days`);
  const endDate = challengeEndDate(startDate, durationDays);
  const all = normalizeKeys(checkins).filter((d) => d >= startDate && d <= endDate);
  const done = new Set(all);
  const lastCheckin = all.at(-1);
  const effectiveToday = lastCheckin ? maxKey(today, lastCheckin) : today;

  let day = 0;
  let status: ChallengeStatus = 'active';
  let failedDate: DateKey | null = null;
  let completedDate: DateKey | null = null;

  for (let d = startDate; d <= endDate && d <= effectiveToday; d = addDays(d, 1)) {
    if (done.has(d)) {
      day += 1;
      if (day === durationDays) {
        status = 'completed';
        completedDate = d;
      }
    } else if (d < effectiveToday) {
      status = 'failed';
      failedDate = d;
      break;
    }
  }

  return {
    status,
    day,
    durationDays,
    daysLeft: durationDays - day,
    endDate,
    failedDate,
    completedDate,
    checkedInToday: done.has(effectiveToday),
    effectiveToday,
  };
}

export function canCheckInChallenge(state: ChallengeState, today: DateKey): boolean {
  if (state.status !== 'active' || today < state.effectiveToday) return false;
  return today > state.effectiveToday || !state.checkedInToday;
}
