import type { TextStyle } from 'react-native';
import { colors } from './colors';

// Urbanist (tokens/fonts.css). On Android each weight is its own font family.
export const fontFamily = {
  400: 'Urbanist_400Regular',
  500: 'Urbanist_500Medium',
  600: 'Urbanist_600SemiBold',
  700: 'Urbanist_700Bold',
  800: 'Urbanist_800ExtraBold',
  900: 'Urbanist_900Black',
} as const;

export type FontWeight = keyof typeof fontFamily;

/** CSS `font: <weight> <size>px/<lineHeight>` with letter-spacing in em, as used throughout kit.jsx */
export function font(weight: FontWeight, size: number, lineHeight?: number, letterSpacingEm = 0): TextStyle {
  return {
    fontFamily: fontFamily[weight],
    fontSize: size,
    ...(lineHeight ? { lineHeight: Math.round(size * lineHeight) } : null),
    ...(letterSpacingEm ? { letterSpacing: size * letterSpacingEm } : null),
  };
}

/** kit.jsx `tx` text presets */
export const text = {
  h1: { ...font(800, 28, 1.1, -0.02), color: colors.textPrimary },
  h2: { ...font(800, 22, 1.2, -0.01), color: colors.textPrimary },
  h3: { ...font(700, 17, 1.25), color: colors.textPrimary },
  t: { ...font(700, 15, 1.3), color: colors.textPrimary },
  body: { ...font(500, 15, 1.5), color: colors.textSecondary },
  sm: { ...font(500, 13, 1.45), color: colors.textSecondary },
  cap: { ...font(600, 12, 1.3), color: colors.textSecondary },
  over: { ...font(700, 11, 1, 0.08), textTransform: 'uppercase', color: colors.textTertiary },
  display: { ...font(800, 32, 1.1, -0.02), color: colors.textPrimary },
  metric: { ...font(800, 24, 1), color: colors.textPrimary },
} satisfies Record<string, TextStyle>;
