import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/ds';
import { EmptyState } from '@/components/Feedback';
import { EyeToggle, Field } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { AuthError, sessionFromRecoveryUrl, setNewPassword, useSession } from '@/data/session';
import { showSnack } from '@/lib/ui';
import { colors, font } from '@/theme';

/** Opened from the password-reset email (two54://set-password#access_token=…). */
export default function SetPassword() {
  const router = useRouter();
  const url = Linking.useLinkingURL();
  const hasSession = useSession((s) => !!s.session);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = url ? await sessionFromRecoveryUrl(url) : false;
        if (alive) setState(ok || hasSession ? 'ready' : 'invalid');
      } catch {
        if (alive) setState('invalid');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async () => {
    if (mismatch) return;
    setBusy(true);
    setError(null);
    try {
      await setNewPassword(password);
      showSnack({ icon: 'circle-check', text: 'Password updated' });
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e : new AuthError('Could not update your password.'));
    } finally {
      setBusy(false);
    }
  };

  if (state === 'invalid') {
    return (
      <Screen header={<AppBar close onBack={() => router.replace('/')} />} footer={<Button size="lg" fullWidth onPress={() => router.replace('/forgot')}>Send a new link</Button>}>
        <EmptyState icon="circle-alert" tone="orange" pad={70} title="This link has expired" body="Reset links work once and expire after 30 minutes. Request a new one and open it on this phone." />
      </Screen>
    );
  }

  return (
    <Screen
      header={<AppBar title="Set a new password" close onBack={() => router.replace('/')} />}
      footer={
        <Button size="lg" fullWidth disabled={state !== 'ready' || password.length < 8 || mismatch || !confirm || busy} onPress={submit}>
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      }
    >
      <Text style={{ height: 14 }} />
      <Field style={{ marginHorizontal: 20 }} label="New password" icon="lock" value={password} onChangeText={setPassword} secureTextEntry={!show} autoCapitalize="none" autoComplete="new-password" trailing={<EyeToggle shown={show} onToggle={() => setShow(!show)} />} hint="At least 8 characters" error={error?.message} />
      <Field style={{ marginHorizontal: 20, marginTop: 18 }} label="Confirm new password" icon="lock" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} autoCapitalize="none" error={mismatch ? 'Passwords don’t match.' : null} />
      {state === 'checking' && <Text style={[font(600, 13), { color: colors.textSecondary, marginHorizontal: 20, marginTop: 16 }]}>Checking your link…</Text>}
    </Screen>
  );
}
