import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ds';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { colors, font, text } from '@/theme';

type ScreenProps = {
  children?: ReactNode;
  /** fixed header above the scroll area (usually <AppBar/>) */
  header?: ReactNode;
  /** pinned at the bottom, lifted above the keyboard (kit.jsx BottomCTA) */
  footer?: ReactNode;
  scroll?: boolean;
  bg?: string;
  contentStyle?: StyleProp<ViewStyle>;
  /** content draws under the status bar (full-bleed screens) */
  edgeToEdge?: boolean;
};

/** Stack screen frame: safe-area top, optional header, scrolling body, keyboard-aware footer. */
export function Screen({ children, header, footer, scroll = true, bg = colors.surfacePage, contentStyle, edgeToEdge }: ScreenProps) {
  const insets = useSafeAreaInsets();
  useStatusBarStyle(bg === colors.brown800 ? 'light' : 'dark');
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ paddingBottom: 24 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flex: 1, paddingTop: edgeToEdge ? 0 : insets.top }}>
        {header}
        {body}
        {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: Math.max(30, insets.bottom + 14), gap: 10 }}>{footer}</View> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

type AppBarProps = { title?: string; sub?: string; close?: boolean; right?: ReactNode; onBack?: () => void };

/** kit.jsx AppBar: outlined back/close circle, title, right actions. */
export function AppBar({ title, sub, close, right, onBack }: AppBarProps) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 8, paddingHorizontal: 20 }}>
      <IconButton icon={close ? 'x' : 'chevron-left'} variant="outline" size={40} label={close ? 'Close' : 'Back'} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? <Text style={[font(800, 18, 1.2), { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text> : null}
        {sub ? <Text style={[text.cap, { marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** The "254" wordmark — Urbanist Black with tight tracking. */
export function Wordmark({ size = 32, color = colors.brown800 }: { size?: number; color?: string }) {
  return <Text style={[font(900, size, 1, -0.04), { color, includeFontPadding: false }]}>254</Text>;
}
