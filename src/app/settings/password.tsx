import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds';
import { EyeToggle, Field } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { AuthError, changePassword } from '@/data/session';
import { showSnack } from '@/lib/ui';
import { colors, font } from '@/theme';

/** G03 Change password. */
export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      showSnack({ icon: 'circle-check', text: 'Password updated', bottom: 120 });
      router.back();
    } catch (e) {
      setError(e instanceof AuthError ? e : new AuthError('Could not update your password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppBar title="Change password" close />}
      footer={<Button size="lg" fullWidth disabled={!current || next.length < 8 || mismatch || !confirm || busy} onPress={submit}>{busy ? 'Updating…' : 'Update password'}</Button>}
    >
      <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 18 }}>
        <Field label="Current password" icon="lock" value={current} onChangeText={setCurrent} secureTextEntry={!show} autoCapitalize="none" error={error?.field === 'password' && /current/.test(error.message) ? error.message : null} />
        <Field label="New password" icon="lock" value={next} onChangeText={setNext} secureTextEntry={!show} autoCapitalize="none" autoComplete="new-password" trailing={<EyeToggle shown={show} onToggle={() => setShow(!show)} />} hint="At least 8 characters" />
        <Field label="Confirm new password" icon="lock" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} autoCapitalize="none" error={mismatch ? 'Passwords don’t match.' : null} />
        {error && !(error.field === 'password' && /current/.test(error.message)) ? <Text style={[font(600, 13, 1.4), { color: colors.orange600 }]}>{error.message}</Text> : null}
      </View>
    </Screen>
  );
}
