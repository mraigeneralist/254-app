/** Check-in flows shared by Today and the detail screens: haptics, Undo snack, celebrations. */
import * as Haptics from 'expo-haptics';
import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;
import { asIcon } from '@/components/ds';
import { checkInChallenge, checkInHabit, undoChallengeCheckIn, undoHabitCheckIn } from '@/data/actions';
import type { ChallengeView, HabitView } from '@/data/selectors';
import { computeChallenge } from '@/domain/challenges';
import type { DateKey } from '@/domain/dates';
import { computeHabit, newMilestone } from '@/domain/streaks';
import { showSnack } from '@/lib/ui';

export function doHabitCheckIn(v: HabitView, today: DateKey, router: Router) {
  const before = v.state;
  checkInHabit(v.habit.id, today);
  const after = computeHabit({ startDate: v.habit.start_date, checkins: [...v.checkins, today], today });
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const hit = newMilestone(before, after);
  if (after.completedDate) {
    router.push({ pathname: '/celebrate', params: { type: v.habit.kind === 'build' ? 'built' : 'broken', id: v.habit.id } });
    return;
  }
  if (hit) {
    router.push({ pathname: '/celebrate', params: { type: 'milestone', id: v.habit.id, day: String(hit.day) } });
    return;
  }
  showSnack({
    icon: v.habit.kind === 'build' ? 'circle-check' : 'shield-check',
    text: `${v.habit.name} · Day ${after.current}${v.habit.kind === 'break' ? ' clean' : ''}`,
    action: 'Undo',
    onAction: () => doHabitUndo(v, today),
  });
}

export function doHabitUndo(v: HabitView, today: DateKey) {
  undoHabitCheckIn(v.habit.id, today);
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function doChallengeCheckIn(v: ChallengeView, today: DateKey, router: Router) {
  checkInChallenge(v.challenge.id, today);
  const after = computeChallenge({ startDate: v.challenge.start_date, durationDays: v.challenge.duration_days, checkins: [...v.checkins, today], today });
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (after.status === 'completed') {
    router.push({ pathname: '/celebrate', params: { type: 'challenge', id: v.challenge.id } });
    return;
  }
  showSnack({ icon: 'trophy', text: `${v.challenge.name} · Day ${after.day} of ${after.durationDays}`, action: 'Undo', onAction: () => doChallengeUndo(v, today) });
}

export function doChallengeUndo(v: ChallengeView, today: DateKey) {
  undoChallengeCheckIn(v.challenge.id, today);
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export const habitIcon = (v: HabitView) => asIcon(v.habit.icon, v.habit.kind === 'build' ? 'sprout' : 'shield');
export const challengeIcon = (v: ChallengeView) => asIcon(v.challenge.icon, 'trophy');
