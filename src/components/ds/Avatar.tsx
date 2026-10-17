import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { colors, font, ring } from '@/theme';

type Props = { name?: string; size?: number; ringed?: boolean; uri?: string | null };

/** components/core/Avatar.jsx — photo if available, otherwise initials on taupe; white + hairline ring. */
export function Avatar({ name = '', size = 56, ringed = true, uri }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.taupe300,
        boxShadow: ringed ? `${ring(3, colors.surfaceCard)}, ${ring(4, colors.borderSubtle)}` : undefined,
      }}
    >
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={[font(800, Math.round(size * 0.36)), { color: colors.brown800 }]}>{initials}</Text>
      )}
    </View>
  );
}
