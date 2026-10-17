import type { Ref } from 'react';
import type { ViewRef } from './Tour';
import { Pressable, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Badge, Button, Icon, type IconName } from '@/components/ds';
import { GOAL_DAYS, nextMilestone } from '@/domain/milestones';
import { colors, easing, font, kindTone, ring, shadow, text, tones, type HabitKind } from '@/theme';
import { ProgressBar } from './ProgressBar';

export type HabitCardItem = { id: string; name: string; day: number; icon: IconName; total?: number };

type Props = {
  item: HabitCardItem;
  kind?: HabitKind;
  done?: boolean;
  /** highlighted ring (tour / flows) */
  ring?: boolean;
  onPress?: () => void;
  onCheckIn?: () => void;
  onUndo?: () => void;
  /** tour spotlight target for the check-in control */
  actionRef?: Ref<ViewRef>;
};

export function HabitCard({ item, kind = 'build', done, ring: ringed, onPress, onCheckIn, onUndo, actionRef }: Props) {
  const tn = kindTone[kind];
  const t = tones[tn];
  const total = kind === 'challenge' ? (item.total ?? 30) : GOAL_DAYS;
  const dayTxt = kind === 'break' ? `Day ${item.day} clean` : `Day ${item.day} of ${total}`;
  const sub = kind === 'challenge' ? `${total - item.day} days left` : `Next: ${nextMilestone(item.day)} days`;

  return (
    <View style={{ backgroundColor: colors.surfaceCard, borderRadius: 24, padding: 16, boxShadow: ringed ? `${ring(3, colors.green300)}, ${shadow.md}` : shadow.sm }}>
      <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={`${item.name}, ${dayTxt}`}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.t, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={item.icon} size={20} color={t.d} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={text.t} numberOfLines={1}>{item.name}</Text>
          <Text style={[text.cap, { marginTop: 3 }]}>{dayTxt}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.brown300} />
      </Pressable>

      <ProgressBar value={item.day} max={total} tone={tn} style={{ marginVertical: 14 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
          <Icon name={kind === 'challenge' ? 'calendar-days' : 'flag'} size={14} color={colors.textSecondary} />
          <Text style={text.cap} numberOfLines={1}>{sub}</Text>
        </View>
        <View ref={actionRef} collapsable={false}>
          {done ? (
            <Animated.View entering={ZoomIn.duration(260).easing(easing.spring)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Badge tone={tn} icon="check">{kind === 'break' ? 'Clean today' : 'Done today'}</Badge>
              <Pressable onPress={onUndo} hitSlop={12} accessibilityRole="button" accessibilityLabel="Undo today's check-in">
                <Text style={[font(700, 12), { color: colors.textSecondary, textDecorationLine: 'underline' }]}>Undo</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Button size="sm" onPress={onCheckIn}>{kind === 'break' ? 'I stayed clean today' : 'Mark done'}</Button>
          )}
        </View>
      </View>
    </View>
  );
}
