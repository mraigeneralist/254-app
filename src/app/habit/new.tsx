import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ds';
import { InfoNote } from '@/components/Form';
import { emptyDraft, HabitFormFields, type HabitDraft } from '@/components/HabitForm';
import { AppBar, Screen } from '@/components/Screen';
import { createHabit } from '@/data/actions';
import { useToday } from '@/hooks/useToday';
import { showSnack } from '@/lib/ui';
import { colors } from '@/theme';

/** B07–B10 New habit · K04 New addiction to break. */
export default function NewHabit() {
  const router = useRouter();
  const today = useToday();
  const { kind: k } = useLocalSearchParams<{ kind?: string }>();
  const kind = k === 'break' ? 'break' : 'build';
  const [draft, setDraft] = useState<HabitDraft>(emptyDraft(kind));

  const save = () => {
    try {
      createHabit({ kind, name: draft.name, description: draft.description, icon: draft.icon, reminder_time: draft.reminderOn ? draft.reminderTime : null }, today);
      router.back();
    } catch {
      showSnack({ tone: 'error', icon: 'circle-alert', text: 'Couldn’t save, try again', action: 'Retry', onAction: save, bottom: 100 });
    }
  };

  return (
    <Screen header={<AppBar title={kind === 'build' ? 'New habit' : 'New addiction to break'} close />} footer={<Button size="lg" fullWidth disabled={!draft.name.trim()} onPress={save}>Save</Button>}>
      <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 18 }}>
        <HabitFormFields kind={kind} draft={draft} onChange={setDraft} autoFocus />
        {kind === 'break' && (
          <InfoNote icon="shield" tint={colors.orange100} ink={colors.orange700}>
            Each day you check in clean adds one day. Day 254 means it’s broken for good.
          </InfoNote>
        )}
      </View>
    </Screen>
  );
}
