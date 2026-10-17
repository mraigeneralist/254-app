import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font } from '@/theme';

type Datum = { value: number; tone?: 'positive' | 'negative' };

type Props = {
  /** values are percentages 0–100 of the bar height */
  data: Datum[];
  height?: number;
  gap?: number;
  start?: string;
  end?: string;
  style?: StyleProp<ViewStyle>;
};

/** components/data/BarChart.jsx — pill tracks (tint) with saturated pill fills; min fill 10%. */
export function BarChart({ data, height = 140, gap = 8, start, end, style }: Props) {
  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', gap, alignItems: 'stretch', height }}>
        {data.map((d, i) => {
          const neg = d.tone === 'negative';
          const pct = d.value <= 0 ? 0 : Math.max(10, Math.min(100, d.value));
          return (
            <View key={i} style={{ flex: 1, justifyContent: 'flex-end', borderRadius: 999, backgroundColor: neg ? colors.orange100 : colors.green100, overflow: 'hidden' }}>
              {pct > 0 && <View style={{ width: '100%', height: `${pct}%`, borderRadius: 999, backgroundColor: neg ? colors.orange500 : colors.green500 }} />}
            </View>
          );
        })}
      </View>
      {(start || end) && (
        <View style={{ marginTop: 14 }}>
          <View style={{ height: 2, backgroundColor: colors.borderSubtle, marginHorizontal: 4 }}>
            <View style={{ position: 'absolute', left: -3, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brown300 }} />
            <View style={{ position: 'absolute', right: -3, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brown300 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={[font(600, 11), { color: colors.textPrimary }]}>{start}</Text>
            <Text style={[font(600, 11), { color: colors.textPrimary }]}>{end}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
