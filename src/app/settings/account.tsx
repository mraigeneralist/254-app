import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Button } from '@/components/ds';
import { Field, Group, Row } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { updateProfile } from '@/data/actions';
import { useEmail, useProfile } from '@/data/selectors';
import { supabase } from '@/data/supabase';
import { showSnack } from '@/lib/ui';

/** G02 Account. */
export default function Account() {
  const router = useRouter();
  const profile = useProfile();
  const email = useEmail();
  const [name, setName] = useState(profile.name);

  const save = () => {
    updateProfile({ name: name.trim() });
    void supabase.auth.updateUser({ data: { name: name.trim() } }).catch(() => undefined);
    showSnack({ icon: 'circle-check', text: 'Saved', bottom: 120 });
    router.back();
  };

  return (
    <Screen header={<AppBar title="Account" close />} footer={<Button size="lg" fullWidth disabled={!name.trim() || name.trim() === profile.name} onPress={save}>Save changes</Button>}>
      <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 18 }}>
        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
          <Avatar name={name || email} size={84} />
        </View>
        <Field label="Name" value={name} onChangeText={setName} maxLength={60} autoComplete="name" />
        <Field label="Email" value={email} icon="mail" editable={false} hint="Your email is used to log in." />
        <Group>
          <Row icon="lock" label="Change password" last onPress={() => router.push('/settings/password')} />
        </Group>
      </View>
    </Screen>
  );
}
