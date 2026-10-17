import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Icon } from '@/components/ds';
import { saveNote } from '@/data/actions';
import type { Note } from '@/data/types';
import type { DateKey } from '@/domain/dates';
import { useToday } from '@/hooks/useToday';
import { mediumDate } from '@/lib/format';
import { showSnack } from '@/lib/ui';
import { colors, font } from '@/theme';
import { DatePickerDialog } from './Pickers';
import { AppBar, Screen } from './Screen';

type Draft = { date: DateKey; title: string; body: string };
const draftKey = (id?: string) => `254:noteDraft:${id ?? 'new'}`;

/** N02 New entry / N03 Writing / N04 Save failed. Autosaves a draft on every change. */
export function NoteEditor({ note, initialDate }: { note?: Note; initialDate?: DateKey }) {
  const router = useRouter();
  const today = useToday();
  const [d, setD] = useState<Draft>({ date: note?.date ?? initialDate ?? today, title: note?.title ?? '', body: note?.body ?? '' });
  const [picker, setPicker] = useState(false);
  const loaded = useRef(false);
  const saved = useRef(false);
  const key = draftKey(note?.id);

  // restore an unsaved draft (e.g. the app was closed mid-sentence)
  useEffect(() => {
    void AsyncStorage.getItem(key).then((raw) => {
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        if (draft.body !== (note?.body ?? '') || draft.title !== (note?.title ?? '')) {
          setD(draft);
          showSnack({ icon: 'notebook-pen', text: 'Unsaved draft restored', bottom: 40 });
        }
      }
      loaded.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // autosave the draft while typing
  useEffect(() => {
    if (!loaded.current || saved.current) return;
    const t = setTimeout(() => {
      const unchanged = d.body === (note?.body ?? '') && d.title === (note?.title ?? '') && d.date === (note?.date ?? d.date);
      void (unchanged || (!d.body && !d.title) ? AsyncStorage.removeItem(key) : AsyncStorage.setItem(key, JSON.stringify(d)));
    }, 400);
    return () => clearTimeout(t);
  }, [d, key, note]);

  const save = async () => {
    try {
      const n = saveNote({ id: note?.id, date: d.date, title: d.title, body: d.body });
      saved.current = true;
      await AsyncStorage.removeItem(key);
      if (note) router.back();
      else router.replace(`/note/${n.id}`);
    } catch {
      showSnack({ tone: 'error', icon: 'circle-alert', text: 'Couldn’t save, try again', action: 'Retry', onAction: () => void save(), bottom: 32 });
    }
  };

  return (
    <Screen header={<AppBar close right={<Button size="sm" variant="accent" disabled={!d.body.trim()} onPress={save}>Save</Button>} />}>
      <View style={{ paddingTop: 8, paddingHorizontal: 24 }}>
        <Pressable onPress={() => setPicker(true)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surfaceSunken }}>
          <Icon name="calendar" size={14} />
          <Text style={[font(700, 13), { color: colors.textPrimary }]}>{mediumDate(d.date)}</Text>
          <Icon name="chevron-down" size={14} />
        </Pressable>
        <TextInput
          value={d.title}
          onChangeText={(title) => setD((x) => ({ ...x, title }))}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textTertiary}
          cursorColor={colors.green500}
          selectionColor={colors.green500}
          maxLength={150}
          style={[font(800, 26, 1.2), { color: colors.textPrimary, marginTop: 22, padding: 0 }]}
        />
        <TextInput
          value={d.body}
          onChangeText={(body) => setD((x) => ({ ...x, body }))}
          placeholder="What’s on your mind today?"
          placeholderTextColor={colors.textTertiary}
          cursorColor={colors.green500}
          selectionColor={colors.green500}
          autoFocus={!note}
          multiline
          scrollEnabled={false}
          style={[font(500, 16, 1.65), { color: colors.textPrimary, marginTop: 14, padding: 0, minHeight: 240, textAlignVertical: 'top' }]}
        />
      </View>
      <DatePickerDialog visible={picker} value={d.date} today={today} maxDate={today} title="Entry date" onCancel={() => setPicker(false)} onSet={(date) => { setD((x) => ({ ...x, date })); setPicker(false); }} />
    </Screen>
  );
}
