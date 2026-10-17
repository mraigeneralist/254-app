import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Icon, IconButton } from '@/components/ds';
import { Dialog, EmptyState } from '@/components/Feedback';
import { Field, Group, Row } from '@/components/Form';
import { DatePickerDialog, TimePickerDialog } from '@/components/Pickers';
import { AppBar, Screen } from '@/components/Screen';
import { deleteTask, setTaskDone, updateTask } from '@/data/actions';
import { useData } from '@/data/store';
import { requestPermission, usePermission } from '@/features/notifications';
import { useToday } from '@/hooks/useToday';
import { shortDate, time12 } from '@/lib/format';
import { showSnack } from '@/lib/ui';
import { colors, font, insetBorder } from '@/theme';

/** T05 Task detail — edit title, date, time, reminder, notes; complete; delete. */
export default function TaskDetail() {
  const router = useRouter();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useData((s) => s.tables.tasks[id]);
  const permission = usePermission((s) => s.status);
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // save text edits shortly after typing stops (and on leave)
  const flush = useRef(() => undefined as void);
  flush.current = () => {
    if (!task || task.deleted_at) return;
    const t = title.trim();
    if ((t && t !== task.title) || notes !== task.notes) updateTask(task.id, { title: t || task.title, notes });
  };
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush.current(), 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [title, notes]);
  useEffect(() => () => flush.current(), []);

  if (!task || task.deleted_at) {
    return (
      <Screen header={<AppBar title="Task" />}>
        <EmptyState icon="list-todo" tone="purple" title="Task not found" body="It may have been deleted." />
      </Screen>
    );
  }
  const done = !!task.completed_at;

  const toggleReminder = async (on: boolean) => {
    if (on && !task.time) {
      setPicker('time');
      return;
    }
    if (on && permission !== 'granted') {
      const st = await requestPermission();
      if (st !== 'granted') {
        showSnack({ icon: 'bell-off', tone: 'error', text: 'Notifications are off. Turn them on in Settings to get reminders.', bottom: 120 });
        return;
      }
    }
    updateTask(task.id, { reminder: on });
  };

  return (
    <Screen
      header={<AppBar title="Task" right={<IconButton icon="trash-2" size={40} label="Delete task" onPress={() => setConfirm(true)} />} />}
      footer={
        <Button
          size="lg"
          fullWidth
          variant={done ? 'secondary' : 'primary'}
          iconLeft={done ? 'rotate-ccw' : 'check'}
          onPress={() => {
            flush.current();
            setTaskDone(task.id, !done);
            if (!done) router.back();
          }}
        >
          {done ? 'Mark not complete' : 'Mark complete'}
        </Button>
      }
    >
      <View style={{ paddingTop: 10, paddingHorizontal: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setTaskDone(task.id, !done)} hitSlop={10} style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.green500 : colors.surfaceCard, boxShadow: done ? undefined : insetBorder(2, colors.brown300) }}>
            {done && <Icon name="check" size={16} color={colors.white} />}
          </Pressable>
          <TextInput
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={300}
            cursorColor={colors.green500}
            selectionColor={colors.green500}
            style={[font(800, 22, 1.2), { flex: 1, color: done ? colors.textTertiary : colors.textPrimary, textDecorationLine: done ? 'line-through' : 'none', padding: 0 }]}
          />
        </View>
        <Group>
          <Row icon="calendar" label="Date" value={task.date === today ? `Today · ${shortDate(task.date)}` : shortDate(task.date)} onPress={() => setPicker('date')} />
          <Row icon="clock" label="Time" value={task.time ? time12(task.time) : 'None'} onPress={() => setPicker('time')} />
          <Row icon="bell" label="Reminder" sub={task.time ? 'Notify me at the set time' : 'Set a time first'} toggle on={task.reminder && !!task.time} onToggle={toggleReminder} last />
        </Group>
        {task.time && (
          <Pressable onPress={() => updateTask(task.id, { time: null, reminder: false })} style={{ alignSelf: 'flex-start', marginTop: -6, marginLeft: 4 }} hitSlop={8}>
            <Text style={[font(700, 13), { color: colors.textSecondary, textDecorationLine: 'underline' }]}>Remove time</Text>
          </Pressable>
        )}
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Add details" multiline height={96} maxLength={2000} />
      </View>

      <DatePickerDialog visible={picker === 'date'} value={task.date} today={today} title="Task date" onCancel={() => setPicker(null)} onSet={(date) => { updateTask(task.id, { date }); setPicker(null); }} />
      <TimePickerDialog
        visible={picker === 'time'}
        value={task.time ?? '09:00'}
        title="Task time"
        presets={['09:00', '13:00', '18:00']}
        onCancel={() => setPicker(null)}
        onSet={(time) => {
          updateTask(task.id, { time });
          setPicker(null);
        }}
      />
      <Dialog
        visible={confirm}
        onClose={() => setConfirm(false)}
        icon="trash-2"
        danger
        title="Delete task?"
        body={`“${task.title}”${task.reminder ? ' and its reminder' : ''} will be removed.`}
        onConfirm={() => {
          setConfirm(false);
          deleteTask(task.id);
          router.back();
        }}
      />
    </Screen>
  );
}
