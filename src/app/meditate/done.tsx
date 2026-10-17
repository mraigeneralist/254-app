import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, ProgressRing } from '@/components/ds';
import { Screen } from '@/components/Screen';
import { live, useData } from '@/data/store';
import { addDays, weekdayMon0 } from '@/domain/dates';
import { useToday } from '@/hooks/useToday';
import { colors, text } from '@/theme';

/** M06 Session complete. */
export default function SessionDone() {
  const router = useRouter();
  const today = useToday();
  const { min = '0', at, early } = useLocalSearchParams<{ min: string; at?: string; early?: string }>();
  const rows = useData((s) => s.tables.meditation_sessions);
  const { week, count } = useMemo(() => {
    const all = live(rows);
    const ws = addDays(today, -weekdayMon0(today));
    return { week: all.filter((s) => s.date >= ws).reduce((n, s) => n + s.actual_minutes, 0), count: all.length };
  }, [rows, today]);
  const when = at ? new Date(Number(at)) : new Date();

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button size="lg" fullWidth onPress={() => router.dismissTo('/meditate')}>Done</Button>
          <Button size="lg" variant="ghost" fullWidth iconLeft="notebook-pen" onPress={() => router.replace('/note/new')}>Write a Note To Self</Button>
        </>
      }
      contentStyle={{ alignItems: 'center', justifyContent: 'center', padding: 28 }}
    >
      <ProgressRing value={100} max={100} size={180} stroke={12} color={colors.green500} track={colors.green100} textColor={colors.textPrimary} label={min} caption={min === '1' ? 'minute' : 'minutes'} />
      <Text style={[text.h1, { marginTop: 28, textAlign: 'center' }]}>{`Session complete — ${min} min`}</Text>
      <Text style={[text.body, { fontSize: 14, marginTop: 8 }]}>{`${format(when, 'EEEE, d MMMM')} · ${format(when, 'h:mm a').toLowerCase()}${early ? ' · ended early' : ''}`}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
        <Badge icon="calendar">{`${week} min this week`}</Badge>
        <Badge tone="purple" icon="flower-2">{`${count} ${count === 1 ? 'session' : 'sessions'}`}</Badge>
      </View>
    </Screen>
  );
}
