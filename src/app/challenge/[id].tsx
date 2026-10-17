import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { HistoryCard, StatTiles } from '@/components/DetailParts';
import { Badge, Button, IconButton, ProgressRing } from '@/components/ds';
import { Dialog, EmptyState } from '@/components/Feedback';
import { InfoNote } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { deleteChallenge, restartChallenge } from '@/data/actions';
import { useChallengeViews } from '@/data/selectors';
import { doChallengeCheckIn, doChallengeUndo } from '@/features/checkins';
import { useToday } from '@/hooks/useToday';
import { dayMonthYear, plural } from '@/lib/format';
import { showSnack } from '@/lib/ui';
import { colors, text, tones } from '@/theme';

/** C05 Challenge detail · C06 Delete. Failed challenges offer Restart. */
export default function ChallengeDetail() {
  const router = useRouter();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useChallengeViews(today).find((x) => x.challenge.id === id);
  const [confirm, setConfirm] = useState(false);

  if (!v) {
    return (
      <Screen header={<AppBar />}>
        <EmptyState icon="circle-alert" tone="orange" title="Challenge not found" body="It may have been deleted on another device." />
      </Screen>
    );
  }
  const { challenge: c, state: s } = v;
  const t = tones.yellow;
  const statusBadge =
    s.status === 'failed' ? <Badge tone="orange" icon="triangle-alert">{`Failed · ${dayMonthYear(s.failedDate!)}`}</Badge>
    : s.status === 'completed' ? <Badge tone="green" icon="badge-check">{`Completed · ${dayMonthYear(s.completedDate!)}`}</Badge>
    : <Badge tone="yellow" icon="trophy">Challenge</Badge>;

  const footer =
    s.status === 'active' ? (
      s.checkedInToday ? (
        <Button size="lg" fullWidth variant="secondary" iconLeft="rotate-ccw" onPress={() => doChallengeUndo(v, today)}>Done today · Undo</Button>
      ) : (
        <Button size="lg" fullWidth iconLeft="check" onPress={() => doChallengeCheckIn(v, today, router)}>Mark done</Button>
      )
    ) : s.status === 'failed' ? (
      <Button
        size="lg"
        fullWidth
        iconLeft="rotate-ccw"
        onPress={() => {
          const next = restartChallenge(c, today);
          router.replace(`/challenge/${next.id}`);
          showSnack({ icon: 'rotate-ccw', text: `${c.name} restarted · Day 1 starts today` });
        }}
      >
        Restart from Day 1
      </Button>
    ) : null;

  return (
    <Screen header={<AppBar right={<IconButton icon="trash-2" size={40} label="Delete" onPress={() => setConfirm(true)} />} />} footer={footer}>
      <View style={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 16 }}>
        {statusBadge}
        <Text style={[text.h1, { marginTop: 10 }]}>{c.name}</Text>
        {c.description ? <Text style={[text.body, { fontSize: 14, marginTop: 6 }]}>{c.description}</Text> : null}
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <ProgressRing value={s.day} max={s.durationDays} size={196} stroke={14} color={t.s} track={t.t} textColor={colors.textPrimary} label={s.day} caption={`of ${s.durationDays} days`} />
        </View>
        <StatTiles
          items={[
            ['Done', plural(s.day, 'day')],
            ['Started', dayMonthYear(c.start_date)],
            s.status === 'active' ? ['Days left', String(s.daysLeft)] : ['Ends', dayMonthYear(s.endDate)],
          ]}
        />
        <InfoNote style={{ marginTop: 14 }} tint={colors.yellow100} ink={colors.brown700}>
          Challenges have no milestone protection. Miss a day and the challenge fails — you can restart it from Day 1.
        </InfoNote>
        <HistoryCard checkins={v.checkins} start={c.start_date} today={today} finished={s.failedDate ?? s.completedDate ?? s.endDate} />
      </View>
      <Dialog
        visible={confirm}
        onClose={() => setConfirm(false)}
        icon="trash-2"
        danger
        title="Delete this challenge?"
        body={`“${c.name}” and its ${plural(s.day, 'day')} of progress will be removed.`}
        onConfirm={() => {
          setConfirm(false);
          deleteChallenge(c.id);
          router.back();
        }}
      />
    </Screen>
  );
}
