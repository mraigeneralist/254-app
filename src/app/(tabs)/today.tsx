import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge } from '@/components/ds';
import { Fab } from '@/components/Fab';
import { HabitCard, type HabitCardItem } from '@/components/HabitCard';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { TodayHeader, type TodaySegment } from '@/components/TodayHeader';
import type { HabitKind } from '@/theme';

// Static sample data from the design (kit.jsx HABITS / ADDICTIONS / CHALLENGES) — replaced by real data later.
const SAMPLE: Record<TodaySegment, HabitCardItem[]> = {
  Build: [
    { id: 'med', name: 'Meditate 20 min', day: 29, icon: 'brain' },
    { id: 'read', name: 'Read 20 pages', day: 112, icon: 'book-open' },
    { id: 'water', name: 'Drink water after waking up', day: 251, icon: 'glass-water' },
    { id: 'run', name: 'Run 1 km', day: 8, icon: 'footprints' },
    { id: 'brush', name: 'Brush before bed', day: 64, icon: 'moon' },
  ],
  Break: [
    { id: 'junk', name: 'No junk food', day: 92, icon: 'pizza' },
    { id: 'social', name: 'No social media after 10 pm', day: 17, icon: 'smartphone' },
  ],
  Challenges: [
    { id: 'read30', name: '30-day reading challenge', day: 19, total: 30, icon: 'book-open' },
    { id: 'write90', name: '90-day writing challenge', day: 41, total: 90, icon: 'pen-line' },
  ],
};
const KIND: Record<TodaySegment, HabitKind> = { Build: 'build', Break: 'break', Challenges: 'challenge' };

export default function TodayScreen() {
  const [segment, setSegment] = useState<TodaySegment>('Build');
  const [done, setDone] = useState<string[]>(['water']);
  const items = SAMPLE[segment];
  const buildDone = SAMPLE.Build.filter((h) => done.includes(h.id)).length;

  const toggle = (id: string, on: boolean) => {
    Haptics.impactAsync(on ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setDone((d) => (on ? [...d, id] : d.filter((x) => x !== id)));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 88 }} showsVerticalScrollIndicator={false}>
        <TodayHeader
          dateLabel="Saturday, 17 October 2026"
          name="Arjun Mehta"
          segment={segment}
          onSegment={setSegment}
          summary={
            <>
              <Badge tone="green" variant="plain" icon="circle-check">{`${buildDone} of ${SAMPLE.Build.length} done`}</Badge>
              <Badge tone="orange" variant="plain" icon="flame">Best: Day 251</Badge>
            </>
          }
        />
        <View style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}>
          {items.map((h) => {
            const isDone = done.includes(h.id);
            return (
              <HabitCard
                key={h.id}
                item={{ ...h, day: h.day + (isDone && h.id !== 'water' ? 1 : 0) }}
                kind={KIND[segment]}
                done={isDone}
                onCheckIn={() => toggle(h.id, true)}
                onUndo={() => toggle(h.id, false)}
              />
            );
          })}
        </View>
      </ScrollView>
      <Fab />
      <StatusBarScrim />
    </View>
  );
}
