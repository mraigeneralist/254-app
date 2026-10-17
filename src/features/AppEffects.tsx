/**
 * Background upkeep while signed in:
 *  - persists derived streak/challenge fields (checkpoint, best, completion, failure)
 *  - keeps the local reminder schedule in sync with data + settings
 *  - handles taps on notifications (incl. the "Mark done" action)
 */
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { checkInHabit, reconcileChallenge, reconcileHabit } from '@/data/actions';
import { useChallengeViews, useHabitViews, useSettings } from '@/data/selectors';
import { live, useData } from '@/data/store';
import { toDateKey } from '@/domain/dates';
import { useToday } from '@/hooks/useToday';
import { showSnack } from '@/lib/ui';
import { ACTION_MARK_DONE, refreshPermission, rescheduleReminders, setupNotifications, usePermission } from './notifications';

export function AppEffects() {
  const router = useRouter();
  const today = useToday();
  const habits = useHabitViews(today);
  const challenges = useChallengeViews(today);
  const settings = useSettings();
  const tasks = useData((s) => s.tables.tasks);
  const permission = usePermission((s) => s.status);

  // persist derived fields
  useEffect(() => {
    for (const v of habits) reconcileHabit(v.habit, v.state);
  }, [habits]);
  useEffect(() => {
    for (const v of challenges) reconcileChallenge(v.challenge, v.state);
  }, [challenges]);

  // reminders (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      void rescheduleReminders({
        settings,
        today,
        habits: habits
          .filter((v) => v.habit.status === 'active' && !v.state.completedDate)
          .map((v) => ({ id: v.habit.id, name: v.habit.name, kind: v.habit.kind, reminderTime: v.habit.reminder_time, checkedInToday: v.state.checkedInToday, current: v.state.current })),
        openChallenges: settings.challengeReminders ? challenges.filter((c) => c.state.status === 'active' && !c.state.checkedInToday).length : 0,
        tasks: live(tasks),
      }).catch((e) => console.warn('[notifications]', e));
    }, 1500);
    return () => clearTimeout(t);
  }, [habits, challenges, tasks, settings, today, permission]);

  // permission can change in system settings while we're in the background
  useEffect(() => {
    void setupNotifications();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshPermission();
    });
    return () => sub.remove();
  }, []);

  // notification taps
  const handled = useRef(new Set<string>());
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    const id = lastResponse.notification.request.identifier + lastResponse.actionIdentifier;
    if (handled.current.has(id)) return;
    handled.current.add(id);
    const data = lastResponse.notification.request.content.data as { kind?: string; habitId?: string; url?: string };
    if (lastResponse.actionIdentifier === ACTION_MARK_DONE && data.habitId) {
      const habit = useData.getState().tables.habits[data.habitId];
      if (habit && !habit.deleted_at) {
        checkInHabit(habit.id, toDateKey());
        showSnack({ icon: 'circle-check', text: `${habit.name} · checked in` });
      }
      router.navigate('/today');
    } else if (data.url) {
      router.navigate(data.url as Href);
    }
    void Notifications.dismissNotificationAsync(lastResponse.notification.request.identifier).catch(() => undefined);
  }, [lastResponse, router]);

  return null;
}
