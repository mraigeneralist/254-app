/**
 * Streak engine for habits (Build) and addictions (Break) — both follow the same rules:
 *
 * - One check-in per local calendar day. Each check-in adds 1 to the current count.
 * - Reaching a milestone (30, 60, 90, 100, 150, 200, 250, 254) saves it as the checkpoint.
 * - A past day with no check-in drops the count back to the checkpoint (0 if none).
 *   Several missed days in a row still only drop to the checkpoint, never below it.
 * - Reaching 254 completes the habit ("Habit Built!" / "Addiction Broken!").
 *
 * State is never stored incrementally — it is *replayed* from the check-in history every time the
 * app opens or returns to the foreground, so it is always correct even if the phone was off.
 */
import { addDays, maxKey, normalizeKeys, type DateKey } from './dates';
import { GOAL_DAYS, MILESTONES, nextMilestone } from './milestones';

export type MilestoneHit = { day: number; date: DateKey };

/** A day the user missed that actually lowered the count. */
export type MissEvent = { date: DateKey; from: number; to: number };

export type HabitInput = {
  /** First day the habit counts from (the day it was created). */
  startDate: DateKey;
  /** Local dates the user checked in (any order, duplicates ignored). */
  checkins: Iterable<DateKey>;
  /** The device's local date right now. */
  today: DateKey;
};

export type HabitState = {
  /** Current day count, e.g. 47 in "Day 47 of 254". */
  current: number;
  /** Last milestone reached — the floor the count can never drop below. */
  checkpoint: number;
  /** Highest count ever reached. */
  best: number;
  nextMilestone: number;
  milestones: MilestoneHit[];
  /** Date the habit reached 254, or null while active. */
  completedDate: DateKey | null;
  checkedInToday: boolean;
  /** Every miss that lowered the count, oldest first. */
  misses: MissEvent[];
  /**
   * The date the engine treats as "today". Normally equals the input `today`; if the device clock or
   * timezone moved backwards behind an existing check-in, it is that later check-in's date so the
   * same day is never counted twice.
   */
  effectiveToday: DateKey;
};

export function computeHabit({ startDate, checkins, today }: HabitInput): HabitState {
  const all = normalizeKeys(checkins);
  const lastCheckin = all.at(-1);
  const effectiveToday = lastCheckin ? maxKey(today, lastCheckin) : today;
  const firstDay = all[0] && all[0] < startDate ? all[0] : startDate;
  const done = new Set(all);

  let current = 0;
  let checkpoint = 0;
  let best = 0;
  let completedDate: DateKey | null = null;
  const milestones: MilestoneHit[] = [];
  const misses: MissEvent[] = [];

  for (let d = firstDay; d <= effectiveToday; d = addDays(d, 1)) {
    if (done.has(d)) {
      current += 1;
      best = Math.max(best, current);
      if ((MILESTONES as readonly number[]).includes(current) && current > checkpoint) {
        checkpoint = current;
        milestones.push({ day: current, date: d });
      }
      if (current >= GOAL_DAYS) {
        completedDate = d;
        break;
      }
    } else if (d < effectiveToday) {
      if (current > checkpoint) misses.push({ date: d, from: current, to: checkpoint });
      current = checkpoint;
    }
    // today without a check-in: nothing yet — the user has until local midnight.
  }

  return {
    current,
    checkpoint,
    best,
    nextMilestone: nextMilestone(current),
    milestones,
    completedDate,
    checkedInToday: done.has(effectiveToday),
    misses,
    effectiveToday,
  };
}

/** Whether the user may check in right now (not already done today, habit still active). */
export function canCheckIn(state: HabitState, today: DateKey): boolean {
  if (state.completedDate !== null || today < state.effectiveToday) return false;
  return today > state.effectiveToday || !state.checkedInToday;
}

/** The milestone reached by going from `before` to `after` (for the celebration screen), if any. */
export function newMilestone(before: HabitState, after: HabitState): MilestoneHit | null {
  const hit = after.milestones.at(-1);
  if (!hit) return null;
  return before.milestones.some((m) => m.day === hit.day) ? null : hit;
}

/** Misses the user hasn't been told about yet (dates after the last one they acknowledged). */
export function unseenMisses(state: HabitState, acknowledgedThrough: DateKey | null): MissEvent[] {
  return acknowledgedThrough ? state.misses.filter((m) => m.date > acknowledgedThrough) : state.misses;
}

/**
 * Collapses consecutive misses into one notice: "was 47 → now 30" for a run of missed days,
 * matching the "Missed a day" dialog (S03/S04).
 */
export function summarizeMisses(misses: MissEvent[]): MissEvent | null {
  if (misses.length === 0) return null;
  return { date: misses.at(-1)!.date, from: Math.max(...misses.map((m) => m.from)), to: misses.at(-1)!.to };
}
