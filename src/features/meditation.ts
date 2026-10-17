/**
 * Meditation timer state. Time-based, not tick-based: we store when the session ends (or how much
 * was left when paused), so the countdown stays exact with the screen locked, the app in the
 * background, or even after the app is killed. Persisted to AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { TimerAlarm } from '../../modules/timer-alarm';
import { cancelNotification, scheduleMeditationEnd } from './notifications';

const NATIVE_ALARM = 'native-alarm';

/**
 * Schedules the end-of-session bell. On Android this is a native alarm-clock alarm that rings until
 * the user stops it (like a clock app's timer); elsewhere it falls back to a local notification.
 */
async function scheduleEnd(endAt: number, minutes: number, sound = 'bowl'): Promise<string | null> {
  if (TimerAlarm) {
    TimerAlarm.schedule(endAt, 'Time’s up', `Your ${minutes}-minute meditation is complete.`, sound);
    return NATIVE_ALARM;
  }
  return scheduleMeditationEnd(endAt, minutes, sound).catch(() => null);
}

async function cancelEnd(id: string | null) {
  if (id === NATIVE_ALARM) TimerAlarm?.cancel();
  else await cancelNotification(id);
}

/** Silence the bell if it is ringing. */
export const stopBell = () => TimerAlarm?.stop();

export type TimerState = {
  plannedMin: number;
  startedAt: number;
  /** wall-clock end while running; null while paused */
  endAt: number | null;
  /** remaining ms while paused */
  pausedRemaining: number | null;
  notifId: string | null;
  /** chosen end bell (bowl | gong | chimes | marimba) */
  sound?: string;
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

export async function startTimer(minutes: number, sound = 'bowl') {
  const now = Date.now();
  const endAt = now + minutes * 60_000;
  const notifId = await scheduleEnd(endAt, minutes, sound);
  persist({ plannedMin: minutes, startedAt: now, endAt, pausedRemaining: null, notifId, sound });
}

export async function pauseTimer() {
  const t = useTimer.getState().timer;
  if (!t || t.endAt === null) return;
  await cancelEnd(t.notifId);
  persist({ ...t, pausedRemaining: remainingMs(t), endAt: null, notifId: null });
}

export async function resumeTimer() {
  const t = useTimer.getState().timer;
  if (!t || t.endAt !== null) return;
  const endAt = Date.now() + (t.pausedRemaining ?? 0);
  const notifId = await scheduleEnd(endAt, t.plannedMin, t.sound);
  persist({ ...t, endAt, pausedRemaining: null, notifId });
}

/**
 * The countdown reached zero by itself: clear the timer but leave the scheduled end alarm alone —
 * it is what rings the bell (on the alarm stream, at the exact end time), even with the app open.
 */
export function finishTimer(): TimerState | null {
  const t = useTimer.getState().timer;
  if (!t) return null;
  persist(null);
  return t;
}

/** Stops the timer early (End / pause flow) and cancels the end alarm. Returns the state for saving. */
export async function stopTimer(): Promise<TimerState | null> {
  const t = useTimer.getState().timer;
  if (!t) return null;
  await cancelEnd(t.notifId);
  persist(null);
  return t;
}

/** Minutes worth saving: whole minutes meditated, or null if under one minute. */
export function minutesToSave(t: TimerState, now = Date.now()): number | null {
  const min = Math.floor(elapsedMs(t, now) / 60_000);
  return min >= 1 ? Math.min(min, t.plannedMin) : null;
}
