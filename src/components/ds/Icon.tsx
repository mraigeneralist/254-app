import type { ComponentType } from 'react';
import {
  Apple, ArrowRight, Award, BadgeCheck, Bath, Bed, Beer, Bell, BellOff, BellRing, Bike, BookOpen, Brain, Calendar,
  CalendarDays, Candy, ChartColumn, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Cigarette, CircleAlert,
  CircleCheck, Clock, CloudOff, Code, Coffee, Cookie, CornerDownLeft, Dog, Droplets, Dumbbell, Eye, EyeOff, Flag, Flame,
  Flower2, Footprints, Gamepad2, GlassWater, HandHeart, Heart, Hourglass, Info, Languages, Leaf, ListTodo, LoaderCircle,
  Lock, LogOut, Mail, MailCheck, Minus, Moon, Music, NotebookPen, Palette, Pause, PenLine, Pencil, PiggyBank, Pizza, Play,
  Plus, RefreshCw, RotateCcw, Salad, Settings, Share2, Shield, ShieldCheck, ShoppingCart, SlidersHorizontal, Smartphone,
  Sparkles, Sprout, Square, Sun, Timer, Trash2, TrendingUp, TriangleAlert, Trophy, Tv, User, WifiOff, Wine, X,
  type LucideProps,
} from 'lucide-react-native';
import { colors } from '@/theme';

// Lucide icon set (the design system's chosen set), addressed by the same kebab-case names the designs use.
const ICONS = {
  apple: Apple, 'arrow-right': ArrowRight, award: Award, 'badge-check': BadgeCheck, bath: Bath, bed: Bed, beer: Beer,
  bell: Bell, 'bell-off': BellOff, 'bell-ring': BellRing, bike: Bike, 'book-open': BookOpen, brain: Brain,
  calendar: Calendar, 'calendar-days': CalendarDays, candy: Candy, 'chart-column': ChartColumn, check: Check,
  'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'chevron-up': ChevronUp,
  cigarette: Cigarette, 'circle-alert': CircleAlert, 'circle-check': CircleCheck, clock: Clock, 'cloud-off': CloudOff,
  code: Code, coffee: Coffee, cookie: Cookie, 'corner-down-left': CornerDownLeft, dog: Dog, droplets: Droplets,
  dumbbell: Dumbbell, eye: Eye, 'eye-off': EyeOff, flag: Flag, flame: Flame, 'flower-2': Flower2, footprints: Footprints,
  'gamepad-2': Gamepad2, 'glass-water': GlassWater, 'hand-heart': HandHeart, heart: Heart, hourglass: Hourglass,
  info: Info, languages: Languages, leaf: Leaf, 'list-todo': ListTodo, 'loader-circle': LoaderCircle, lock: Lock,
  'log-out': LogOut, mail: Mail, 'mail-check': MailCheck, minus: Minus, moon: Moon, music: Music,
  'notebook-pen': NotebookPen, palette: Palette, pause: Pause, 'pen-line': PenLine, pencil: Pencil,
  'piggy-bank': PiggyBank, pizza: Pizza, play: Play, plus: Plus, 'refresh-cw': RefreshCw, 'rotate-ccw': RotateCcw,
  salad: Salad, settings: Settings, 'share-2': Share2, shield: Shield, 'shield-check': ShieldCheck,
  'shopping-cart': ShoppingCart, 'sliders-horizontal': SlidersHorizontal, smartphone: Smartphone, sparkles: Sparkles,
  sprout: Sprout, square: Square, sun: Sun, timer: Timer, 'trash-2': Trash2, 'trending-up': TrendingUp,
  'triangle-alert': TriangleAlert, trophy: Trophy, tv: Tv, user: User, 'wifi-off': WifiOff, wine: Wine, x: X,
} satisfies Record<string, ComponentType<LucideProps>>;

export type IconName = keyof typeof ICONS;

/** Icons offered when creating a habit to build / an addiction to break / a challenge. */
export const BUILD_ICONS: IconName[] = ['sprout', 'brain', 'book-open', 'glass-water', 'footprints', 'dumbbell', 'bike', 'moon', 'pen-line', 'leaf', 'heart', 'music', 'salad', 'bed', 'languages', 'code', 'piggy-bank', 'sparkles'];
export const BREAK_ICONS: IconName[] = ['shield', 'pizza', 'smartphone', 'cigarette', 'wine', 'beer', 'candy', 'cookie', 'coffee', 'tv', 'gamepad-2', 'shopping-cart'];
export const CHALLENGE_ICONS: IconName[] = ['trophy', 'book-open', 'pen-line', 'dumbbell', 'footprints', 'droplets', 'sun', 'candy', 'timer', 'palette'];

export const isIconName = (s: string): s is IconName => s in ICONS;
export const asIcon = (s: string | null | undefined, fallback: IconName = 'sprout'): IconName => (s && isIconName(s) ? s : fallback);

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 20, color = colors.textPrimary, strokeWidth = 2 }: Props) {
  const Cmp = ICONS[name] ?? ICONS.sprout;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
