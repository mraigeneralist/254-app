import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { duration, easing, pressScale } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** easing for the press-in; IconButton uses the spring curve */
  spring?: boolean;
};

/** Design-system press feedback: scale to .96 (effects.css --press-scale). */
export function PressableScale({ style, children, disabled, spring, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cfg = { duration: duration.fast, easing: spring ? easing.spring : easing.out };
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) scale.value = withTiming(pressScale, cfg);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, cfg);
        onPressOut?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}
