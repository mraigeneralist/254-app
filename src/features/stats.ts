import type { ChallengeView, HabitView } from '@/data/selectors';
import type { MeditationSession } from '@/data/types';
import { addDays, weekdayMon0, type DateKey } from '@/domain/dates';

export type ProfileStats = {
  building: number;
  breaking: number;
  built: HabitView[];
  broken: HabitView[];
  challenges: { active: ChallengeView[]; completed: ChallengeView[]; failed: ChallengeView[] };
  meditationMinutes: number;
  meditationSessions: number;
  streaks: { id: string; name: string; day: number; max: number; kind: 'build' | 'break' | 'challenge'; href: string }[];
  longest: { days: number; name: string } | null;
  /** check-ins per day, oldest → newest */
  last30: { date: DateKey; count: number }[];
  /** 24 weeks × 7 days of check-in counts, Monday-first columns */
  heatmap: { date: DateKey; count: number; future: boolean }[];
  /** meditation minutes per week, last 8 weeks (week start dates) */
  medWeeks: { week: DateKey; minutes: number }[];
  milestones: { day: number; name: string; date: DateKey }[];
  totalCheckins: number;
};

export function computeStats(habits: HabitView[], challenges: ChallengeView[], sessions: MeditationSession[], today: DateKey): ProfileStats {
  const active = habits.filter((v) => !v.state.completedDate);
  const done = habits.filter((v) => v.state.completedDate);

  const perDay = new Map<DateKey, number>();
  let totalCheckins = 0;
  for (const v of habits) for (const d of v.checkins) {
    perDay.set(d, (perDay.get(d) ?? 0) + 1);
    totalCheckins += 1;
  }
  for (const v of challenges) for (const d of v.checkins) perDay.set(d, (perDay.get(d) ?? 0) + 1);

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29);
    return { date, count: perDay.get(date) ?? 0 };
  });

  const thisMonday = addDays(today, -weekdayMon0(today));
  const firstMonday = addDays(thisMonday, -23 * 7);
  const heatmap = Array.from({ length: 24 * 7 }, (_, i) => {
    const date = addDays(firstMonday, i);
    return { date, count: perDay.get(date) ?? 0, future: date > today };
  });

  const medWeeks = Array.from({ length: 8 }, (_, i) => {
    const week = addDays(thisMonday, (i - 7) * 7);
    const end = addDays(week, 7);
    return { week, minutes: sessions.filter((s) => s.date >= week && s.date < end).reduce((n, s) => n + s.actual_minutes, 0) };
  });

  const streaks = [
    ...active.map((v) => ({ id: v.habit.id, name: v.habit.name, day: v.state.current, max: 254, kind: v.habit.kind, href: `/habit/${v.habit.id}` })),
    ...challenges
      .filter((c) => c.state.status === 'active')
      .map((c) => ({ id: c.challenge.id, name: c.challenge.name, day: c.state.day, max: c.state.durationDays, kind: 'challenge' as const, href: `/challenge/${c.challenge.id}` })),
  ].sort((a, b) => b.day - a.day);

  const best = habits.reduce<HabitView | null>((m, v) => (!m || v.state.best > m.state.best ? v : m), null);

  const milestones = habits
    .flatMap((v) => v.state.milestones.map((m) => ({ day: m.day, date: m.date, name: v.habit.name })))
    .sort((a, b) => b.date.localeCompare(a.date) || b.day - a.day);

  return {
    building: active.filter((v) => v.habit.kind === 'build').length,
    breaking: active.filter((v) => v.habit.kind === 'break').length,
    built: done.filter((v) => v.habit.kind === 'build'),
    broken: done.filter((v) => v.habit.kind === 'break'),
    challenges: {
      active: challenges.filter((c) => c.state.status === 'active'),
      completed: challenges.filter((c) => c.state.status === 'completed'),
      failed: challenges.filter((c) => c.state.status === 'failed'),
    },
    meditationMinutes: sessions.reduce((n, s) => n + s.actual_minutes, 0),
    meditationSessions: sessions.length,
    streaks,
    longest: best && best.state.best > 0 ? { days: best.state.best, name: best.habit.name } : null,
    last30,
    heatmap,
    medWeeks,
    milestones,
    totalCheckins,
  };
}
