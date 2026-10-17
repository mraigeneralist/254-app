import { Text, View } from 'react-native';
import { TabTitle } from '@/components/TabTitle';
import { text } from '@/theme';

// Placeholder — built in a later feature step.
export default function ProfileScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TabTitle title="Profile" />
      <Text style={[text.body, { paddingHorizontal: 20, marginTop: 12 }]}>Coming soon.</Text>
    </View>
  );
}
