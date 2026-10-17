import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BREAK_ICONS, BUILD_ICONS, Icon, type IconName } from '@/components/ds';
import type { HabitKind } from '@/data/types';
import { time12 } from '@/lib/format';
import { colors, insetBorder, text, tones } from '@/theme';
import { Field, ReminderRow } from './Form';
import { TimePickerDialog } from './Pickers';

export type HabitDraft = { name: string; description: string; icon: IconName; reminderOn: boolean; reminderTime: string };

export const emptyDraft = (kind: HabitKind): HabitDraft => ({ name: '', description: '', icon: kind === 'build' ? 'sprout' : 'shield', reminderOn: false, reminderTime: kind === 'build' ? '07:00' : '21:00' });

type Props = { kind: HabitKind; draft: HabitDraft; onChange: (d: HabitDraft) => void; autoFocus?: boolean; nameLabel?: string; namePlaceholder?: string };

/** Shared fields for New habit / New addiction / Edit (B07, K04, B12) + the icon picker. */
export function HabitFormFields({ kind, draft, onChange, autoFocus, nameLabel = 'Name', namePlaceholder }: Props) {
  const [picker, setPicker] = useState(false);
  const set = (p: Partial<HabitDraft>) => onChange({ ...draft, ...p });
  const tone = tones[kind === 'build' ? 'green' : 'orange'];
  const icons = kind === 'build' ? BUILD_ICONS : BREAK_ICONS;
  return (
    <View style={{ gap: 18 }}>
      <Field label={nameLabel} value={draft.name} onChangeText={(name) => set({ name })} placeholder={namePlaceholder ?? (kind === 'build' ? 'e.g. Go to the gym' : 'e.g. No sugar in tea')} autoFocus={autoFocus} maxLength={120} returnKeyType="done" />
      <Field label="Description (optional)" value={draft.description} onChangeText={(description) => set({ description })} placeholder="Why does this matter to you?" multiline height={88} maxLength={500} />
      <View>
        <Text style={[text.t, { fontSize: 12, marginBottom: 8 }]}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} keyboardShouldPersistTaps="handled">
          {icons.map((ic) => {
            const on = ic === draft.icon;
            return (
              <Pressable key={ic} onPress={() => set({ icon: ic })} accessibilityLabel={`Icon ${ic}`} accessibilityState={{ selected: on }} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? tone.t : colors.surfaceCard, boxShadow: on ? insetBorder(2, tone.s) : insetBorder(1, colors.borderSubtle) }}>
                <Icon name={ic} size={20} color={on ? tone.d : colors.brown500} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ReminderRow label={kind === 'build' ? 'Daily reminder' : 'Daily check-in'} time={time12(draft.reminderTime)} on={draft.reminderOn} onToggle={(reminderOn) => set({ reminderOn })} onPickTime={() => setPicker(true)} />
      <TimePickerDialog visible={picker} value={draft.reminderTime} onCancel={() => setPicker(false)} onSet={(reminderTime) => { set({ reminderTime, reminderOn: true }); setPicker(false); }} />
    </View>
  );
}
