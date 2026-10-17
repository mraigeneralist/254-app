import { Text, View } from 'react-native';
import { Icon } from '@/components/ds';
import { useSync } from '@/data/sync';
import { colors, font } from '@/theme';

/** Tiny "Offline" / "Syncing…" pill shown next to the Today date. */
export function SyncStatus() {
  const { online, syncing, pending } = useSync();
  if (online && !syncing) return null;
  const label = !online ? (pending ? `Offline · ${pending} to sync` : 'Offline') : 'Syncing…';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6, paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: online ? colors.green100 : colors.yellow100 }}>
      <Icon name={online ? 'refresh-cw' : 'cloud-off'} size={11} color={online ? colors.green700 : colors.brown800} />
      <Text style={[font(700, 10.5), { color: online ? colors.green700 : colors.brown800 }]}>{label}</Text>
    </View>
  );
}
