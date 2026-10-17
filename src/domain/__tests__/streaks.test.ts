import { addDays, toDateKey } from '../dates';
import { canCheckIn, computeHabit, newMilestone, summarizeMisses, unseenMisses } from '../streaks';
import { D0, day, run } from './helpers';

const habit = (checkins: string[], today: string, startDate = D0) => computeHabit({ startDate, checkins, today });

describe('computeHabit — basics', () => {
  it('starts at Day 0 with nothing checked in', () => {
    const s = habit([], day(1));
    expect(s).toMatchObject({ current: 0, checkpoint: 0, best: 0, nextMilestone: 30, checkedInToday: false, completedDate: null });
    expect(s.misses).toEqual([]);
  });

  it('each check-in on a new consecutive day adds 1', () => {
    expect(habit([day(1)], day(1)).current).toBe(1);
    expect(habit(run(day(1), 5), day(5))).toMatchObject({ current: 5, best: 5, checkedInToday: true });
  });

  it('today without a check-in does not reset anything (user has until midnight)', () => {
    expect(habit(run(day(1), 2), day(3))).toMatchObject({ current: 2, checkedInToday: false, misses: [] });
  });

  it('ignores duplicate and invalid dates', () => {
    expect(habit([day(1), day(1), 'nope', day(2)], day(2)).current).toBe(2);
  });

  it('undo = removing today\'s check-in from the history', () => {
    const before = habit(run(day(1), 3), day(3));
    const undone = habit(run(day(1), 2), day(3));
    expect(before.current).toBe(3);
    expect(undone).toMatchObject({ current: 2, checkedInToday: false });
  });
});

describe('computeHabit — misses and checkpoints (spec examples)', () => {
  it('checked in days 1 and 2, missed day 3 → back to 0', () => {
    const s = habit([day(1), day(2)], day(4));
    expect(s.current).toBe(0);
    expect(s.misses).toEqual([{ date: day(3), from: 2, to: 0 }]);
  });

  it('reached 31, missed day 32 → back to 30', () => {
    const s = habit(run(day(1), 31), day(33));
    expect(s).toMatchObject({ current: 30, checkpoint: 30, best: 31 });
    expect(s.misses).toEqual([{ date: day(32), from: 31, to: 30 }]);
  });

  it('several missed days in a row only drop to the last checkpoint, never below', () => {
    const s = habit(run(day(1), 47), addDays(day(47), 20));
    expect(s).toMatchObject({ current: 30, checkpoint: 30, best: 47 });
    expect(s.misses).toHaveLength(1); // later missed days don't lower the count further
  });

  it('missing several days without any checkpoint stays at 0', () => {
    const s = habit(run(day(1), 8), day(30));
    expect(s.current).toBe(0);
    expect(s.misses).toEqual([{ date: day(9), from: 8, to: 0 }]);
  });

  it('checkpoints are never lost: climbs from the checkpoint to the next milestone', () => {
    // 35 days, miss day 36 (→30), then 30 more days → 60
    const checkins = [...run(day(1), 35), ...run(day(37), 30)];
    const s = habit(checkins, day(66));
    expect(s).toMatchObject({ current: 60, checkpoint: 60, nextMilestone: 90 });
    expect(s.milestones.map((m) => m.day)).toEqual([30, 60]);
  });

  it('records every milestone with the date it was reached', () => {
    const s = habit(run(day(1), 150), day(150));
    expect(s.milestones).toEqual([30, 60, 90, 100, 150].map((m) => ({ day: m, date: day(m) })));
    expect(s.nextMilestone).toBe(200);
  });
});

describe('computeHabit — reaching 254', () => {
  it('completes on day 254 with the finish date', () => {
    const s = habit(run(day(1), 254), day(254));
    expect(s).toMatchObject({ current: 254, checkpoint: 254, completedDate: day(254) });
    expect(s.milestones.at(-1)).toEqual({ day: 254, date: day(254) });
  });

  it('completes after setbacks too, and ignores anything after completion', () => {
    // 100 days, miss one (→100), 154 more → 254 on calendar day 255; extra check-ins afterwards ignored
    const checkins = [...run(day(1), 100), ...run(day(102), 160)];
    const s = habit(checkins, day(300));
    expect(s).toMatchObject({ current: 254, completedDate: day(255) });
    expect(canCheckIn(s, day(300))).toBe(false);
  });

  it('250 → miss → back to 250, not further', () => {
    expect(habit(run(day(1), 253), day(255)).current).toBe(250);
  });
});

describe('midnight edge cases', () => {
  it('a check-in at 23:59 belongs to that day; at 00:00 it is a new day with no miss', () => {
    const at2359 = toDateKey(new Date(2026, 9, 17, 23, 59));
    const at0000 = toDateKey(new Date(2026, 9, 18, 0, 0));
    const checkins = [...run('2026-10-01', 16), at2359]; // 1–17 Oct
    expect(habit(checkins, at2359, '2026-10-01')).toMatchObject({ current: 17, checkedInToday: true });
    expect(habit(checkins, at0000, '2026-10-01')).toMatchObject({ current: 17, checkedInToday: false, misses: [] });
  });

  it('the miss is applied as soon as the next day starts', () => {
    const checkins = run('2026-10-01', 16); // through 16 Oct, nothing on 17 Oct
    expect(habit(checkins, '2026-10-17', '2026-10-01').current).toBe(16); // still 17 Oct: no miss yet
    expect(habit(checkins, '2026-10-18', '2026-10-01').current).toBe(0); // 17 Oct missed (no milestone)
  });
});

describe('timezone changes', () => {
  it('moving west behind an existing check-in never double counts that day', () => {
    // checked in on 18 Oct, then flew west and the device date is 17 Oct again
    const checkins = run('2026-10-01', 18);
    const s = habit(checkins, '2026-10-17', '2026-10-01');
    expect(s).toMatchObject({ current: 18, checkedInToday: true, effectiveToday: '2026-10-18' });
    expect(canCheckIn(s, '2026-10-17')).toBe(false);
    expect(canCheckIn(s, '2026-10-19')).toBe(true);
  });

  it('moving east across a skipped calendar date counts that date as missed (documented behaviour)', () => {
    const checkins = run('2026-10-01', 16); // ... 16 Oct, device jumps from 16 Oct straight to 18 Oct
    expect(habit(checkins, '2026-10-18', '2026-10-01').misses).toHaveLength(1);
  });

  it('local date keys keep working across DST changes', () => {
    const checkins = run('2026-03-20', 20); // spans the EU DST change on 29 Mar
    expect(habit(checkins, '2026-04-08', '2026-03-20').current).toBe(20);
  });
});

describe('helpers', () => {
  it('canCheckIn only when not done today and still active', () => {
    expect(canCheckIn(habit([], day(1)), day(1))).toBe(true);
    expect(canCheckIn(habit([day(1)], day(1)), day(1))).toBe(false);
  });

  it('newMilestone detects the milestone just reached (for the celebration)', () => {
    const before = habit(run(day(1), 29), day(30));
    const after = habit(run(day(1), 30), day(30));
    expect(newMilestone(before, after)).toEqual({ day: 30, date: day(30) });
    expect(newMilestone(after, after)).toBeNull();
  });

  it('unseenMisses + summarizeMisses build the "was 47 → now 30" notice', () => {
    const s = habit([...run(day(1), 47), ...run(day(49), 5)], day(60)); // miss 48 (47→30), climb to 35, miss 54 (35→30)
    expect(s.misses.map((m) => [m.from, m.to])).toEqual([[47, 30], [35, 30]]);
    expect(unseenMisses(s, day(50))).toEqual([{ date: day(54), from: 35, to: 30 }]);
    expect(summarizeMisses(unseenMisses(s, null))).toEqual({ date: day(54), from: 47, to: 30 });
    expect(summarizeMisses([])).toBeNull();
  });
});
