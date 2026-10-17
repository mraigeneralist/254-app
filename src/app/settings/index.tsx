import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Dialog } from '@/components/Feedback';
import { Group, Row } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { updateSettings } from '@/data/actions';
import { useEmail, useProfile, useSettings } from '@/data/selectors';
import { AuthError, deleteAccount, logOut } from '@/data/session';
import { useSync } from '@/data/sync';
import { usePermission } from '@/features/notifications';
import { time12 } from '@/lib/format';
import { requestTour, showSnack } from '@/lib/ui';
import { PermissionBanner } from './notifications';

/** G01 Settings · G06 Log out? · G07 Delete account? */
export default function Settings() {
  const router = useRouter();
  const profile = useProfile();
  const email = useEmail();
  const s = useSettings();
  const pending = useSync((x) => x.pending);
  const permission = usePermission((x) => x.status);
  const [dialog, setDialog] = useState<'logout' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Screen header={<AppBar title="Settings" />}>
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40, gap: 18 }}>
        <Group title="Account">
          <Row icon="user" label="Name" value={profile.name} onPress={() => router.push('/settings/account')} />
          <Row icon="mail" label="Email" value={email} onPress={() => router.push('/settings/account')} />
          <Row icon="lock" label="Change password" last onPress={() => router.push('/settings/password')} />
        </Group>

        {permission === 'denied' && <PermissionBanner />}
        <Group title="Notifications">
          <Row icon="bell" label="Notifications" sub={s.notificationsEnabled ? 'On' : 'Off — no reminders at all'} toggle on={s.notificationsEnabled} onToggle={(v) => updateSettings({ notificationsEnabled: v })} />
          <Row icon="clock" label="Daily check-in reminder" sub={`${time12(s.summaryTime)}, if anything is unmarked`} toggle on={s.summaryEnabled} disabled={!s.notificationsEnabled} onToggle={(v) => updateSettings({ summaryEnabled: v })} />
          <Row icon="list-todo" label="Task reminders" toggle on={s.taskReminders} disabled={!s.notificationsEnabled} onToggle={(v) => updateSettings({ taskReminders: v })} />
          <Row icon="sliders-horizontal" label="All notification settings" sub="Habit reminder times and more" last onPress={() => router.push('/settings/notifications')} />
        </Group>

        <Group title="App">
          <Row
            icon="rotate-ccw"
            label="Replay tour"
            onPress={() => {
              requestTour();
              router.dismissTo('/today');
            }}
          />
          <Row icon="info" label="About 254" value="v1.0.0" last onPress={() => router.push('/settings/about')} />
        </Group>

        <Group>
          <Row icon="log-out" label="Log out" danger chevron={false} onPress={() => setDialog('logout')} />
          <Row icon="trash-2" label="Delete account" danger chevron={false} last onPress={() => setDialog('delete')} />
        </Group>
      </View>

      <Dialog
        visible={dialog === 'logout'}
        onClose={() => setDialog(null)}
        icon="log-out"
        tone="brown"
        title="Log out?"
        body={pending > 0 ? `You have ${pending} change${pending === 1 ? '' : 's'} that haven’t synced yet. Connect to the internet first, or they’ll be lost when you log out.` : 'Your data stays safe in your account. Log in again any time to pick up where you left off.'}
        confirm="Log out"
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          await logOut();
          setBusy(false);
          setDialog(null);
        }}
      />
      <Dialog
        visible={dialog === 'delete'}
        onClose={() => setDialog(null)}
        icon="triangle-alert"
        danger
        title="Delete your account?"
        body="This permanently deletes your habits, streaks, challenges, tasks, journal and stats. This can’t be undone."
        confirm="Delete account"
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteAccount();
            setDialog(null);
          } catch (e) {
            showSnack({ tone: 'error', icon: 'circle-alert', text: e instanceof AuthError ? e.message : 'Could not delete your account.', bottom: 40 });
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
