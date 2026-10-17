import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font } from '@/theme';

export function SectionHeader({ title, right, style }: { title: string; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
      <Text style={[font(700, 17, 1.25), { color: colors.textPrimary }]}>{title}</Text>
      {right}
    </View>
  );
}
