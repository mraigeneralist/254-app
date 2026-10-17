import { View, type StyleProp, type ViewStyle } from 'react-native';
import { tones, type ToneName } from '@/theme';

type Props = { value: number; max: number; tone?: ToneName; style?: StyleProp<ViewStyle> };

export function ProgressBar({ value, max, tone = 'green', style }: Props) {
  const t = tones[tone];
  const pct = Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <View style={[{ height: 8, borderRadius: 999, backgroundColor: t.t, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: t.s }} />
    </View>
  );
}
