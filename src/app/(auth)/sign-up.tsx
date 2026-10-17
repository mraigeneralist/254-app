import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ds';
import { EyeToggle, Field } from '@/components/Form';
import { AuthError, signUp } from '@/data/session';
import { colors, font, text } from '@/theme';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const filled = name.trim() && email.trim() && password.length > 0;
  const emailInUse = error?.field === 'email' && /already in use/.test(error.message);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signUp(name, email, password);
      // the root gate moves on to "Create your first habit"
    } catch (e) {
      setError(e instanceof AuthError ? e : new AuthError('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      sub="Your habits, streaks and journal are saved to your account."
      footer={
        <Text style={[text.sm, { fontFamily: font(600, 13).fontFamily }]} onPress={() => router.replace('/log-in')}>
          Already have an account? <Text style={{ color: colors.green600, fontFamily: font(800, 13).fontFamily }}>Log in</Text>
        </Text>
      }
    >
      <Field label="Name" icon="user" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" textContentType="name" returnKeyType="next" error={error?.field === 'name' ? error.message : null} />
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error?.field === 'email' ? error.message : null}
      />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete="new-password"
        trailing={<EyeToggle shown={show} onToggle={() => setShow(!show)} />}
        hint="At least 8 characters"
        error={error?.field === 'password' ? error.message : null}
        onSubmitEditing={() => filled && submit()}
      />
      {error && !error.field ? <Text style={[font(600, 13, 1.4), { color: colors.orange600 }]}>{error.message}</Text> : null}
      <Button size="lg" fullWidth disabled={!filled || busy} iconLeft={busy ? 'loader-circle' : undefined} style={{ marginTop: 6 }} onPress={submit}>
        {busy ? 'Signing up…' : 'Sign up'}
      </Button>
      {emailInUse && (
        <Button size="lg" variant="outline" fullWidth onPress={() => router.replace({ pathname: '/log-in', params: { email } })}>
          Log in instead
        </Button>
      )}
    </AuthShell>
  );
}
