import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icon, IconButton } from '@/components/ds';
import { addDays, weekdayMon0, type DateKey } from '@/domain/dates';
import { MILESTONES, nextMilestone } from '@/domain/milestones';
import { keyToDate, monthTitle } from '@/lib/format';
import { colors, font, insetBorder, text, tones, type ToneName } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');
export const monthKey = (y: number, m0: number, d: number): DateKey => `${y}-${pad(m0 + 1)}-${pad(d)}`;

export type YearMonth = { y: number; m: number };
export const ymOf = (k: DateKey): YearMonth => ({ y: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) - 1 });
export const shiftMonth = ({ y, m }: YearMonth, by: number): YearMonth => {
  const d = new Date(y, m + by, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
};

/** Small indicator dot (SVG so it is always perfectly round). */
export function Dot({ color, size = 6 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size}>
      {color ? <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} /> : null}
    </Svg>
  );
}

type MonthCalProps = {
  ym: YearMonth;
  today: DateKey;
  onMonth?: (ym: YearMonth) => void;
  marks?: Record<DateKey, 'done' | 'missed'>;
  dots?: Record<DateKey, string>;
  selected?: DateKey | null;
  onSelect?: (k: DateKey) => void;
  showTitle?: boolean;
  /** days after this can't be selected */
  maxDate?: DateKey;
};

/** kit.jsx MonthCal — Monday-first month grid, filled marks, colored dots, today ring, brown selection. */
export function MonthCal({ ym, today, onMonth, marks = {}, dots = {}, selected, onSelect, showTitle = true, maxDate }: MonthCalProps) {
  const first = monthKey(ym.y, ym.m, 1);
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const lead = weekdayMon0(first);
  const cells: (DateKey | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => monthKey(ym.y, ym.m, i + 1))];
  while (cells.length % 7) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  return (
    <View>
      {showTitle && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={text.t}>{monthTitle(ym.y, ym.m)}</Text>
          {onMonth && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <IconButton icon="chevron-left" size={32} variant="sunken" label="Previous month" onPress={() => onMonth(shiftMonth(ym, -1))} />
              <IconButton icon="chevron-right" size={32} variant="sunken" label="Next month" onPress={() => onMonth(shiftMonth(ym, 1))} />
            </View>
          )}
        </View>
      )}
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={[font(700, 11), { flex: 1, textAlign: 'center', color: colors.textTertiary, paddingBottom: 6 }]}>{d}</Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {row.map((k, i) => {
            if (!k) return <View key={i} style={{ flex: 1 }} />;
            const m = marks[k];
            const sel = k === selected;
            const fut = k > today;
            const disabled = !onSelect || (maxDate ? k > maxDate : false);
            const bg = sel ? colors.brown800 : m === 'done' ? colors.green500 : m === 'missed' ? colors.orange100 : 'transparent';
            const col = sel || m === 'done' ? colors.white : m === 'missed' ? colors.orange600 : fut ? colors.textTertiary : colors.textPrimary;
            return (
              <Pressable key={i} disabled={disabled} onPress={() => onSelect?.(k)} style={{ flex: 1, alignItems: 'center', gap: 2 }} accessibilityLabel={k}>
                <View style={{ width: 34, height: 34, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: bg, boxShadow: k === today && !sel ? insetBorder(1.5, colors.brown800) : undefined }}>
                  <Text style={[font(700, 13), { color: col }]}>{Number(k.slice(8))}</Text>
                </View>
                <Dot color={dots[k]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Mon–Sun strip for the week containing `selected` (screens-streaks-tasks-meditate.jsx WeekStrip). */
export function WeekStrip({ selected, today, dots, onSelect }: { selected: DateKey; today: DateKey; dots: Set<DateKey>; onSelect: (k: DateKey) => void }) {
  const monday = addDays(selected, -weekdayMon0(selected));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {days.map((k) => {
        const a = k === selected;
        const dot = dots.has(k);
        return (
          <Pressable
            key={k}
            onPress={() => onSelect(k)}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 999, backgroundColor: a ? colors.brown800 : colors.surfaceCard, boxShadow: a ? undefined : k === today ? insetBorder(1.5, colors.brown800) : '0px 1px 2px rgba(79,52,34,0.05)' }}
          >
            <Text style={[font(600, 11), { color: a ? colors.cream300 : colors.textTertiary }]}>{keyToDate(k).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
            <Text style={[font(800, 16), { color: a ? colors.white : colors.textPrimary }]}>{Number(k.slice(8))}</Text>
            <Dot color={dot ? (a ? colors.green300 : colors.green500) : undefined} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** kit.jsx MilestoneTrack — 8 milestone nodes on a line; reached = filled, next = outlined. */
export function MilestoneTrack({ day, tone = 'green' }: { day: number; tone?: ToneName }) {
  const t = tones[tone];
  const nx = nextMilestone(day);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ position: 'absolute', left: 16, right: 16, top: 15, height: 3, backgroundColor: colors.cream300, borderRadius: 2 }} />
      {MILESTONES.map((m) => {
        const got = day >= m;
        const nxt = m === nx && !got;
        return (
          <View key={m} style={{ alignItems: 'center', gap: 6, width: 34 }}>
            <View
              style={{
                width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                backgroundColor: got ? t.s : colors.surfaceCard,
                boxShadow: got ? undefined : nxt ? insetBorder(2, t.s) : insetBorder(1.5, colors.cream400),
              }}
            >
              {got ? <Icon name="check" size={16} color={colors.white} /> : <Icon name={m === 254 ? 'trophy' : 'flag'} size={14} color={nxt ? t.d : colors.brown300} />}
            </View>
            <Text style={[font(700, 11), { color: got || nxt ? colors.textPrimary : colors.textTertiary }]}>{m}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Small legend dot + label. */
export function LegendDot({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, boxShadow: border ? insetBorder(1, border) : undefined }} />
      <Text style={text.cap}>{label}</Text>
    </View>
  );
}
