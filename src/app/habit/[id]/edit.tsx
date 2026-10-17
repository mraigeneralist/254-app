import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { asIcon, Button } from '@/components/ds';
import { InfoNote } from '@/components/Form';
import { HabitFormFields, type HabitDraft } from '@/components/HabitForm';
import { AppBar, Screen } from '@/components/Screen';
import { updateHabit } from '@/data/actions';
import { useHabitViews } from '@/data/selectors';
import { useToday } from '@/hooks/useToday';
import { colors } from '@/theme';

/** B12 Edit habit — name, description, icon, reminder. Never changes the count. */
export default function EditHabit() {
  const router = useRouter();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useHabitViews(today).find((x) => x.habit.id === id);
  const [draft, setDraft] = useState<HabitDraft | null>(() =>
    v
      ? {
          name: v.habit.name,
          description: v.habit.description,
          icon: asIcon(v.habit.icon, v.habit.kind === 'build' ? 'sprout' : 'shield'),
          reminderOn: !!v.habit.reminder_time,
          reminderTime: v.habit.reminder_time ?? (v.habit.kind === 'build' ? '07:00' : '21:00'),
        }
      : null,
  );
  if (!v || !draft) return <Screen header={<AppBar close />} />;

  const save = () => {
    updateHabit(v.habit.id, { name: draft.name.trim(), description: draft.description.trim(), icon: draft.icon, reminder_time: draft.reminderOn ? draft.reminderTime : null });
    router.back();
  };

  return (
    <Screen header={<AppBar title={v.habit.kind === 'build' ? 'Edit habit' : 'Edit addiction'} close />} footer={<Button size="lg" fullWidth disabled={!draft.name.trim()} onPress={save}>Save changes</Button>}>
      <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 18 }}>
        <HabitFormFields kind={v.habit.kind} draft={draft} onChange={setDraft} />
        <InfoNote tint={colors.green100} ink={colors.green700}>{`Editing doesn’t change your count. You’re on Day ${v.state.current}.`}</InfoNote>
      </View>
    </Screen>
  );
}
