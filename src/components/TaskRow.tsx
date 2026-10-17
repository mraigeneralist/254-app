import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '@/components/ds';
import { colors, font, insetBorder, shadow, text } from '@/theme';

type Props = {
  title: string;
  time?: string;
  date?: string;
  done?: boolean;
  overdue?: boolean;
  bell?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** kit.jsx TaskRow — round check, title (struck through when done), optional date/time line. */
export function TaskRow({ title, time, date, done, overdue, bell, onToggle, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surfaceCard, borderRadius: 20, boxShadow: shadow.xs }, style]}>
      <Pressable
        onPress={onToggle}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!done }}
        accessibilityLabel={done ? `Mark ${title} not done` : `Complete ${title}`}
        style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.green500 : colors.surfaceCard, boxShadow: done ? undefined : insetBorder(2, overdue ? colors.orange500 : colors.brown300) }}
      >
        {done && <Icon name="check" size={14} color={colors.white} />}
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[font(600, 15, 1.3), { color: done ? colors.textTertiary : colors.textPrimary, textDecorationLine: done ? 'line-through' : 'none' }]}>{title}</Text>
        {(time || date) && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 3, alignItems: 'center' }}>
            {date ? <Text style={[text.cap, { color: overdue ? colors.orange600 : colors.textSecondary }]}>{date}</Text> : null}
            {time ? (
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Icon name={bell ? 'bell' : 'clock'} size={12} color={overdue ? colors.orange600 : colors.textSecondary} />
                <Text style={[text.cap, { color: overdue ? colors.orange600 : colors.textSecondary }]}>{time}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}
