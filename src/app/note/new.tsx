import { useLocalSearchParams } from 'expo-router';
import { NoteEditor } from '@/components/NoteEditor';
import { isDateKey } from '@/domain/dates';

export default function NewNote() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return <NoteEditor initialDate={date && isDateKey(date) ? date : undefined} />;
}
