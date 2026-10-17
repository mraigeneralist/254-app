import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { MonthCal, WeekStrip, ymOf, type YearMonth } from '@/components/Calendar';
import { Icon, IconButton } from '@/components/ds';
import { Banner, Dialog, EmptyState } from '@/components/Feedback';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { useTabBarHeight } from '@/components/TabBar';
import { TabTitle } from '@/components/TabTitle';
import { TaskRow } from '@/components/TaskRow';
import { addTask, deleteTask, setTaskDone } from '@/data/actions';
import { live, useData } from '@/data/store';
import { useSync } from '@/data/sync';
import type { Task } from '@/data/types';
import type { DateKey } from '@/domain/dates';
import { useToday } from '@/hooks/useToday';
import { monthTitle, shortDate, time12, weekdayName } from '@/lib/format';
import { colors, font, insetBorder, shadow, text } from '@/theme';

const byTime = (a: Task, b: Task) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.created_at.localeCompare(b.created_at);

/** Swipe left to reveal Delete (T06); opens the confirmation (T07) and springs back. */
function SwipeToDelete({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const ref = useRef<SwipeableMethods>(null);
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={() => {
        onDelete();
        ref.current?.close();
      }}
      renderRightActions={() => (
        <View style={{ width: 108, backgroundColor: colors.orange500, borderRadius: 20, marginLeft: -20, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="trash-2" size={18} color={colors.white} />
            <Text style={[font(700, 13), { color: colors.white }]}>Delete</Text>
          </View>
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function GroupLabel({ children, color, right, onPress }: { children: string; color?: string; right?: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10, marginHorizontal: 4 }}>
      <Text style={[text.over, { color: color ?? colors.textTertiary }]}>{children}</Text>
      {right}
    </Pressable>
  );
}

export default function TasksScreen() {
  const router = useRouter();
  const today = useToday();
  const tabBar = useTabBarHeight();
  const online = useSync((s) => s.online);
  const rows = useData((s) => s.tables.tasks);
  const tasks = useMemo(() => live(rows), [rows]);
  const [selected, setSelected] = useState<DateKey>(today);
  const [open, setOpen] = useState(false);
  const [ym, setYm] = useState<YearMonth>(ymOf(today));
  const [completedOpen, setCompletedOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const overdue = useMemo(() => tasks.filter((t) => !t.completed_at && t.date < today).sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b)), [tasks, today]);
  const dayOpen = useMemo(() => tasks.filter((t) => t.date === selected && !t.completed_at).sort(byTime), [tasks, selected]);
  const dayDone = useMemo(() => tasks.filter((t) => t.date === selected && t.completed_at).sort((a, b) => (a.completed_at ?? '').localeCompare(b.completed_at ?? '')), [tasks, selected]);
  const dots = useMemo(() => {
    const m: Record<DateKey, string> = {};
    for (const t of tasks) m[t.date] = !t.completed_at && t.date < today ? colors.orange500 : m[t.date] === colors.orange500 ? m[t.date] : colors.green500;
    return m;
  }, [tasks, today]);
  const dotSet = useMemo(() => new Set(Object.keys(dots)), [dots]);

  const isToday = selected === today;
  const showOverdue = isToday && overdue.length > 0;
  const nothing = dayOpen.length === 0 && dayDone.length === 0 && !showOverdue;

  const add = () => {
    if (!draft.trim()) return;
    addTask(draft, selected);
    setDraft('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const toggle = (t: Task) => {
    setTaskDone(t.id, !t.completed_at);
    void Haptics.impactAsync(t.completed_at ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
  };

  const keyboard = useAnimatedKeyboard();
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.max(0, keyboard.height.value - tabBar + 12) }] }));

  const row = (t: Task, opts: { overdue?: boolean; showDate?: boolean } = {}) => (
    <SwipeToDelete key={t.id} onDelete={() => setToDelete(t)}>
      <TaskRow
        title={t.title}
        time={t.time ? time12(t.time) : undefined}
        bell={t.reminder}
        date={opts.showDate ? shortDate(t.date) : undefined}
        done={!!t.completed_at}
        overdue={opts.overdue}
        onToggle={() => toggle(t)}
        onPress={() => router.push(`/task/${t.id}`)}
      />
    </SwipeToDelete>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: tabBar + 150 }} showsVerticalScrollIndicator={false}>
        <TabTitle
          title="Tasks"
          right={
            <IconButton
              icon="calendar-days"
              size={40}
              label="Go to today"
              onPress={() => {
                setSelected(today);
                setYm(ymOf(today));
              }}
            />
          }
        />
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 12 }} accessibilityRole="button">
            <Text style={[font(800, 15), { color: colors.textPrimary }]}>{monthTitle(ymOf(selected).y, ymOf(selected).m)}</Text>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} />
          </Pressable>
          {!open ? (
            <WeekStrip selected={selected} today={today} dots={dotSet} onSelect={setSelected} />
          ) : (
            <View style={{ backgroundColor: colors.surfaceCard, borderRadius: 24, padding: 16, boxShadow: shadow.sm }}>
              <MonthCal
                ym={ym}
                onMonth={setYm}
                today={today}
                selected={selected}
                dots={dots}
                onSelect={(k) => {
                  setSelected(k);
                  setOpen(false);
                }}
              />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {!online && <Banner style={{ marginTop: 16 }} text="You’re offline — tasks will sync when you’re back" />}
          {nothing ? (
            <EmptyState
              icon="list-todo"
              tone="purple"
              pad={48}
              title={isToday ? 'Nothing planned for today' : `Nothing planned for ${weekdayName(selected)}`}
              body={`Type below to add a task for ${shortDate(selected)}. Unfinished tasks roll into the next day as overdue.`}
            />
          ) : (
            <>
              {showOverdue && (
                <>
                  <GroupLabel color={colors.orange600}>{`Overdue · ${overdue.length}`}</GroupLabel>
                  <View style={{ gap: 8 }}>{overdue.map((t) => row(t, { overdue: true, showDate: true }))}</View>
                </>
              )}
              <GroupLabel>{`${isToday ? 'Today' : shortDate(selected)} · ${dayOpen.length}`}</GroupLabel>
              <View style={{ gap: 8 }}>
                {dayOpen.map((t) => row(t))}
                {dayOpen.length === 0 && <Text style={[text.sm, { marginHorizontal: 4 }]}>All done. Nice.</Text>}
              </View>
              {dayDone.length > 0 && (
                <>
                  <GroupLabel onPress={() => setCompletedOpen(!completedOpen)} right={<Icon name={completedOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />}>
                    {`Completed · ${dayDone.length}`}
                  </GroupLabel>
                  {completedOpen && <View style={{ gap: 8 }}>{dayDone.map((t) => row(t))}</View>}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Animated.View style={[{ position: 'absolute', left: 16, right: 16, bottom: tabBar + 12, flexDirection: 'row', gap: 8, alignItems: 'center', zIndex: 30 }, lift]}>
        <View style={{ flex: 1, height: 52, borderRadius: 999, backgroundColor: colors.surfaceCard, boxShadow: draft ? `${insetBorder(1.5, colors.green500)}, ${shadow.md}` : shadow.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 10 }}>
          <Icon name="plus" size={18} color={colors.brown400} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            submitBehavior="submit"
            returnKeyType="done"
            placeholder={`Add a task for ${shortDate(selected)}`}
            placeholderTextColor={colors.textTertiary}
            cursorColor={colors.green500}
            selectionColor={colors.green500}
            maxLength={300}
            style={[font(draft ? 600 : 500, 14), { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
          />
        </View>
        {draft.trim().length > 0 && <IconButton icon="corner-down-left" variant="dark" size={52} label="Add task" onPress={add} />}
      </Animated.View>
      <StatusBarScrim />

      <Dialog
        visible={!!toDelete}
        onClose={() => setToDelete(null)}
        icon="trash-2"
        danger
        title="Delete task?"
        body={toDelete ? `“${toDelete.title}”${toDelete.reminder ? ' and its reminder' : ''} will be removed.` : ''}
        onConfirm={() => {
          if (toDelete) deleteTask(toDelete.id);
          setToDelete(null);
        }}
      />
    </View>
  );
}
