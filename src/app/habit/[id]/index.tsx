import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { MilestoneTrack } from '@/components/Calendar';
import { HistoryCard, StatTiles } from '@/components/DetailParts';
import { Badge, Button, Card, IconButton, ProgressRing } from '@/components/ds';
import { Dialog, EmptyState } from '@/components/Feedback';
import { Group, Row } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { deleteHabit } from '@/data/actions';
import { useHabitViews } from '@/data/selectors';
import { GOAL_DAYS, nextMilestone } from '@/domain/milestones';
import { doHabitCheckIn, doHabitUndo } from '@/features/checkins';
import { useToday } from '@/hooks/useToday';
import { dayMonthYear, plural, time12 } from '@/lib/format';
import { showSnack } from '@/lib/ui';
import { colors, kindTone, text, tones } from '@/theme';

/** B11 Habit detail · K05 Addiction detail · P04 Built/Broken history (read-only). */
export default function HabitDetail() {
  const router = useRouter();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useHabitViews(today).find((x) => x.habit.id === id);
  const [confirm, setConfirm] = useState(false);

  if (!v) {
    return (
      <Screen header={<AppBar />}>
        <EmptyState icon="circle-alert" tone="orange" title="Habit not found" body="It may have been deleted on another device." />
      </Screen>
    );
  }

  const { habit: h, state: s } = v;
  const kind = h.kind;
  const tn = kindTone[kind];
  const t = tones[tn];
  const done = !!s.completedDate;

  return (
    <Screen
      header={
        <AppBar
          right={
            !done && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <IconButton icon="pencil" size={40} label="Edit" onPress={() => router.push(`/habit/${h.id}/edit`)} />
                <IconButton icon="trash-2" size={40} label="Delete" onPress={() => setConfirm(true)} />
              </View>
            )
          }
        />
      }
      footer={
        !done &&
        (s.checkedInToday ? (
          <Button size="lg" fullWidth variant="secondary" iconLeft="rotate-ccw" onPress={() => doHabitUndo(v, today)}>
            {`${kind === 'break' ? 'Clean today' : 'Done today'} · Undo`}
          </Button>
        ) : (
          <Button size="lg" fullWidth variant={kind === 'build' ? 'accent' : 'primary'} iconLeft="check" onPress={() => doHabitCheckIn(v, today, router)}>
            {kind === 'break' ? 'I stayed clean today' : 'Mark done'}
          </Button>
        ))
      }
    >
      <View style={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Badge tone={tn} icon={kind === 'break' ? 'shield' : 'sprout'}>{done ? (kind === 'build' ? 'Built · read only' : 'Broken · read only') : kind === 'break' ? 'Breaking' : 'Building'}</Badge>
        <Text style={[text.h1, { marginTop: 10 }]}>{h.name}</Text>
        {h.description ? <Text style={[text.body, { fontSize: 14, marginTop: 6 }]}>{h.description}</Text> : null}
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <ProgressRing value={s.current} max={GOAL_DAYS} size={196} stroke={14} color={t.s} track={t.t} textColor={colors.textPrimary} label={s.current} caption={kind === 'break' ? 'days clean' : `of ${GOAL_DAYS} days`} />
        </View>
        <StatTiles
          items={[
            ['Longest', plural(s.best, 'day')],
            ['Started', dayMonthYear(h.start_date)],
            done ? ['Finished', dayMonthYear(s.completedDate!)] : ['Next', `${nextMilestone(s.current)} days`],
          ]}
        />
        <Card title="Milestones" style={{ marginTop: 14 }}>
          <MilestoneTrack day={s.current} tone={tn} />
          {s.checkpoint > 0 && !done && <Text style={[text.cap, { marginTop: 14 }]}>{`Checkpoint saved: Day ${s.checkpoint}. A missed day won’t drop you below it.`}</Text>}
        </Card>
        <HistoryCard checkins={v.checkins} start={h.start_date} today={today} finished={s.completedDate} doneLabel={kind === 'break' ? 'Clean' : 'Done'} />
        {!done && (
          <Group style={{ marginTop: 14 }}>
            <Row icon="bell" label="Reminder" value={h.reminder_time ? time12(h.reminder_time) : 'Off'} last onPress={() => router.push(`/habit/${h.id}/edit`)} />
          </Group>
        )}
      </View>
      <Dialog
        visible={confirm}
        onClose={() => setConfirm(false)}
        icon="trash-2"
        danger
        title={`Delete “${h.name}”?`}
        body={kind === 'break' ? `Your ${plural(s.current, 'clean day')} and their history will be lost. This can’t be undone.` : `Your ${s.current}-day streak and its history will be lost. This can’t be undone.`}
        onConfirm={() => {
          setConfirm(false);
          deleteHabit(h.id);
          router.back();
          showSnack({ icon: 'trash-2', text: `${h.name} deleted` });
        }}
      />
    </Screen>
  );
}
