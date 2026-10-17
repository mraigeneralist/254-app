import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { text } from '@/theme';

type Props = { title: string; sub?: ReactNode; right?: ReactNode };

/** kit.jsx TabTitle: big h1 title for tab roots. */
export function TabTitle({ title, sub, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: insets.top + 18, paddingHorizontal: 20 }}>
      <View style={{ flexShrink: 1 }}>
        <Text style={text.h1}>{title}</Text>
        {sub ? typeof sub === 'string' ? <Text style={[text.sm, { marginTop: 6 }]}>{sub}</Text> : <View style={{ marginTop: 6 }}>{sub}</View> : null}
      </View>
      {right}
    </View>
  );
}
