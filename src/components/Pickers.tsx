import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon } from '@/components/ds';
import type { DateKey } from '@/domain/dates';
import { time12 } from '@/lib/format';
import { colors, font, insetBorder, text } from '@/theme';
import { MonthCal, ymOf, type YearMonth } from './Calendar';
import { Overlay } from './Feedback';
import { Chip } from './Form';

const pad = (n: number) => String(n).padStart(2, '0');

// ─── Time picker (B09) ──────────────────────────────────────────────────────

type TimeProps = { visible: boolean; value: string; title?: string; presets?: string[]; onCancel: () => void; onSet: (hhmm: string) => void };

export function TimePickerDialog({ visible, value, title = 'Reminder time', presets = ['06:00', '07:00', '21:00'], onCancel, onSet }: TimeProps) {
  const [h24, setH24] = useState(7);
  const [m, setM] = useState(0);
  const [seg, setSeg] = useState<'h' | 'm'>('h');

  useEffect(() => {
    if (!visible) return;
    const [h, mm] = (value || '07:00').split(':').map(Number);
    setH24(h);
    setM(mm);
    setSeg('h');
  }, [visible, value]);

  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const bump = (dir: 1 | -1) => {
    if (seg === 'h') setH24((h) => (h + dir + 24) % 24);
    else setM((x) => (x + dir * 5 + 60) % 60);
  };

  const Seg = ({ v, which }: { v: string; which: 'h' | 'm' }) => {
    const on = seg === which;
    return (
      <Pressable
        onPress={() => setSeg(which)}
        style={{ width: 88, height: 76, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.green100 : colors.surfaceSunken, boxShadow: on ? insetBorder(2, colors.green500) : undefined }}
      >
        <Text style={[font(800, 44), { color: colors.textPrimary }]}>{v}</Text>
      </Pressable>
    );
  };

  return (
    <Overlay visible={visible} onClose={onCancel}>
      <View style={{ width: '100%', backgroundColor: colors.surfaceCard, borderRadius: 28, padding: 24 }}>
        <Text style={text.over}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <Seg v={pad(h12)} which="h" />
          <Text style={[font(800, 40), { color: colors.textPrimary }]}>:</Text>
          <Seg v={pad(m)} which="m" />
          <View style={{ gap: 6, marginLeft: 'auto' }}>
            <Chip on={!pm} onPress={() => pm && setH24(h24 - 12)}>AM</Chip>
            <Chip on={pm} onPress={() => !pm && setH24(h24 + 12)}>PM</Chip>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable onPress={() => bump(-1)} style={stepBtn} accessibilityLabel="Decrease">
            <Icon name="minus" size={18} />
          </Pressable>
          <Pressable onPress={() => bump(1)} style={stepBtn} accessibilityLabel="Increase">
            <Icon name="plus" size={18} />
          </Pressable>
          <Text style={[text.cap, { alignSelf: 'center', marginLeft: 4 }]}>{seg === 'h' ? 'Adjust hour' : 'Adjust minutes (5-min steps)'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          {presets.map((p) => (
            <Chip key={p} onPress={() => onSet(p)}>{time12(p)}</Chip>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" style={{ flex: 1 }} onPress={onCancel}>Cancel</Button>
          <Button style={{ flex: 1 }} onPress={() => onSet(`${pad(h24)}:${pad(m)}`)}>Set</Button>
        </View>
      </View>
    </Overlay>
  );
}

const stepBtn = { width: 44, height: 36, borderRadius: 999, backgroundColor: colors.surfaceSunken, alignItems: 'center' as const, justifyContent: 'center' as const };

// ─── Date picker ────────────────────────────────────────────────────────────

type DateProps = { visible: boolean; value: DateKey; today: DateKey; title?: string; maxDate?: DateKey; onCancel: () => void; onSet: (k: DateKey) => void };

export function DatePickerDialog({ visible, value, today, title = 'Pick a date', maxDate, onCancel, onSet }: DateProps) {
  const [sel, setSel] = useState(value);
  const [ym, setYm] = useState<YearMonth>(ymOf(value));
  useEffect(() => {
    if (visible) {
      setSel(value);
      setYm(ymOf(value));
    }
  }, [visible, value]);
  return (
    <Overlay visible={visible} onClose={onCancel}>
      <View style={{ width: '100%', backgroundColor: colors.surfaceCard, borderRadius: 28, padding: 20 }}>
        <Text style={[text.over, { marginBottom: 14 }]}>{title}</Text>
        <MonthCal ym={ym} onMonth={setYm} today={today} selected={sel} onSelect={setSel} maxDate={maxDate} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button variant="secondary" style={{ flex: 1 }} onPress={onCancel}>Cancel</Button>
          <Button style={{ flex: 1 }} onPress={() => onSet(sel)}>Set</Button>
        </View>
      </View>
    </Overlay>
  );
}

// ─── Minutes wheel (M02 Custom length) ──────────────────────────────────────

const ITEM = 52;
const MINUTES = Array.from({ length: 180 }, (_, i) => i + 1);

type MinuteProps = { visible: boolean; value: number; onClose: () => void; onSet: (min: number) => void };

export function MinutePickerSheet({ visible, value, onClose, onSet }: MinuteProps) {
  const insets = useSafeAreaInsets();
  const [cur, setCur] = useState(value);
  const list = useRef<FlatList<number>>(null);

  useEffect(() => {
    if (visible) setCur(value);
  }, [visible, value]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM);
    const v = MINUTES[Math.max(0, Math.min(MINUTES.length - 1, i))];
    if (v !== cur) setCur(v);
  };

  return (
    <Overlay visible={visible} onClose={onClose} align="bottom">
      <View style={{ backgroundColor: colors.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14, paddingHorizontal: 24, paddingBottom: Math.max(34, insets.bottom + 16) }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cream400, alignSelf: 'center', marginBottom: 18 }} />
        <Text style={text.h2}>Custom length</Text>
        <View style={{ height: ITEM * 5, marginVertical: 18 }}>
          <View style={{ position: 'absolute', top: ITEM * 2, left: 0, right: 0, height: ITEM, borderRadius: 18, backgroundColor: colors.green100 }} />
          <FlatList
            ref={list}
            data={MINUTES}
            keyExtractor={(n) => String(n)}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM}
            decelerationRate="fast"
            getItemLayout={(_, i) => ({ length: ITEM, offset: ITEM * i, index: i })}
            initialScrollIndex={Math.max(0, value - 1)}
            contentContainerStyle={{ paddingVertical: ITEM * 2 }}
            onScroll={onScroll}
            scrollEventThrottle={32}
            renderItem={({ item }) => {
              const d = Math.abs(item - cur);
              const size = d === 0 ? 40 : d === 1 ? 30 : 24;
              return (
                <Pressable onPress={() => list.current?.scrollToOffset({ offset: (item - 1) * ITEM, animated: true })} style={{ height: ITEM, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: d === 0 ? 1 : d === 1 ? 0.5 : 0.25 }}>
                  <Text style={[font(800, size), { color: colors.textPrimary }]}>{item}</Text>
                  {d === 0 && <Text style={[font(700, 15), { color: colors.textSecondary }]}>min</Text>}
                </Pressable>
              );
            }}
          />
        </View>
        <Button size="lg" fullWidth onPress={() => onSet(cur)}>{`Set ${cur} min`}</Button>
      </View>
    </Overlay>
  );
}
