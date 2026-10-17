import Constants from 'expo-constants';
import { Text, View } from 'react-native';
import { Group, Row } from '@/components/Form';
import { AppBar, Screen, Wordmark } from '@/components/Screen';
import { colors, text } from '@/theme';

/** G05 About 254 — accurate summary of the research behind the number. */
export default function About() {
  return (
    <Screen header={<AppBar title="About 254" />}>
      <View style={{ paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: colors.brown800, alignItems: 'center', justifyContent: 'center' }}>
          <Wordmark size={38} color={colors.cream100} />
        </View>
        <Text style={[text.h1, { marginTop: 20 }]}>Why 254?</Text>
        <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 10 }]}>
          A 2010 study at University College London (Lally et al., European Journal of Social Psychology) followed people forming a new daily habit. It took between 18 and 254 days for the behaviour to become automatic — about 66 days on average.
        </Text>
        <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 12 }]}>
          254 is the upper end of that range. It isn’t a scientific law — habits form at different speeds for different people — but going the full 254 days gives a habit the best chance to truly stick.
        </Text>
        <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 12 }]}>
          Milestones at 30, 60, 90, 100, 150, 200 and 250 days mean one slip never wipes out months of work.
        </Text>
        <Group style={{ marginTop: 22 }}>
          <Row label="Your data" sub="Private to your account, synced securely, deleted with your account." chevron={false} />
          <Row label="Version" value={`${Constants.expoConfig?.version ?? '1.0.0'}`} chevron={false} last />
        </Group>
      </View>
    </Screen>
  );
}
