import { forwardRef, useEffect, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/ds';
import { colors, duration, easing, font, insetBorder, shadow, text } from '@/theme';

// ─── Field (kit.jsx Field) ──────────────────────────────────────────────────

type FieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: IconName;
  trailing?: ReactNode;
  error?: string | null;
  hint?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export const Field = forwardRef<ComponentRef<typeof TextInput>, FieldProps>(function Field({ label, icon, trailing, error, hint, multiline, height, style, onFocus, onBlur, value, ...input }, ref) {
  const [focus, setFocus] = useState(false);
  const border = error ? insetBorder(1.5, colors.orange500) : focus ? insetBorder(1.5, colors.green500) : insetBorder(1, colors.borderSubtle);
  return (
    <View style={style}>
      {label ? <Text style={[font(700, 12, 1.3), { color: colors.textPrimary, marginBottom: 8 }]}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: 10, minHeight: height ?? 52,
          paddingHorizontal: 16, paddingVertical: multiline ? 14 : 0, borderRadius: 16, backgroundColor: colors.surfaceCard, boxShadow: border,
        }}
      >
        {icon && <Icon name={icon} size={18} color={colors.brown400} />}
        <TextInput
          ref={ref}
          value={value}
          multiline={multiline}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.green500}
          cursorColor={colors.green500}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={[
            font(value ? 600 : 500, 15),
            { flex: 1, color: colors.textPrimary, paddingVertical: multiline ? 0 : 12, minHeight: multiline ? (height ?? 52) - 28 : undefined, textAlignVertical: multiline ? 'top' : 'center' },
          ]}
          {...input}
        />
        {trailing}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 8 }}>
          <Icon name="circle-alert" size={14} color={colors.orange600} />
          <Text style={[font(600, 12, 1.35), { color: colors.orange600, flex: 1 }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[text.cap, { marginTop: 8 }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

/** Eye toggle for password fields. */
export function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} hitSlop={12} accessibilityLabel={shown ? 'Hide password' : 'Show password'}>
      <Icon name={shown ? 'eye' : 'eye-off'} size={18} color={colors.brown400} />
    </Pressable>
  );
}

// ─── Toggle (kit.jsx Toggle) ────────────────────────────────────────────────

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  const x = useSharedValue(on ? 21 : 3);
  useEffect(() => {
    x.value = withTiming(on ? 21 : 3, { duration: duration.base, easing: easing.out });
  }, [on, x]);
  const knob = useAnimatedStyle(() => ({ left: x.value }));
  return (
    <Pressable
      onPress={() => onChange?.(!on)}
      disabled={disabled || !onChange}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      style={{ width: 46, height: 28, borderRadius: 999, backgroundColor: on ? colors.green500 : colors.cream400, opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={[{ position: 'absolute', top: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, boxShadow: shadow.xs }, knob]} />
    </Pressable>
  );
}

// ─── Chip (kit.jsx Chip) ────────────────────────────────────────────────────

export function Chip({ children, on, icon, onPress, style }: { children?: ReactNode; on?: boolean; icon?: IconName; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[
        {
          flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 999,
          backgroundColor: on ? colors.brown800 : colors.surfaceCard, boxShadow: on ? undefined : insetBorder(1, colors.borderSubtle),
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={14} color={on ? colors.cream0 : colors.textPrimary} />}
      {children != null && <Text style={[font(700, 13), { color: on ? colors.cream0 : colors.textPrimary }]} numberOfLines={1}>{children}</Text>}
    </Pressable>
  );
}

// ─── Row + Group (kit.jsx Row / Group) — settings-style lists ───────────────

type RowProps = {
  icon?: IconName;
  label: string;
  sub?: string;
  value?: string;
  toggle?: boolean;
  on?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  chevron?: boolean;
  last?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export function Row({ icon, label, sub, value, toggle, on, onToggle, danger, chevron = true, last, onPress, disabled }: RowProps) {
  return (
    <Pressable
      onPress={toggle ? () => onToggle?.(!on) : onPress}
      disabled={disabled || (!onPress && !toggle)}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.cream200, opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
      })}
    >
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: danger ? colors.orange100 : colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={danger ? colors.orange600 : colors.brown800} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[font(600, 15, 1.3), { color: danger ? colors.orange600 : colors.textPrimary }]}>{label}</Text>
        {sub ? <Text style={[text.cap, { marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {value ? <Text style={[text.sm, { fontFamily: font(600, 13).fontFamily }]} numberOfLines={1}>{value}</Text> : null}
      {toggle ? <Toggle on={!!on} onChange={onToggle} disabled={disabled} /> : chevron && (onPress || !toggle) ? <Icon name="chevron-right" size={18} color={colors.brown300} /> : null}
    </Pressable>
  );
}

export function Group({ title, children, style }: { title?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {title ? <Text style={[text.over, { marginHorizontal: 4, marginBottom: 10 }]}>{title}</Text> : null}
      <View style={{ backgroundColor: colors.surfaceCard, borderRadius: 24, paddingVertical: 2, paddingHorizontal: 16, boxShadow: shadow.xs }}>{children}</View>
    </View>
  );
}

// ─── ReminderRow (screens-today.jsx) ────────────────────────────────────────

export function ReminderRow({ label = 'Daily reminder', time, on, onToggle, onPickTime }: { label?: string; time: string; on: boolean; onToggle: (v: boolean) => void; onPickTime: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.surfaceCard, borderRadius: 16, boxShadow: insetBorder(1, colors.borderSubtle) }}>
      <Icon name="bell" size={18} color={colors.brown800} />
      <View style={{ flex: 1 }}>
        <Text style={text.t}>{label}</Text>
        <Text style={text.cap}>{on ? `${time} every day` : 'Off'}</Text>
      </View>
      {on && (
        <Pressable onPress={onPickTime} hitSlop={6} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surfaceSunken }}>
          <Text style={[font(700, 13), { color: colors.textPrimary }]}>{time}</Text>
        </Pressable>
      )}
      <Toggle on={on} onChange={onToggle} />
    </View>
  );
}

/** Tinted info box used in forms ("Editing doesn't change your count…"). */
export function InfoNote({ icon = 'info', tint, ink, children, style }: { icon?: IconName; tint: string; ink: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, backgroundColor: tint }, style]}>
      <Icon name={icon} size={18} color={ink} />
      <Text style={[font(600, 13, 1.4), { color: ink, flex: 1 }]}>{children}</Text>
    </View>
  );
}
