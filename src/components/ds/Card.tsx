import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, shadow } from '@/theme';

type Props = { title?: string; right?: ReactNode; padding?: number; children?: ReactNode; style?: StyleProp<ViewStyle> };

/** components/data/Card.jsx — white, radius 24, whisper shadow; optional title row. */
export function Card({ title, right, padding = 16, children, style }: Props) {
  return (
    <View style={[{ backgroundColor: colors.surfaceCard, borderRadius: 24, padding, boxShadow: shadow.sm }, style]}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={[font(700, 15, 1.2), { color: colors.textPrimary }]}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}
