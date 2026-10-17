// Cream Design System — color tokens (tokens/colors.css)
export const palette = {
  cream0: '#FFFFFF',
  cream50: '#FBF9F7',
  cream100: '#F7F4F2',
  cream200: '#F1EDEA',
  cream300: '#E8E1DC',
  cream400: '#D6CCC5',

  brown900: '#372315',
  brown800: '#4F3422',
  brown700: '#5E4535',
  brown600: '#736B66',
  brown500: '#928A84',
  brown400: '#ACA39D',
  brown300: '#C9C1BB',

  green100: '#EEF2E4',
  green200: '#DCE5C5',
  green300: '#C2D19E',
  green500: '#9BB167',
  green600: '#7D944D',
  green700: '#5A6B38',

  orange100: '#FFEEE5',
  orange200: '#FFD6C2',
  orange300: '#FFB592',
  orange500: '#FE814B',
  orange600: '#E8652C',
  orange700: '#B44A1C',

  purple100: '#EFEBFE',
  purple200: '#DCD4FC',
  purple300: '#C4B8F9',
  purple500: '#A694F5',
  purple600: '#8B77EC',
  purple700: '#6450C8',

  yellow100: '#FFF6E0',
  yellow300: '#FFE09A',
  yellow500: '#FFCE5C',
  yellow600: '#EDB43A',

  taupe300: '#DCCBBE',
  taupe500: '#C0A794',
  taupe600: '#A68C78',

  white: '#FFFFFF',
} as const;

export const colors = {
  ...palette,
  surfacePage: palette.cream100,
  surfaceCard: palette.cream0,
  surfaceSunken: palette.cream200,
  surfaceInverse: palette.brown800,
  textPrimary: palette.brown800,
  textSecondary: palette.brown600,
  textTertiary: palette.brown400,
  textInverse: palette.cream0,
  borderSubtle: palette.cream300,
  borderStrong: palette.brown300,
  accentPrimary: palette.green500,
  accentPrimarySoft: palette.green100,
  positive: palette.green500,
  negative: palette.orange500,
  highlight: palette.purple500,
  scrim: 'rgba(55,35,21,0.5)',
  coachScrim: 'rgba(55,35,21,0.72)',
} as const;

export type ToneName = 'green' | 'orange' | 'yellow' | 'purple' | 'brown';

/** kit.jsx TONE: s = solid/stroke, t = tint, d = dark ink, bg = celebration background */
export const tones: Record<ToneName, { s: string; t: string; d: string; bg: string }> = {
  green: { s: palette.green500, t: palette.green100, d: palette.green600, bg: palette.green600 },
  orange: { s: palette.orange500, t: palette.orange100, d: palette.orange600, bg: palette.orange600 },
  yellow: { s: palette.yellow500, t: palette.yellow100, d: palette.brown700, bg: palette.yellow500 },
  purple: { s: palette.purple500, t: palette.purple100, d: palette.purple600, bg: palette.purple600 },
  brown: { s: palette.brown800, t: palette.cream200, d: palette.brown800, bg: palette.brown800 },
};

export type HabitKind = 'build' | 'break' | 'challenge';
export const kindTone: Record<HabitKind, ToneName> = { build: 'green', break: 'orange', challenge: 'yellow' };
