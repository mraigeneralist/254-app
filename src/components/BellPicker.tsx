import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ds';
import { BELLS, playBell, stopBellPreview, type BellId } from '@/features/bells';
import { colors, font, insetBorder, text } from '@/theme';
import { Overlay } from './Feedback';

type Props = { visible: boolean; value: BellId; onClose: () => void; onChange: (id: BellId) => void };

/** Bottom sheet to choose the meditation end bell, with a ▶ preview for each sound. */
export function BellPicker({ visible, value, onClose, onChange }: Props) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!visible) stopBellPreview();
  }, [visible]);

  return (
    <Overlay visible={visible} onClose={onClose} align="bottom">
      <View style={{ backgroundColor: colors.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14, paddingHorizontal: 24, paddingBottom: Math.max(28, insets.bottom + 12) }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cream400, alignSelf: 'center', marginBottom: 18 }} />
        <Text style={text.h2}>Bell sound</Text>
        <Text style={[text.sm, { marginTop: 4 }]}>Rings at the end of your session until you tap Stop.</Text>
        <View style={{ gap: 8, marginTop: 16 }}>
          {BELLS.map((b) => {
            const on = b.id === value;
            return (
              <Pressable
                key={b.id}
                onPress={() => {
                  onChange(b.id);
                  playBell(b.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: on ? colors.green100 : colors.surfaceCard, boxShadow: on ? insetBorder(2, colors.green500) : insetBorder(1, colors.borderSubtle) }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.green500 : colors.surfaceCard, boxShadow: on ? undefined : insetBorder(2, colors.brown300) }}>
                  {on && <Icon name="check" size={14} color={colors.white} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={text.t}>{b.label}</Text>
                  <Text style={text.cap}>{b.description}</Text>
                </View>
                <Pressable onPress={() => playBell(b.id)} hitSlop={10} accessibilityLabel={`Preview ${b.label}`} style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSunken }}>
                  <Icon name="play" size={16} color={colors.brown800} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={onClose} style={{ alignSelf: 'center', paddingVertical: 14, marginTop: 6 }} hitSlop={8}>
          <Text style={[font(700, 15), { color: colors.textSecondary }]}>Done</Text>
        </Pressable>
      </View>
    </Overlay>
  );
}
