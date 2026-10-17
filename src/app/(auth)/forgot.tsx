import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ds';
import { Field } from '@/components/Form';
import { AuthError, sendPasswordReset } from '@/data/session';
import { colors, font } from '@/theme';

export default function Forgot() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      router.replace({ pathname: '/reset-sent', params: { email: email.trim() } });
    } catch (e) {
      setError(e instanceof AuthError ? e : new AuthError('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell back title="Reset your password" sub="Enter the email you signed up with and we’ll send you a link to set a new password.">
      <Field label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus={!email} error={error?.field === 'email' ? error.message : null} onSubmitEditing={submit} />
      {error && !error.field ? <Text style={[font(600, 13, 1.4), { color: colors.orange600 }]}>{error.message}</Text> : null}
      <Button size="lg" fullWidth disabled={!email.trim() || busy} onPress={submit}>
        {busy ? 'Sending…' : 'Send reset link'}
      </Button>
    </AuthShell>
  );
}
