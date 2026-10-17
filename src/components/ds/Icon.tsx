import type { ComponentType } from 'react';
import {
  ArrowRight, Award, BadgeCheck, Bell, BellRing, BookOpen, Brain, Calendar, CalendarDays, ChartColumn, Check,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleAlert, CircleCheck, Clock, CornerDownLeft, EyeOff, Flag,
  Flame, Flower2, Footprints, GlassWater, Info, ListTodo, LoaderCircle, Lock, LogOut, Mail, MailCheck, Moon,
  NotebookPen, Pause, PenLine, Pencil, Pizza, Play, Plus, RotateCcw, Settings, Share2, Shield, ShieldCheck,
  SlidersHorizontal, Smartphone, Sprout, Square, Sun, Trash2, TrendingUp, TriangleAlert, Trophy, User, WifiOff, X,
  type LucideProps,
} from 'lucide-react-native';
import { colors } from '@/theme';

// Lucide icon set (the design system's chosen set), addressed by the same kebab-case names the designs use.
const ICONS = {
  'arrow-right': ArrowRight, award: Award, 'badge-check': BadgeCheck, bell: Bell, 'bell-ring': BellRing,
  'book-open': BookOpen, brain: Brain, calendar: Calendar, 'calendar-days': CalendarDays, 'chart-column': ChartColumn,
  check: Check, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'chevron-up': ChevronUp, 'circle-alert': CircleAlert, 'circle-check': CircleCheck, clock: Clock,
  'corner-down-left': CornerDownLeft, 'eye-off': EyeOff, flag: Flag, flame: Flame, 'flower-2': Flower2,
  footprints: Footprints, 'glass-water': GlassWater, info: Info, 'list-todo': ListTodo, 'loader-circle': LoaderCircle,
  lock: Lock, 'log-out': LogOut, mail: Mail, 'mail-check': MailCheck, moon: Moon, 'notebook-pen': NotebookPen,
  pause: Pause, 'pen-line': PenLine, pencil: Pencil, pizza: Pizza, play: Play, plus: Plus, 'rotate-ccw': RotateCcw,
  settings: Settings, 'share-2': Share2, shield: Shield, 'shield-check': ShieldCheck,
  'sliders-horizontal': SlidersHorizontal, smartphone: Smartphone, sprout: Sprout, square: Square, sun: Sun,
  'trash-2': Trash2, 'trending-up': TrendingUp, 'triangle-alert': TriangleAlert, trophy: Trophy, user: User,
  'wifi-off': WifiOff, x: X,
} satisfies Record<string, ComponentType<LucideProps>>;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 20, color = colors.textPrimary, strokeWidth = 2 }: Props) {
  const Cmp = ICONS[name];
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
