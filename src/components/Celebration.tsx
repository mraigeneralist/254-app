import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, type IconName } from '@/components/ds';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { colors, easing, font, tones, type ToneName } from '@/theme';

type Props = {
  tone?: ToneName;
  icon: IconName;
  kicker: string;
  big: string;
  unit: string;
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
  second?: string;
  onSecond?: () => void;
};

/** Full-screen celebration (kit.jsx Celebration): concentric halos, big number, kicker pill, title, two actions. */
export function Celebration({ tone = 'green', icon, kicker, big, unit, title, body, cta, onCta, second, onSecond }: Props) {
  const insets = useSafeAreaInsets();
  const yellow = tone === 'yellow';
  useStatusBarStyle(yellow ? 'dark' : 'light');
  const ink = yellow ? colors.brown800 : colors.white;
  const pulse = useSharedValue(0.9);
  useEffect(() => {
    pulse.value = withDelay(300, withRepeat(withSequence(withTiming(1.04, { duration: 1400, easing: easing.out }), withTiming(0.98, { duration: 1400, easing: easing.out })), -1, true));
  }, [pulse]);
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: tones[tone].bg, paddingTop: insets.top }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <Animated.View entering={ZoomIn.duration(500).easing(easing.spring)} style={[{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }, halo]}>
          {[240, 188, 136].map((s, i) => (
            <View key={s} style={{ position: 'absolute', width: s, height: s, borderRadius: s / 2, backgroundColor: `rgba(255,255,255,${0.12 + i * 0.08})` }} />
          ))}
          <View style={{ alignItems: 'center' }}>
            <Text style={[font(900, 80, 1, -0.04), { color: ink, includeFontPadding: false }]}>{big}</Text>
            <Text style={[font(700, 14), { color: ink, marginTop: 4 }]}>{unit}</Text>
          </View>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(250).duration(400)} style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' }}>
            <Icon name={icon} size={14} color={ink} />
            <Text style={[font(700, 12), { color: ink }]} numberOfLines={1}>{kicker}</Text>
          </View>
          <Text style={[font(800, 30, 1.1, -0.02), { color: ink, marginTop: 14, textAlign: 'center' }]}>{title}</Text>
          <Text style={[font(500, 15, 1.5), { color: ink, marginTop: 10, textAlign: 'center' }]}>{body}</Text>
        </Animated.View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(36, insets.bottom + 16), gap: 6 }}>
        <Button size="lg" fullWidth bg={colors.white} color={colors.brown800} onPress={onCta}>{cta}</Button>
        {second ? (
          <Button size="lg" variant="ghost" fullWidth color={ink} onPress={onSecond}>{second}</Button>
        ) : null}
      </View>
    </View>
  );
}
