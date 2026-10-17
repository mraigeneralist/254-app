import { useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/Feedback';
import { NoteEditor } from '@/components/NoteEditor';
import { AppBar, Screen } from '@/components/Screen';
import { useData } from '@/data/store';

export default function EditNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useData((s) => s.tables.notes[id]);
  if (!note || note.deleted_at) {
    return (
      <Screen header={<AppBar close />}>
        <EmptyState icon="notebook-pen" tone="purple" title="Entry not found" body="It may have been deleted." />
      </Screen>
    );
  }
  return <NoteEditor note={note} />;
}
