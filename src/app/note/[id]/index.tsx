import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { IconButton } from '@/components/ds';
import { Dialog, EmptyState } from '@/components/Feedback';
import { AppBar, Screen } from '@/components/Screen';
import { deleteNote } from '@/data/actions';
import { useData } from '@/data/store';
import { clockTime, dayMonth, longDate } from '@/lib/format';
import { colors, font, text } from '@/theme';

/** N05 Read entry · N06 Delete entry? */
export default function ReadNote() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useData((s) => s.tables.notes[id]);
  const [confirm, setConfirm] = useState(false);

  if (!note || note.deleted_at) {
    return (
      <Screen header={<AppBar />}>
        <EmptyState icon="notebook-pen" tone="purple" title="Entry not found" body="It may have been deleted." />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <AppBar
          onBack={() => router.dismissTo('/note')}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton icon="pencil" size={40} label="Edit entry" onPress={() => router.push(`/note/${note.id}/edit`)} />
              <IconButton icon="trash-2" size={40} label="Delete entry" onPress={() => setConfirm(true)} />
            </View>
          }
        />
      }
    >
      <View style={{ paddingTop: 8, paddingHorizontal: 24 }}>
        <Text style={text.cap}>{`${longDate(note.date)} · ${clockTime(note.created_at)}`}</Text>
        {note.title ? <Text style={[font(800, 26, 1.2), { color: colors.textPrimary, marginTop: 12 }]}>{note.title}</Text> : null}
        <Text selectable style={[font(500, 16, 1.65), { color: colors.textPrimary, marginTop: 14 }]}>{note.body}</Text>
      </View>
      <Dialog
        visible={confirm}
        onClose={() => setConfirm(false)}
        icon="trash-2"
        danger
        title="Delete this entry?"
        body={`${note.title ? `“${note.title}”` : 'This entry'} from ${dayMonth(note.date)} will be gone for good.`}
        onConfirm={() => {
          setConfirm(false);
          deleteNote(note.id);
          router.dismissTo('/note');
        }}
      />
    </Screen>
  );
}
