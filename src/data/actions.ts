/** Every user-data mutation in the app. All are local-first: they work offline and sync later. */
import type { DateKey } from '@/domain/dates';
import type { ChallengeState } from '@/domain/challenges';
import type { HabitState } from '@/domain/streaks';
import { uuid } from '@/lib/uuid';
import { live, saveRow, softDelete, useData } from './store';
import type { Challenge, Habit, HabitKind, MeditationSession, Note, NotificationSettings, Profile, Task } from './types';

// ─── profile ────────────────────────────────────────────────────────────────

export function updateProfile(patch: Partial<Pick<Profile, 'name' | 'onboarding_completed' | 'settings'>>) {
  const { userId, tables } = useData.getState();
  if (!userId) return;
  const existing = tables.profiles[userId];
  const base = existing ?? { name: '', onboarding_completed: false, settings: {} };
  saveRow('profiles', { ...base, ...patch, id: userId });
}

export function updateSettings(patch: Partial<NotificationSettings>) {
  const { userId, tables } = useData.getState();
  const settings = { ...(userId ? tables.profiles[userId]?.settings : {}), ...patch };
  updateProfile({ settings });
}

// ─── habits ─────────────────────────────────────────────────────────────────

export type HabitInput = { kind: HabitKind; name: string; description: string; icon: string; reminder_time: string | null };

export function createHabit(input: HabitInput, today: DateKey): Habit {
  return saveRow('habits', {
    id: uuid(),
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    start_date: today,
    status: 'active',
    completed_date: null,
    checkpoint: 0,
    best_streak: 0,
  });
}

export function updateHabit(id: string, patch: Partial<HabitInput>) {
  const h = useData.getState().tables.habits[id];
  if (h) saveRow('habits', { ...h, ...patch });
}

/** Deletes the habit and its whole check-in history. */
export function deleteHabit(id: string) {
  for (const c of live(useData.getState().tables.habit_checkins)) if (c.habit_id === id) softDelete('habit_checkins', `${c.habit_id}:${c.date}`);
  softDelete('habits', id);
}

export function checkInHabit(habitId: string, date: DateKey) {
  saveRow('habit_checkins', { habit_id: habitId, date, deleted_at: null });
}

export function undoHabitCheckIn(habitId: string, date: DateKey) {
  softDelete('habit_checkins', `${habitId}:${date}`);
}

/** Persist derived streak fields (checkpoint, best, completion) when the replayed state changes. */
export function reconcileHabit(h: Habit, s: HabitState) {
  const status = s.completedDate ? 'completed' : 'active';
  if (h.checkpoint !== s.checkpoint || h.best_streak !== s.best || h.status !== status || h.completed_date !== s.completedDate) {
    saveRow('habits', { ...h, checkpoint: s.checkpoint, best_streak: s.best, status, completed_date: s.completedDate });
  }
}

// ─── challenges ─────────────────────────────────────────────────────────────

export type ChallengeInput = { name: string; description: string; duration_days: number; icon?: string };

export function createChallenge(input: ChallengeInput, today: DateKey, restartedFrom: string | null = null): Challenge {
  return saveRow('challenges', {
    id: uuid(),
    name: input.name.trim(),
    description: input.description.trim(),
    icon: input.icon ?? 'trophy',
    duration_days: input.duration_days,
    start_date: today,
    status: 'active',
    completed_date: null,
    failed_date: null,
    restarted_from: restartedFrom,
  });
}

export function restartChallenge(old: Challenge, today: DateKey): Challenge {
  return createChallenge({ name: old.name, description: old.description, duration_days: old.duration_days, icon: old.icon }, today, old.id);
}

export function deleteChallenge(id: string) {
  for (const c of live(useData.getState().tables.challenge_checkins)) if (c.challenge_id === id) softDelete('challenge_checkins', `${c.challenge_id}:${c.date}`);
  softDelete('challenges', id);
}

export function checkInChallenge(challengeId: string, date: DateKey) {
  saveRow('challenge_checkins', { challenge_id: challengeId, date, deleted_at: null });
}

export function undoChallengeCheckIn(challengeId: string, date: DateKey) {
  softDelete('challenge_checkins', `${challengeId}:${date}`);
}

export function reconcileChallenge(c: Challenge, s: ChallengeState) {
  if (c.status !== s.status || c.failed_date !== s.failedDate || c.completed_date !== s.completedDate) {
    saveRow('challenges', { ...c, status: s.status, failed_date: s.failedDate, completed_date: s.completedDate });
  }
}

// ─── tasks ──────────────────────────────────────────────────────────────────

export function addTask(title: string, date: DateKey, extra: Partial<Pick<Task, 'time' | 'reminder' | 'notes'>> = {}): Task {
  return saveRow('tasks', { id: uuid(), title: title.trim(), notes: '', date, time: null, reminder: false, completed_at: null, ...extra });
}

export function updateTask(id: string, patch: Partial<Pick<Task, 'title' | 'notes' | 'date' | 'time' | 'reminder'>>) {
  const t = useData.getState().tables.tasks[id];
  if (t) saveRow('tasks', { ...t, ...patch });
}

export function setTaskDone(id: string, done: boolean) {
  const t = useData.getState().tables.tasks[id];
  if (t) saveRow('tasks', { ...t, completed_at: done ? new Date().toISOString() : null });
}

export const deleteTask = (id: string) => softDelete('tasks', id);

// ─── meditation ─────────────────────────────────────────────────────────────

export function addMeditationSession(input: Pick<MeditationSession, 'date' | 'started_at' | 'planned_minutes' | 'actual_minutes'>) {
  return saveRow('meditation_sessions', { id: uuid(), ...input });
}

// ─── notes ──────────────────────────────────────────────────────────────────

export function saveNote(input: { id?: string; date: DateKey; title: string; body: string }): Note {
  const existing = input.id ? useData.getState().tables.notes[input.id] : undefined;
  return saveRow('notes', { ...existing, id: input.id ?? uuid(), date: input.date, title: input.title.trim(), body: input.body });
}

export const deleteNote = (id: string) => softDelete('notes', id);
