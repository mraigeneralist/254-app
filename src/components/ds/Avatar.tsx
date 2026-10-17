import { Text, View } from 'react-native';
import { colors, font, ring } from '@/theme';

type Props = { name?: string; size?: number; ringed?: boolean };

export function Avatar({ name = '', size = 56, ringed = true }: Props) {
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.taupe300,
        boxShadow: ringed ? `${ring(3, colors.surfaceCard)}, ${ring(4, colors.borderSubtle)}` : undefined,
      }}
    >
      <Text style={[font(800, Math.round(size * 0.36)), { color: colors.brown800 }]}>{initials}</Text>
    </View>
  );
}
