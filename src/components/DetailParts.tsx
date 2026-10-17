import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components/ds';
import { addDays, minKey, type DateKey } from '@/domain/dates';
import { colors, font, shadow, text } from '@/theme';
import { LegendDot, MonthCal, ymOf, type YearMonth } from './Calendar';

/** Three stat tiles under the ring (Longest / Started / Next). */
export function StatTiles({ items }: { items: [string, string][] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
      {items.map(([l, v]) => (
        <View key={l} style={{ flex: 1, backgroundColor: colors.surfaceCard, borderRadius: 18, padding: 12, boxShadow: shadow.xs }}>
          <Text style={text.cap}>{l}</Text>
          <Text style={[font(800, 15, 1.2), { color: colors.textPrimary, marginTop: 4 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

/** Done / missed marks for a check-in history between `start` and `end` (inclusive, end = yesterday or finish). */
export function useHistoryMarks(checkins: DateKey[], start: DateKey, end: DateKey) {
  return useMemo(() => {
    const marks: Record<DateKey, 'done' | 'missed'> = {};
    const done = new Set(checkins);
    for (const d of checkins) marks[d] = 'done';
    for (let d = start; d <= end; d = addDays(d, 1)) if (!done.has(d)) marks[d] = 'missed';
    return marks;
  }, [checkins, start, end]);
}

/** Calendar card with check-in history + legend. */
export function HistoryCard({ checkins, start, today, finished, doneLabel = 'Done' }: { checkins: DateKey[]; start: DateKey; today: DateKey; finished?: DateKey | null; doneLabel?: string }) {
  const end = finished ? minKey(finished, addDays(today, -1)) : addDays(today, -1);
  const marks = useHistoryMarks(checkins, start, end);
  const [ym, setYm] = useState<YearMonth>(ymOf(finished ?? today));
  return (
    <Card style={{ marginTop: 14 }}>
      <MonthCal ym={ym} onMonth={setYm} today={today} marks={marks} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
        <LegendDot color={colors.green500} label={doneLabel} />
        <LegendDot color={colors.orange100} border={colors.orange300} label="Missed" />
      </View>
    </Card>
  );
}
