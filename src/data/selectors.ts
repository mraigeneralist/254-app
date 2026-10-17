import { useMemo } from 'react';
import { computeChallenge, type ChallengeState } from '@/domain/challenges';
import type { DateKey } from '@/domain/dates';
import { computeHabit, type HabitState } from '@/domain/streaks';
import { live, useData } from './store';
import { DEFAULT_SETTINGS, type Challenge, type Habit, type NotificationSettings, type Profile } from './types';
import { useSession } from './session';

export type HabitView = { habit: Habit; state: HabitState; checkins: DateKey[] };
export type ChallengeView = { challenge: Challenge; state: ChallengeState; checkins: DateKey[] };

function groupDates<T extends { date: string; deleted_at: string | null }>(rows: Record<string, T>, parent: keyof T) {
  const map = new Map<string, DateKey[]>();
  for (const r of Object.values(rows)) {
    if (r.deleted_at) continue;
    const k = String(r[parent]);
    const arr = map.get(k);
    if (arr) arr.push(r.date);
    else map.set(k, [r.date]);
  }
  return map;
}

/** Every non-deleted habit with its replayed streak state, oldest first. */
export function useHabitViews(today: DateKey): HabitView[] {
  const habits = useData((s) => s.tables.habits);
  const checkins = useData((s) => s.tables.habit_checkins);
  return useMemo(() => {
    const byHabit = groupDates(checkins, 'habit_id');
    return live(habits)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((habit) => {
        const dates = byHabit.get(habit.id) ?? [];
        return { habit, checkins: dates, state: computeHabit({ startDate: habit.start_date, checkins: dates, today }) };
      });
  }, [habits, checkins, today]);
}

export function useChallengeViews(today: DateKey): ChallengeView[] {
  const challenges = useData((s) => s.tables.challenges);
  const checkins = useData((s) => s.tables.challenge_checkins);
  return useMemo(() => {
    const byId = groupDates(checkins, 'challenge_id');
    return live(challenges)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((challenge) => {
        const dates = byId.get(challenge.id) ?? [];
        return {
          challenge,
          checkins: dates,
          state: computeChallenge({ startDate: challenge.start_date, durationDays: challenge.duration_days, checkins: dates, today }),
        };
      });
  }, [challenges, checkins, today]);
}

export function useProfile(): Profile {
  const userId = useData((s) => s.userId);
  const row = useData((s) => (userId ? s.tables.profiles[userId] : undefined));
  const meta = useSession((s) => s.session?.user.user_metadata as { name?: string } | undefined);
  return useMemo(
    () =>
      row ?? {
        id: userId ?? '',
        name: meta?.name ?? '',
        onboarding_completed: false,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date(0).toISOString(),
        deleted_at: null,
      },
    [row, userId, meta?.name],
  );
}

export function useSettings(): NotificationSettings {
  const profile = useProfile();
  return useMemo(() => ({ ...DEFAULT_SETTINGS, ...profile.settings }), [profile.settings]);
}

export const useEmail = () => useSession((s) => s.session?.user.email ?? '');
