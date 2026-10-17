/**
 * Local notifications (no push server).
 *
 * Android can't skip a single day of a repeating alarm, so reminders are scheduled as one-off
 * notifications over a rolling window (up to 14 days). The window is rebuilt whenever data or
 * settings change and whenever the app opens — so "skip today's reminder if already checked in"
 * works, and edits / sign-in on a new device reschedule everything.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { addDays, type DateKey } from '@/domain/dates';
import { time12 } from '@/lib/format';
import type { NotificationSettings, Task } from '@/data/types';

export type PermissionState = 'granted' | 'denied' | 'undetermined';
export const usePermission = create<{ status: PermissionState }>(() => ({ status: 'undetermined' }));

const CH_REMINDERS = 'reminders';
const CH_MEDITATION = 'meditation';
export const CATEGORY_HABIT = 'habit-reminder';
export const ACTION_MARK_DONE = 'mark-done';
const OUR_KINDS = new Set(['habit', 'task', 'summary']);

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let setupDone = false;
export async function setupNotifications() {
  if (setupDone) return;
  setupDone = true;
  if (Platform.OS === 'android') {
    // Android 13+: a channel must exist before the permission prompt can be shown
    await Notifications.setNotificationChannelAsync(CH_REMINDERS, {
      name: 'Reminders',
      description: 'Habit check-ins, task reminders and the daily summary',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#9BB167',
    });
    await Notifications.setNotificationChannelAsync(CH_MEDITATION, {
      name: 'Meditation timer',
      description: 'Tells you when a meditation session ends',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#9BB167',
    });
  }
  await Notifications.setNotificationCategoryAsync(CATEGORY_HABIT, [
    { identifier: ACTION_MARK_DONE, buttonTitle: 'Mark done', options: { opensAppToForeground: true } },
  ]);
  await refreshPermission();
}

export async function refreshPermission(): Promise<PermissionState> {
  const p = await Notifications.getPermissionsAsync();
  const status: PermissionState = p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  usePermission.setState({ status });
  return status;
}

export async function requestPermission(): Promise<PermissionState> {
  await setupNotifications();
  const p = await Notifications.requestPermissionsAsync();
  const status: PermissionState = p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  usePermission.setState({ status });
  return status;
}

// ─── reminder schedule ──────────────────────────────────────────────────────

export type ReminderHabit = {
  id: string;
  name: string;
  kind: 'build' | 'break';
  reminderTime: string | null;
  checkedInToday: boolean;
  current: number;
};

export type ScheduleInput = {
  settings: NotificationSettings;
  today: DateKey;
  habits: ReminderHabit[];
  /** active challenges not checked in today get the daily summary nudge */
  openChallenges: number;
  tasks: Task[];
};

const at = (day: DateKey, hhmm: string) => {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
};

type Planned = { date: Date; content: Notifications.NotificationContentInput };

function plan(input: ScheduleInput): Planned[] {
  const { settings: s, today, habits, tasks } = input;
  if (!s.notificationsEnabled) return [];
  const now = Date.now();
  const out: Planned[] = [];
  const withReminders = habits.filter((h) => h.reminderTime && (h.kind === 'build' ? s.habitReminders : s.breakReminders));
  const windowDays = Math.max(3, Math.min(14, Math.floor(380 / (withReminders.length + 2))));

  for (let i = 0; i < windowDays; i++) {
    const day = addDays(today, i);
    for (const h of withReminders) {
      if (i === 0 && h.checkedInToday) continue; // already done today → skip today's reminder
      const date = at(day, h.reminderTime!);
      if (date.getTime() <= now) continue;
      out.push({
        date,
        content: {
          title: h.kind === 'build' ? `Time for ${h.name}` : h.name,
          body: h.kind === 'build'
            ? i === 0 ? `Day ${h.current} of 254. Tap Mark done when it’s done.` : 'Check in today to keep your streak going.'
            : 'Stayed clean today? Check in to add a day.',
          categoryIdentifier: CATEGORY_HABIT,
          data: { kind: 'habit', habitId: h.id, day, url: '/today' },
        },
      });
    }
    if (s.summaryEnabled) {
      const date = at(day, s.summaryTime);
      if (date.getTime() > now) {
        if (i === 0) {
          const waiting = habits.filter((h) => !h.checkedInToday);
          const n = waiting.length + input.openChallenges;
          if (n > 0) {
            const names = waiting.map((h) => h.name);
            const list = names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(names.length === 2 ? ' and ' : ', ');
            out.push({
              date,
              content: {
                title: `${n} ${n === 1 ? 'check-in' : 'check-ins'} still waiting`,
                body: list ? `${list} ${names.length === 1 ? 'isn’t' : 'aren’t'} marked yet. Check in before midnight.` : 'Your challenges aren’t marked yet. Check in before midnight.',
                data: { kind: 'summary', url: '/today' },
              },
            });
          }
        } else if (habits.length + input.openChallenges > 0) {
          out.push({ date, content: { title: 'Anything still waiting?', body: 'Check in before midnight to keep your streaks.', data: { kind: 'summary', url: '/today' } } });
        }
      }
    }
  }

  if (s.taskReminders) {
    for (const t of tasks) {
      if (!t.reminder || !t.time || t.completed_at || t.deleted_at) continue;
      const date = at(t.date, t.time);
      if (date.getTime() <= now) continue;
      out.push({ date, content: { title: t.title, body: `Task due ${t.date === today ? 'today' : 'on ' + t.date} at ${time12(t.time)}.`, data: { kind: 'task', taskId: t.id, url: `/task/${t.id}` } } });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 450);
}

let lastSignature = '';
let running: Promise<void> | null = null;
let queued: ScheduleInput | null = null;

/** Replace all scheduled reminders with a fresh plan (no-op if nothing changed). */
export async function rescheduleReminders(input: ScheduleInput, force = false) {
  if (usePermission.getState().status !== 'granted') return;
  const planned = plan(input);
  const signature = JSON.stringify(planned.map((p) => [p.date.getTime(), p.content.title, p.content.body]));
  if (!force && signature === lastSignature) return;
  if (running) {
    queued = input;
    return;
  }
  running = (async () => {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      existing.filter((n) => OUR_KINDS.has(String(n.content.data?.kind))).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    for (const p of planned) {
      await Notifications.scheduleNotificationAsync({
        content: { ...p.content, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId: CH_REMINDERS },
      });
    }
    lastSignature = signature;
  })().finally(() => {
    running = null;
    if (queued) {
      const q = queued;
      queued = null;
      void rescheduleReminders(q);
    }
  });
  await running;
}

/** Sign-out: remove every scheduled notification. */
export async function cancelAllReminders() {
  lastSignature = '';
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── meditation ─────────────────────────────────────────────────────────────

export async function scheduleMeditationEnd(endAt: number, minutes: number): Promise<string | null> {
  if (usePermission.getState().status !== 'granted') return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Session complete', body: `${minutes} min of stillness. Nice work.`, sound: true, data: { kind: 'meditation', url: '/meditate' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endAt), channelId: CH_MEDITATION },
  });
}

export async function cancelNotification(id: string | null | undefined) {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
