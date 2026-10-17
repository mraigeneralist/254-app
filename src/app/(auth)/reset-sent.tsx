import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/ds';
import { EmptyState } from '@/components/Feedback';
import { AppBar, Screen } from '@/components/Screen';
import { AuthError, sendPasswordReset } from '@/data/session';
import { showSnack } from '@/lib/ui';
import { colors, font, text } from '@/theme';

const COOLDOWN = 60;

export default function ResetSent() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [left, setLeft] = useState(COOLDOWN);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const resend = async () => {
    try {
      await sendPasswordReset(email);
      setLeft(COOLDOWN);
      showSnack({ icon: 'mail-check', text: 'Reset link sent again', bottom: 150 });
    } catch (e) {
      showSnack({ icon: 'circle-alert', tone: 'error', text: e instanceof AuthError ? e.message : 'Could not send. Try again.', bottom: 150 });
    }
  };

  return (
    <Screen
      header={<AppBar onBack={() => router.replace('/log-in')} />}
      footer={
        <>
          <Button size="lg" fullWidth onPress={() => router.replace({ pathname: '/log-in', params: { email } })}>Back to log in</Button>
          <Button size="lg" variant="ghost" fullWidth disabled={left > 0} onPress={resend}>{left > 0 ? `Resend link in ${left}s` : 'Resend link'}</Button>
        </>
      }
    >
      <EmptyState
        icon="mail-check"
        title="Check your inbox"
        pad={70}
        body={
          <Text style={[text.body, { fontSize: 14, lineHeight: 21, textAlign: 'center' }]}>
            We sent a reset link to <Text style={[font(700, 14), { color: colors.textPrimary }]}>{email}</Text>. Open it on this phone. It expires in 30 minutes.
          </Text>
        }
      />
    </Screen>
  );
}
