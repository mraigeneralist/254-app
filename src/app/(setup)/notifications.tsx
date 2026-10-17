import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Icon } from '@/components/ds';
import { Screen } from '@/components/Screen';
import { updateProfile } from '@/data/actions';
import { requestPermission } from '@/features/notifications';
import { requestTour } from '@/lib/ui';
import { colors, font, shadow, text } from '@/theme';

/** O06 — explain why, then show the Android 13+ system prompt. Continues either way. */
export default function NotificationsPrompt() {
  const [busy, setBusy] = useState(false);

  const finish = () => {
    requestTour();
    updateProfile({ onboarding_completed: true }); // the root gate moves on to Today
  };

  const allow = async () => {
    setBusy(true);
    await requestPermission().catch(() => undefined);
    setBusy(false);
    finish();
  };

  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: colors.cream50, borderRadius: 28, paddingTop: 24, paddingHorizontal: 22, paddingBottom: 18, alignItems: 'center', boxShadow: shadow.lg }}>
        <Icon name="bell-ring" size={28} color={colors.green600} />
        <Text style={[font(700, 19, 1.3), { color: colors.textPrimary, marginTop: 14, textAlign: 'center' }]}>
          Allow <Text style={font(900, 19)}>254</Text> to send you notifications?
        </Text>
        <Text style={[text.sm, { marginTop: 8, textAlign: 'center' }]}>Check-in reminders, task alerts and milestone news — only at the times you choose. You can change this any time in Settings.</Text>
        <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 20 }}>
          <Button fullWidth onPress={allow} disabled={busy}>Allow</Button>
          <Button variant="secondary" fullWidth onPress={finish} disabled={busy}>Don’t allow</Button>
        </View>
      </View>
    </Screen>
  );
}
