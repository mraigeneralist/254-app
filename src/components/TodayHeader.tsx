import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon, IconButton, SegmentedControl } from '@/components/ds';
import { colors, shadow, text } from '@/theme';

export const TODAY_SEGMENTS = ['Build', 'Break', 'Challenges'] as const;
export type TodaySegment = (typeof TODAY_SEGMENTS)[number];

type Props = {
  dateLabel: string;
  name: string;
  summary: ReactNode;
  segment: TodaySegment;
  onSegment: (s: TodaySegment) => void;
  onBell?: () => void;
};

/** Today header panel: white card rounded only at the bottom (32), extending under the status bar. */
export function TodayHeader({ dateLabel, name, summary, segment, onSegment, onBell }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceCard, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 20, boxShadow: shadow.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="calendar" size={15} color={colors.textPrimary} />
          <Text style={[text.cap, { color: colors.textPrimary }]}>{dateLabel}</Text>
        </View>
        <IconButton icon="bell" size={40} onPress={onBell} label="Notifications" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, height: 48 }}>
        <Avatar name={name} size={48} />
        <View>
          <Text style={text.h2}>Hi, {name.split(' ')[0]}!</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>{summary}</View>
        </View>
      </View>
      <SegmentedControl options={TODAY_SEGMENTS} value={segment} onChange={onSegment} style={{ marginTop: 16 }} />
    </View>
  );
}
