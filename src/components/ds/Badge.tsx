import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, type ToneName } from '@/theme';
import { Icon, type IconName } from './Icon';

// components/core/Badge.jsx: [tint bg, dark fg, solid]
const T: Record<ToneName, [string, string, string]> = {
  green: [colors.green100, colors.green600, colors.green500],
  orange: [colors.orange100, colors.orange600, colors.orange500],
  purple: [colors.purple100, colors.purple600, colors.purple500],
  yellow: [colors.yellow100, colors.yellow600, colors.yellow500],
  brown: [colors.cream200, colors.brown800, colors.brown700],
};

type Props = {
  children: ReactNode;
  tone?: ToneName;
  variant?: 'soft' | 'solid' | 'plain';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ children, tone = 'green', variant = 'soft', icon, style }: Props) {
  const [bg, fg, solid] = T[tone];
  const v =
    variant === 'solid' ? { bg: solid, fg: colors.white, px: 10 }
    : variant === 'plain' ? { bg: 'transparent', fg: colors.textSecondary, px: 0 }
    : { bg, fg, px: 10 };
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderRadius: 999, backgroundColor: v.bg, paddingHorizontal: v.px },
        variant !== 'plain' && { height: 24 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={14} color={variant === 'plain' ? solid : v.fg} />}
      <Text style={[font(700, 11), { color: v.fg }]} numberOfLines={1}>{children}</Text>
    </View>
  );
}
