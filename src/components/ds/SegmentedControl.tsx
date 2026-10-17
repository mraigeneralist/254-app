import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, insetBorder } from '@/theme';

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange?: (v: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({ options, value, onChange, style }: Props<T>) {
  return (
    <View
      style={[
        { flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: colors.surfacePage, boxShadow: insetBorder(1, colors.borderStrong) },
        style,
      ]}
    >
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange?.(o)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1, height: 34, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
              backgroundColor: active ? colors.brown800 : 'transparent',
            }}
          >
            <Text style={[font(600, 13), { color: active ? colors.cream0 : colors.textPrimary }]} numberOfLines={1}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
