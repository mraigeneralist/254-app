import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Icon, SectionHeader } from '@/components/ds';
import { Banner, EmptyState } from '@/components/Feedback';
import { BellPicker } from '@/components/BellPicker';
import { MinutePickerSheet } from '@/components/Pickers';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { useTabBarHeight } from '@/components/TabBar';
import { TabTitle } from '@/components/TabTitle';
import { updateSettings } from '@/data/actions';
import { useSettings } from '@/data/selectors';
import { live, useData } from '@/data/store';
import { addDays, weekdayMon0 } from '@/domain/dates';
import { bellById } from '@/features/bells';
import { remainingMs, startTimer, useTimer } from '@/features/meditation';
import { requestPermission, usePermission } from '@/features/notifications';
import { useToday } from '@/hooks/useToday';
import { clockTime, num, shortDate } from '@/lib/format';
import { colors, font, shadow, text } from '@/theme';

const PRESETS = ['5', '10', '15', 'Custom'] as const;

export default function MeditateScreen() {
  const router = useRouter();
  const today = useToday();
  const tabBar = useTabBarHeight();
  const rows = useData((s) => s.tables.meditation_sessions);
  const timer = useTimer((s) => s.timer);
  const permission = usePermission((s) => s.status);
  const [sel, setSel] = useState<(typeof PRESETS)[number]>('10');
  const [customMin, setCustomMin] = useState(25);
  const [sheet, setSheet] = useState(false);
  const [bellSheet, setBellSheet] = useState(false);
  const bell = bellById(useSettings().meditationSound);
  const minutes = sel === 'Custom' ? customMin : Number(sel);

  const sessions = useMemo(() => live(rows).sort((a, b) => b.started_at.localeCompare(a.started_at)), [rows]);
  const weekStart = addDays(today, -weekdayMon0(today));
  const weekMin = sessions.filter((s) => s.date >= weekStart).reduce((n, s) => n + s.actual_minutes, 0);
  const totalMin = sessions.reduce((n, s) => n + s.actual_minutes, 0);

  const start = async () => {
    if (permission === 'undetermined') await requestPermission().catch(() => undefined);
    await startTimer(minutes, bell.id);
    router.push('/meditate/timer');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBar + 40 }} showsVerticalScrollIndicator={false}>
        <TabTitle title="Meditate" sub="Sit, breathe, and let the timer do the counting." />
        <View style={{ paddingTop: 18, paddingHorizontal: 20 }}>
          {timer && (
            <Pressable onPress={() => router.push('/meditate/timer')} style={{ marginBottom: 14 }}>
              <Banner icon="timer" text={`Session in progress · ${Math.ceil(remainingMs(timer) / 60000)} min left — tap to return`} />
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PRESETS.map((m) => {
              const a = m === sel;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setSel(m);
                    if (m === 'Custom') setSheet(true);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: a }}
                  style={{ flex: 1, height: 84, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: a ? colors.brown800 : colors.surfaceCard, boxShadow: a ? shadow.md : shadow.xs }}
                >
                  {m === 'Custom' ? (
                    a ? <Text style={[font(800, 26, 1), { color: colors.white }]}>{customMin}</Text> : <Icon name="sliders-horizontal" size={22} color={colors.textPrimary} />
                  ) : (
                    <Text style={[font(800, 26, 1), { color: a ? colors.white : colors.textPrimary }]}>{m}</Text>
                  )}
                  <Text style={[font(600, 11), { color: a ? colors.cream300 : colors.textSecondary }]}>{m === 'Custom' ? (a ? 'min · custom' : 'Custom') : 'min'}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button variant="accent" size="lg" fullWidth iconLeft="play" style={{ marginTop: 16 }} onPress={start} disabled={!!timer}>
            {`Start · ${minutes} min`}
          </Button>
          <Pressable onPress={() => setBellSheet(true)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surfaceCard, boxShadow: shadow.xs }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell-ring" size={18} color={colors.green600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={text.t}>Bell sound</Text>
              <Text style={text.cap}>{`${bell.label} · rings until you tap Stop`}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.brown300} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            {[
              [num(weekMin), 'min this week'],
              [num(sessions.length), 'sessions'],
              [num(totalMin), 'min total'],
            ].map(([v, l]) => (
              <View key={l} style={{ flex: 1, backgroundColor: colors.surfaceCard, borderRadius: 18, padding: 12, boxShadow: shadow.xs }}>
                <Text style={[font(800, 20), { color: colors.textPrimary }]}>{v}</Text>
                <Text style={text.cap}>{l}</Text>
              </View>
            ))}
          </View>
          <SectionHeader title="Session history" style={{ marginTop: 22, marginBottom: 10 }} />
          {sessions.length === 0 ? (
            <View style={{ backgroundColor: colors.surfaceCard, borderRadius: 24, boxShadow: shadow.xs }}>
              <EmptyState icon="flower-2" pad={24} title="No sessions yet" body="Your first sit is the hardest. Try 5 minutes — your sessions will show up here." />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {sessions.slice(0, 20).map((s) => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.surfaceCard, borderRadius: 18, boxShadow: shadow.xs }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="flower-2" size={18} color={colors.green600} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={text.t}>{s.date === today ? 'Today' : shortDate(s.date)}</Text>
                    <Text style={text.cap}>{clockTime(s.started_at)}{s.actual_minutes < s.planned_minutes ? ` · ended early (of ${s.planned_minutes})` : ''}</Text>
                  </View>
                  <Text style={[font(800, 15), { color: colors.textPrimary }]}>{`${s.actual_minutes} min`}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <StatusBarScrim />
      <BellPicker visible={bellSheet} value={bell.id} onClose={() => setBellSheet(false)} onChange={(id) => updateSettings({ meditationSound: id })} />
      <MinutePickerSheet
        visible={sheet}
        value={customMin}
        onClose={() => setSheet(false)}
        onSet={(m) => {
          setCustomMin(m);
          setSheet(false);
        }}
      />
    </View>
  );
}
