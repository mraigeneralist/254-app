import { Text, View } from 'react-native';
import { TabTitle } from '@/components/TabTitle';
import { text } from '@/theme';

// Placeholder — built in a later feature step.
export default function NoteScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TabTitle title="Note To Self" />
      <Text style={[text.body, { paddingHorizontal: 20, marginTop: 12 }]}>Coming soon.</Text>
    </View>
  );
}
