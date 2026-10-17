import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MonthCal, ymOf, type YearMonth } from '@/components/Calendar';
import { Icon } from '@/components/ds';
import { Fab } from '@/components/Fab';
import { EmptyState } from '@/components/Feedback';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { useTabBarHeight } from '@/components/TabBar';
import { TabTitle } from '@/components/TabTitle';
import { live, useData } from '@/data/store';
import type { DateKey } from '@/domain/dates';
import { useToday } from '@/hooks/useToday';
import { clockTime, longDateNoYear } from '@/lib/format';
import { colors, font, shadow, text } from '@/theme';

/** N01 Journal calendar · N07 Empty. */
export default function NoteScreen() {
  const router = useRouter();
  const today = useToday();
  const tabBar = useTabBarHeight();
  const rows = useData((s) => s.tables.notes);
  const notes = useMemo(() => live(rows), [rows]);
  const [selected, setSelected] = useState<DateKey>(today);
  const [ym, setYm] = useState<YearMonth>(ymOf(today));

  const dots = useMemo(() => Object.fromEntries(notes.map((n) => [n.date, colors.purple500])), [notes]);
  const entries = useMemo(() => notes.filter((n) => n.date === selected).sort((a, b) => a.created_at.localeCompare(b.created_at)), [notes, selected]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBar + 100 }} showsVerticalScrollIndicator={false}>
        <TabTitle
          title="Note To Self"
          sub={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="lock" size={13} color={colors.textSecondary} />
              <Text style={text.sm}>Private. Only you can read these.</Text>
            </View>
          }
        />
        <View style={{ marginTop: 16, marginHorizontal: 20, backgroundColor: colors.surfaceCard, borderRadius: 24, padding: 16, boxShadow: shadow.sm }}>
          <MonthCal ym={ym} onMonth={setYm} today={today} selected={selected} onSelect={setSelected} dots={dots} />
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[text.over, { marginTop: 18, marginBottom: 10, marginHorizontal: 4 }]}>{longDateNoYear(selected)}</Text>
          {entries.length === 0 ? (
            <View style={{ backgroundColor: colors.surfaceCard, borderRadius: 24 }}>
              <EmptyState
                icon="notebook-pen"
                tone="purple"
                pad={22}
                title={notes.length === 0 ? 'Nothing written yet' : 'No entries this day'}
                body={selected > today ? 'You can write about today or any past day.' : 'A line a day is enough. Tap + to write a note to self.'}
              />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {entries.map((n) => (
                <Pressable key={n.id} onPress={() => router.push(`/note/${n.id}`)} style={{ backgroundColor: colors.surfaceCard, borderRadius: 20, padding: 16, boxShadow: shadow.xs }}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Icon name="clock" size={12} color={colors.textSecondary} />
                    <Text style={text.cap}>{clockTime(n.created_at)}</Text>
                  </View>
                  <Text style={[font(700, 15, 1.4), { color: colors.textPrimary, marginTop: 6 }]} numberOfLines={1}>{n.title || n.body}</Text>
                  {n.title ? <Text style={[text.sm, { marginTop: 2 }]} numberOfLines={2}>{n.body}</Text> : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <Fab variant="fab-dark" label="New entry" onPress={() => router.push({ pathname: '/note/new', params: { date: selected > today ? today : selected } })} />
      <StatusBarScrim />
    </View>
  );
}
