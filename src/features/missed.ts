/** Builds the queue of "missed a day" / "challenge failed" notices the user hasn't seen yet. */
import { useMemo, useState } from 'react';
import type { MissedItem } from '@/components/MissedNotice';
import { getMeta, setMeta } from '@/data/db';
import type { ChallengeView, HabitView } from '@/data/selectors';
import { addDays, type DateKey } from '@/domain/dates';
import { summarizeMisses, unseenMisses } from '@/domain/streaks';
import { shortDate } from '@/lib/format';
import { challengeIcon, habitIcon } from './checkins';

const ackKey = (k: string) => `ack:${k}`;

export function useMissedQueue(habits: HabitView[], challenges: ChallengeView[], today: DateKey) {
  const [version, setVersion] = useState(0);
  const queue = useMemo<MissedItem[]>(() => {
    const items: MissedItem[] = [];
    const floor = addDays(today, -8); // only recent misses — never a backlog of old history
    for (const v of habits) {
      if (v.habit.status !== 'active' || v.state.completedDate) continue;
      const ack = getMeta(ackKey(`habit:${v.habit.id}`));
      const since = ack && ack > floor ? ack : floor;
      const s = summarizeMisses(unseenMisses(v.state, since));
      if (!s) continue;
      items.push({
        key: `habit:${v.habit.id}`,
        name: v.habit.name,
        icon: habitIcon(v),
        tone: v.habit.kind === 'build' ? 'green' : 'orange',
        from: s.from,
        to: s.to,
        dateLabel: shortDate(s.date),
        kind: s.to > 0 ? 'fallback' : 'reset',
      });
    }
    for (const v of challenges) {
      if (v.state.status !== 'failed' || !v.state.failedDate || v.state.failedDate < floor) continue;
      if (getMeta(ackKey(`challenge:${v.challenge.id}`))) continue;
      items.push({
        key: `challenge:${v.challenge.id}`,
        name: v.challenge.name,
        icon: challengeIcon(v),
        tone: 'yellow',
        from: v.state.day,
        to: 0,
        dateLabel: shortDate(v.state.failedDate),
        kind: 'challenge',
        challengeId: v.challenge.id,
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, challenges, today, version]);

  const acknowledge = (item: MissedItem) => {
    setMeta(ackKey(item.key), item.kind === 'challenge' ? '1' : addDays(today, -1));
    setVersion((n) => n + 1);
  };

  return { queue, acknowledge };
}
