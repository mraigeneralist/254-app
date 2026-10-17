import { Easing } from 'react-native-reanimated';
import { colors } from './colors';

// tokens/effects.css — RN `boxShadow` (New Architecture) accepts CSS box-shadow strings incl. `inset`.
export const shadow = {
  xs: '0px 1px 2px rgba(79,52,34,0.05)',
  sm: '0px 4px 12px rgba(79,52,34,0.05)',
  md: '0px 8px 24px rgba(79,52,34,0.08)',
  lg: '0px 16px 40px rgba(79,52,34,0.12)',
  glowGreen: '0px 10px 28px rgba(155,177,103,0.55)',
  glowPurple: '0px 14px 36px rgba(166,148,245,0.55)',
  glowOrange: '0px 12px 30px rgba(254,129,75,0.45)',
  tabBar: '0px -6px 24px rgba(79,52,34,0.07)',
} as const;

/** CSS `inset 0 0 0 <w>px <color>` hairline borders used across kit.jsx */
export const insetBorder = (width: number, color: string = colors.borderSubtle) => `inset 0px 0px 0px ${width}px ${color}`;
/** CSS `0 0 0 <w>px <color>` outer rings */
export const ring = (width: number, color: string) => `0px 0px 0px ${width}px ${color}`;

export const easing = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const duration = { fast: 120, base: 220, slow: 400 } as const;

export const pressScale = 0.96;
