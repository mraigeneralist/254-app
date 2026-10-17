import { Text, View } from 'react-native';
import { TabTitle } from '@/components/TabTitle';
import { text } from '@/theme';

// Placeholder — built in a later feature step.
export default function MeditateScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TabTitle title="Meditate" />
      <Text style={[text.body, { paddingHorizontal: 20, marginTop: 12 }]}>Coming soon.</Text>
    </View>
  );
}
