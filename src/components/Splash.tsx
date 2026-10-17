import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { colors, font } from '@/theme';
import { Wordmark } from './Screen';

function Dot({ i }: { i: number }) {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withDelay(i * 180, withRepeat(withSequence(withTiming(1, { duration: 420 }), withTiming(0.25, { duration: 420 })), -1));
  }, [i, o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green300 }, s]} />;
}

/** O01 Splash — brown, big wordmark, tagline, loading dots. */
export function Splash({ caption = 'Build it. Break it. Keep it.' }: { caption?: string }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.brown800, alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <View style={{ alignItems: 'center', gap: 14 }}>
        <Wordmark size={96} color={colors.cream100} />
        <Text style={[font(600, 14), { color: colors.cream300 }]}>{caption}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 64, flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} i={i} />
        ))}
      </View>
    </View>
  );
}
