import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, font, insetBorder, shadow } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const V: Record<ButtonVariant, { bg: string; fg: string; boxShadow?: string }> = {
  primary: { bg: colors.brown800, fg: colors.cream0 },
  accent: { bg: colors.green500, fg: colors.cream0, boxShadow: shadow.glowGreen },
  secondary: { bg: colors.surfaceSunken, fg: colors.textPrimary },
  outline: { bg: 'transparent', fg: colors.textPrimary, boxShadow: insetBorder(1, colors.borderStrong) },
  ghost: { bg: 'transparent', fg: colors.textPrimary },
};
const S: Record<ButtonSize, { height: number; px: number; fontSize: number; gap: number; icon: number }> = {
  sm: { height: 32, px: 14, fontSize: 13, gap: 6, icon: 16 },
  md: { height: 44, px: 20, fontSize: 15, gap: 8, icon: 18 },
  lg: { height: 56, px: 28, fontSize: 17, gap: 10, icon: 20 },
};

type Props = {
  children: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  /** overrides, mirroring the inline `style` overrides used in the designs */
  bg?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({ children, onPress, variant = 'primary', size = 'md', iconLeft, iconRight, fullWidth, disabled, bg, color, style, textStyle }: Props) {
  const v = V[variant];
  const s = S[size];
  const fg = color ?? v.fg;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.gap,
          height: s.height, paddingHorizontal: s.px, borderRadius: 999,
          backgroundColor: bg ?? v.bg, opacity: disabled ? 0.4 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        v.boxShadow && !disabled ? { boxShadow: v.boxShadow } : null,
        style,
      ]}
    >
      {iconLeft && <Icon name={iconLeft} size={s.icon} color={fg} />}
      <Text style={[font(700, s.fontSize), { color: fg }, textStyle]} numberOfLines={1}>{children}</Text>
      {iconRight && <Icon name={iconRight} size={s.icon} color={fg} />}
    </PressableScale>
  );
}
