import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, SegmentedControl, type IconName } from '@/components/ds';
import { Chip } from '@/components/Form';
import { emptyDraft, HabitFormFields, type HabitDraft } from '@/components/HabitForm';
import { Screen } from '@/components/Screen';
import { createHabit } from '@/data/actions';
import { useHabitViews } from '@/data/selectors';
import { useToday } from '@/hooks/useToday';
import { text } from '@/theme';

const POPULAR: Record<'build' | 'break', [string, IconName][]> = {
  build: [['Meditate 20 min', 'brain'], ['Read 20 pages', 'book-open'], ['Run 1 km', 'footprints'], ['Drink water after waking up', 'glass-water'], ['Go to the gym', 'dumbbell']],
  break: [['No junk food', 'pizza'], ['No social media after 10 pm', 'smartphone'], ['No smoking', 'cigarette'], ['No sugar in tea', 'coffee'], ['No alcohol', 'wine']],
};

/** O07 / O08 — create at least one habit before continuing. */
export default function FirstHabit() {
  const router = useRouter();
  const today = useToday();
  const existing = useHabitViews(today);
  const [kind, setKind] = useState<'build' | 'break'>('build');
  const [draft, setDraft] = useState<HabitDraft>(emptyDraft('build'));
  const hasHabit = existing.length > 0;
  const canContinue = draft.name.trim().length > 0 || hasHabit;

  const onContinue = () => {
    if (draft.name.trim()) {
      createHabit({ kind, name: draft.name, description: draft.description, icon: draft.icon, reminder_time: draft.reminderOn ? draft.reminderTime : null }, today);
    }
    router.push('/notifications');
  };

  return (
    <Screen
      footer={
        <>
          {!canContinue && <Text style={[text.cap, { textAlign: 'center' }]}>Add a habit name to continue</Text>}
          <Button size="lg" fullWidth disabled={!canContinue} onPress={onContinue}>Continue</Button>
        </>
      }
    >
      <View style={{ paddingTop: 24, paddingHorizontal: 24 }}>
        <Badge icon="sprout">Last step</Badge>
        <Text style={[text.h1, { marginTop: 14 }]}>Create your first habit</Text>
        <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 8 }]}>Pick something small you can do every day. You need at least one habit to continue.</Text>
        <SegmentedControl
          options={['Build a habit', 'Break a habit'] as const}
          value={kind === 'build' ? 'Build a habit' : 'Break a habit'}
          onChange={(v) => {
            const k = v === 'Build a habit' ? 'build' : 'break';
            setKind(k);
            setDraft({ ...emptyDraft(k), name: draft.name, description: draft.description, reminderOn: draft.reminderOn });
          }}
          style={{ marginTop: 20 }}
        />
        <View style={{ marginTop: 20 }}>
          <HabitFormFields kind={kind} draft={draft} onChange={setDraft} nameLabel="Habit name" namePlaceholder={kind === 'build' ? 'e.g. Read 20 pages' : 'e.g. No junk food'} />
        </View>
        <Text style={[text.over, { marginTop: 24, marginBottom: 10 }]}>Popular</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {POPULAR[kind].map(([p, ic]) => {
            const on = draft.name === p;
            return (
              <Chip key={p} on={on} icon={on ? 'check' : 'plus'} onPress={() => setDraft({ ...draft, name: p, icon: ic })}>
                {p}
              </Chip>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
