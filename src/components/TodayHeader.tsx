import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon, IconButton, SegmentedControl } from '@/components/ds';
import { colors, shadow, text } from '@/theme';
import { useTourTarget } from './Tour';

export const TODAY_SEGMENTS = ['Build', 'Break', 'Challenges'] as const;
export type TodaySegment = (typeof TODAY_SEGMENTS)[number];

type Props = {
  dateLabel: string;
  name: string;
  summary: ReactNode;
  segment: TodaySegment;
  onSegment: (s: TodaySegment) => void;
  onBell?: () => void;
  /** small status shown next to the date (sync state) */
  status?: ReactNode;
  avatarUri?: string | null;
};

/** Today header panel: white card rounded only at the bottom (32), under the status-bar strip. */
export function TodayHeader({ dateLabel, name, summary, segment, onSegment, onBell, status, avatarUri }: Props) {
  const insets = useSafeAreaInsets();
  const challengesRef = useTourTarget('segChallenges');
  const [segW, setSegW] = useState(0);
  return (
    <View style={{ backgroundColor: colors.surfaceCard, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 20, boxShadow: shadow.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 1 }}>
          <Icon name="calendar" size={15} color={colors.textPrimary} />
          <Text style={[text.cap, { color: colors.textPrimary }]} numberOfLines={1}>{dateLabel}</Text>
          {status}
        </View>
        <IconButton icon="bell" size={40} onPress={onBell} label="Notification settings" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, minHeight: 48 }}>
        <Avatar name={name || '?'} size={48} uri={avatarUri} />
        <View style={{ flex: 1 }}>
          <Text style={text.h2} numberOfLines={1}>{name ? `Hi, ${name.split(' ')[0]}!` : 'Hi there!'}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>{summary}</View>
        </View>
      </View>
      <View style={{ marginTop: 16 }} onLayout={(e) => setSegW(e.nativeEvent.layout.width)}>
        <SegmentedControl options={TODAY_SEGMENTS} value={segment} onChange={onSegment} />
        {segW > 0 && (
          <View ref={challengesRef} collapsable={false} pointerEvents="none" style={{ position: 'absolute', top: 3, bottom: 3, left: 3 + ((segW - 6) * 2) / 3, width: (segW - 6) / 3 }} />
        )}
      </View>
    </View>
  );
}
