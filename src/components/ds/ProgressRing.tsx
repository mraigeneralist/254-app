import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { duration, easing, font } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  label?: string | number;
  caption?: string;
  textColor: string;
  /** animate changes (default true) — the timer drives it every frame, so it turns this off */
  animated?: boolean;
};

/** components/data/ProgressRing.jsx — round-cap ring, label + caption in the middle. */
export function ProgressRing({ value, max = 100, size = 100, stroke = 8, color, track, label, caption, textColor, animated = true }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  const progress = useSharedValue(animated ? 0 : frac);

  useEffect(() => {
    progress.value = animated ? withTiming(frac, { duration: duration.slow, easing: easing.out }) : frac;
  }, [frac, animated, progress]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - progress.value) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {frac > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            animatedProps={props}
          />
        )}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[font(800, Math.round(size * 0.22), 1), { color: textColor }]}>{label ?? value}</Text>
        {caption ? (
          <Text style={[font(500, Math.max(10, Math.round(size * 0.11)), 1.3), { color: textColor, opacity: 0.85 }]}>{caption}</Text>
        ) : null}
      </View>
    </View>
  );
}
