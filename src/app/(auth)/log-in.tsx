import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ds';
import { EyeToggle, Field } from '@/components/Form';
import { AuthError, logIn } from '@/data/session';
import { colors, font, text } from '@/theme';

export default function LogIn() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const filled = email.trim() && password.length > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await logIn(email, password);
    } catch (e) {
      setError(e instanceof AuthError ? e : new AuthError('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      sub="Log in to pick up your streaks where you left them."
      footer={
        <Text style={[text.sm, { fontFamily: font(600, 13).fontFamily }]} onPress={() => router.replace('/sign-up')}>
          New to 254? <Text style={{ color: colors.green600, fontFamily: font(800, 13).fontFamily }}>Sign up</Text>
        </Text>
      }
    >
      <Field label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={error?.field === 'email' ? error.message : null} />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete="current-password"
        trailing={<EyeToggle shown={show} onToggle={() => setShow(!show)} />}
        error={error?.field === 'password' ? error.message : null}
        onSubmitEditing={() => filled && submit()}
      />
      <Pressable onPress={() => router.push({ pathname: '/forgot', params: { email } })} hitSlop={8} style={{ alignSelf: 'flex-end', marginTop: -4 }}>
        <Text style={[font(700, 13), { color: colors.green600 }]}>Forgot password?</Text>
      </Pressable>
      {error && !error.field ? <Text style={[font(600, 13, 1.4), { color: colors.orange600 }]}>{error.message}</Text> : null}
      <Button size="lg" fullWidth disabled={!filled || busy} iconLeft={busy ? 'loader-circle' : undefined} onPress={submit}>
        {busy ? 'Logging in…' : 'Log in'}
      </Button>
    </AuthShell>
  );
}
