/**
 * Meditation timer state. Time-based, not tick-based: we store when the session ends (or how much
 * was left when paused), so the countdown stays exact with the screen locked, the app in the
 * background, or even after the app is killed. Persisted to AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { cancelNotification, scheduleMeditationEnd } from './notifications';

export type TimerState = {
  plannedMin: number;
  startedAt: number;
  /** wall-clock end while running; null while paused */
  endAt: number | null;
  /** remaining ms while paused */
  pausedRemaining: number | null;
  notifId: string | null;
};

const KEY = '254:meditationTimer';

export const useTimer = create<{ timer: TimerState | null; loaded: boolean }>(() => ({ timer: null, loaded: false }));

const persist = (t: TimerState | null) => {
  useTimer.setState({ timer: t });
  void (t ? AsyncStorage.setItem(KEY, JSON.stringify(t)) : AsyncStorage.removeItem(KEY));
};

export async function loadTimer() {
  const raw = await AsyncStorage.getItem(KEY);
  useTimer.setState({ timer: raw ? (JSON.parse(raw) as TimerState) : null, loaded: true });
}

export const remainingMs = (t: TimerState, now = Date.now()) => Math.max(0, t.endAt !== null ? t.endAt - now : (t.pausedRemaining ?? 0));
export const elapsedMs = (t: TimerState, now = Date.now()) => t.plannedMin * 60_000 - remainingMs(t, now);

export async function startTimer(minutes: number) {
  const now = Date.now();
  const endAt = now + minutes * 60_000;
  const notifId = await scheduleMeditationEnd(endAt, minutes).catch(() => null);
  persist({ plannedMin: minutes, startedAt: now, endAt, pausedRemaining: null, notifId });
}

export async function pauseTimer() {
  const t = useTimer.getState().timer;
  if (!t || t.endAt === null) return;
  await cancelNotification(t.notifId);
  persist({ ...t, pausedRemaining: remainingMs(t), endAt: null, notifId: null });
}

export async function resumeTimer() {
  const t = useTimer.getState().timer;
  if (!t || t.endAt !== null) return;
  const endAt = Date.now() + (t.pausedRemaining ?? 0);
  const notifId = await scheduleMeditationEnd(endAt, t.plannedMin).catch(() => null);
  persist({ ...t, endAt, pausedRemaining: null, notifId });
}

/** Stops the timer and returns the finished state (for saving the session). */
export async function stopTimer(): Promise<TimerState | null> {
  const t = useTimer.getState().timer;
  if (!t) return null;
  await cancelNotification(t.notifId);
  persist(null);
  return t;
}

/** Minutes worth saving: whole minutes meditated, or null if under one minute. */
export function minutesToSave(t: TimerState, now = Date.now()): number | null {
  const min = Math.floor(elapsedMs(t, now) / 60_000);
  return min >= 1 ? Math.min(min, t.plannedMin) : null;
}
