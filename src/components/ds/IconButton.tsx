import { type StyleProp, type ViewStyle } from 'react-native';
import { colors, insetBorder, shadow } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

export type IconButtonVariant = 'outline' | 'soft' | 'sunken' | 'dark' | 'fab' | 'fab-dark' | 'ghost';

const V: Record<IconButtonVariant, { bg: string; fg: string; boxShadow?: string }> = {
  outline: { bg: 'transparent', fg: colors.textPrimary, boxShadow: insetBorder(1.5, colors.brown800) },
  soft: { bg: colors.surfaceCard, fg: colors.textPrimary, boxShadow: insetBorder(1, colors.borderSubtle) },
  sunken: { bg: colors.surfaceSunken, fg: colors.textPrimary },
  dark: { bg: colors.brown800, fg: colors.cream0 },
  fab: { bg: colors.green500, fg: colors.cream0, boxShadow: shadow.glowGreen },
  'fab-dark': { bg: colors.brown800, fg: colors.cream0, boxShadow: shadow.lg },
  ghost: { bg: 'transparent', fg: colors.textSecondary },
};

type Props = {
  icon: IconName;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: number;
  label?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, onPress, variant = 'soft', size = 44, label, color, style }: Props) {
  const v = V[variant];
  return (
    <PressableScale
      spring
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: v.bg },
        v.boxShadow ? { boxShadow: v.boxShadow } : null,
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.44)} color={color ?? v.fg} />
    </PressableScale>
  );
}
