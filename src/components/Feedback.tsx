import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, Text, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, type IconName } from '@/components/ds';
import { hideSnack, useUi } from '@/lib/ui';
import { colors, font, insetBorder, ring, shadow, text, tones, type ToneName } from '@/theme';

// ─── Dialog (kit.jsx Dialog) ────────────────────────────────────────────────

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  icon?: IconName;
  tone?: ToneName;
  over?: string;
  title: string;
  body?: ReactNode;
  confirm?: string;
  cancel?: string | null;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  busy?: boolean;
  children?: ReactNode;
};

export function Dialog({ visible, onClose, icon, tone = 'orange', over, title, body, confirm = 'Delete', cancel = 'Cancel', danger, onConfirm, onCancel, busy, children }: DialogProps) {
  const t = tones[tone];
  return (
    <Overlay visible={visible} onClose={onClose}>
      <View style={{ width: '100%', backgroundColor: colors.surfaceCard, borderRadius: 28, padding: 24, boxShadow: shadow.lg }}>
        {icon && (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.t, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name={icon} size={26} color={t.d} />
          </View>
        )}
        {over ? <Text style={[text.over, { marginBottom: 8 }]}>{over}</Text> : null}
        <Text style={text.h2}>{title}</Text>
        {body ? typeof body === 'string' ? <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 8 }]}>{body}</Text> : <View style={{ marginTop: 8 }}>{body}</View> : null}
        {children}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          {cancel ? (
            <Button variant="secondary" style={{ flex: 1, paddingHorizontal: 12 }} onPress={onCancel ?? onClose}>
              {cancel}
            </Button>
          ) : null}
          <Button style={{ flex: 1, paddingHorizontal: 12 }} bg={danger ? colors.orange600 : undefined} onPress={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirm}
          </Button>
        </View>
      </View>
    </Overlay>
  );
}

/** Scrim + centered (or bottom) content in a modal layer that covers the status and tab bars. */
export function Overlay({ visible, onClose, children, align = 'center' }: { visible: boolean; onClose: () => void; children: ReactNode; align?: 'center' | 'bottom' }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: align === 'center' ? 'center' : 'flex-end', padding: align === 'center' ? 24 : 0 }} onPress={onClose}>
        <Pressable onPress={() => undefined} style={{ width: '100%' }}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Snack (kit.jsx Snack) — one global host in the root layout ─────────────

export function SnackHost() {
  const snack = useUi((s) => s.snack);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!snack) return;
    const t = setTimeout(hideSnack, snack.duration ?? 4000);
    return () => clearTimeout(t);
  }, [snack]);
  if (!snack) return null;
  const err = snack.tone === 'error';
  const accent = err ? colors.orange300 : colors.green300;
  return (
    <Animated.View
      key={snack.key}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={{
        position: 'absolute', left: 16, right: 16, bottom: snack.bottom ?? 104 + Math.max(0, insets.bottom - 12), zIndex: 60,
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 16, backgroundColor: colors.brown800, boxShadow: shadow.lg,
      }}
    >
      {snack.icon && <Icon name={snack.icon} size={18} color={accent} />}
      <Text style={[font(600, 14, 1.35), { flex: 1, color: colors.cream100 }]}>{snack.text}</Text>
      {snack.action ? (
        <Pressable
          hitSlop={12}
          onPress={() => {
            snack.onAction?.();
            hideSnack();
          }}
        >
          <Text style={[font(800, 14), { color: accent }]}>{snack.action}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

// ─── Banner (kit.jsx Banner) ────────────────────────────────────────────────

export function Banner({ icon = 'wifi-off', text: label, style }: { icon?: IconName; text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.yellow100, boxShadow: insetBorder(1, colors.yellow300) }, style]}>
      <Icon name={icon} size={18} color={colors.brown800} />
      <Text style={[font(600, 13, 1.35), { color: colors.brown800, flex: 1 }]}>{label}</Text>
    </View>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

type EmptyProps = { icon: IconName; tone?: ToneName; title: string; body: ReactNode; cta?: string; ctaIcon?: IconName; onCta?: () => void; pad?: number };

export function EmptyState({ icon, tone = 'green', title, body, cta, ctaIcon = 'plus', onCta, pad = 32 }: EmptyProps) {
  const t = tones[tone];
  return (
    <View style={{ alignItems: 'center', paddingVertical: pad, paddingHorizontal: 16 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.t, alignItems: 'center', justifyContent: 'center', boxShadow: ring(12, 'rgba(255,255,255,0.6)') }}>
        <Icon name={icon} size={40} color={t.d} />
      </View>
      <Text style={[text.h2, { marginTop: 24, textAlign: 'center' }]}>{title}</Text>
      {typeof body === 'string' ? <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 270, textAlign: 'center' }]}>{body}</Text> : <View style={{ marginTop: 8, maxWidth: 270 }}>{body}</View>}
      {cta ? (
        <Button iconLeft={ctaIcon} style={{ marginTop: 20, alignSelf: 'center' }} onPress={onCta}>
          {cta}
        </Button>
      ) : null}
    </View>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

export function Skel({ w = '100%', h = 14, r = 8, style }: { w?: DimensionValue; h?: number; r?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.cream200 }, style]} />;
}
