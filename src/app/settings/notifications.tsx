import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Banner } from '@/components/Feedback';
import { Group, ReminderRow, Row } from '@/components/Form';
import { TimePickerDialog } from '@/components/Pickers';
import { AppBar, Screen } from '@/components/Screen';
import { updateHabit, updateSettings } from '@/data/actions';
import { useHabitViews, useSettings } from '@/data/selectors';
import { requestPermission, usePermission } from '@/features/notifications';
import { useToday } from '@/hooks/useToday';
import { time12 } from '@/lib/format';
import { colors, font, text } from '@/theme';

export function PermissionBanner() {
  return (
    <Pressable onPress={() => void Linking.openSettings()}>
      <Banner icon="bell-off" text="Notifications are turned off for 254. Tap to open Settings → Notifications and allow them." />
    </Pressable>
  );
}

/** G04 Notification settings — master switch, daily summary time, per-feature toggles, each habit's reminder time. */
export default function NotificationSettings() {
  const today = useToday();
  const s = useSettings();
  const permission = usePermission((x) => x.status);
  const habits = useHabitViews(today).filter((v) => !v.state.completedDate);
  const [picker, setPicker] = useState<{ target: 'summary' } | { target: 'habit'; id: string; value: string } | null>(null);
  const off = !s.notificationsEnabled;

  return (
    <Screen header={<AppBar title="Notifications" />}>
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40, gap: 18 }}>
        {permission === 'denied' && <PermissionBanner />}
        {permission === 'undetermined' && (
          <Pressable onPress={() => void requestPermission()}>
            <Banner icon="bell" text="254 can’t send notifications yet. Tap to allow them." />
          </Pressable>
        )}
        <Group>
          <Row icon="bell" label="Allow notifications" sub="Master switch for every reminder" toggle on={s.notificationsEnabled} onToggle={(v) => updateSettings({ notificationsEnabled: v })} last />
        </Group>
        <Group title="Daily check-in">
          <Row icon="bell-ring" label="Check-in reminder" sub="Only if habits are unmarked" toggle on={s.summaryEnabled} disabled={off} onToggle={(v) => updateSettings({ summaryEnabled: v })} />
          <Row icon="clock" label="Reminder time" value={time12(s.summaryTime)} last disabled={off} onPress={() => setPicker({ target: 'summary' })} />
        </Group>
        <Group title="Per feature">
          <Row icon="sprout" label="Habit reminders" sub="Uses each habit’s own time" toggle on={s.habitReminders} disabled={off} onToggle={(v) => updateSettings({ habitReminders: v })} />
          <Row icon="shield" label="Addiction check-ins" toggle on={s.breakReminders} disabled={off} onToggle={(v) => updateSettings({ breakReminders: v })} />
          <Row icon="trophy" label="Challenge reminders" sub="Included in the daily check-in reminder" toggle on={s.challengeReminders} disabled={off} onToggle={(v) => updateSettings({ challengeReminders: v })} />
          <Row icon="list-todo" label="Task reminders" toggle on={s.taskReminders} disabled={off} onToggle={(v) => updateSettings({ taskReminders: v })} />
          <Row icon="award" label="Milestone alerts" toggle on={s.milestoneAlerts} disabled={off} onToggle={(v) => updateSettings({ milestoneAlerts: v })} last />
        </Group>
        {habits.length > 0 && (
          <View>
            <Text style={[text.over, { marginHorizontal: 4, marginBottom: 10 }]}>Habit reminder times</Text>
            <View style={{ gap: 8, opacity: off ? 0.5 : 1 }} pointerEvents={off ? 'none' : 'auto'}>
              {habits.map((v) => (
                <ReminderRow
                  key={v.habit.id}
                  label={v.habit.name}
                  time={time12(v.habit.reminder_time ?? (v.habit.kind === 'build' ? '07:00' : '21:00'))}
                  on={!!v.habit.reminder_time}
                  onToggle={(on) => (on ? setPicker({ target: 'habit', id: v.habit.id, value: v.habit.kind === 'build' ? '07:00' : '21:00' }) : updateHabit(v.habit.id, { reminder_time: null }))}
                  onPickTime={() => setPicker({ target: 'habit', id: v.habit.id, value: v.habit.reminder_time ?? '07:00' })}
                />
              ))}
            </View>
            <Text style={[font(500, 12, 1.4), { color: colors.textSecondary, marginTop: 10, marginHorizontal: 4 }]}>A habit’s reminder is skipped on days you’ve already checked in.</Text>
          </View>
        )}
      </View>
      <TimePickerDialog
        visible={!!picker}
        value={picker?.target === 'habit' ? picker.value : s.summaryTime}
        title={picker?.target === 'habit' ? 'Reminder time' : 'Daily check-in reminder'}
        presets={picker?.target === 'summary' ? ['20:00', '21:00', '22:00'] : undefined}
        onCancel={() => setPicker(null)}
        onSet={(t) => {
          if (picker?.target === 'habit') updateHabit(picker.id, { reminder_time: t });
          else updateSettings({ summaryTime: t });
          setPicker(null);
        }}
      />
    </Screen>
  );
}
