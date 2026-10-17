import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ds';
import { colors, font, shadow } from '@/theme';
import { useTourTarget, type TourKey } from './Tour';

export const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'today', label: 'Today', icon: 'sun' },
  { name: 'tasks', label: 'Tasks', icon: 'list-todo' },
  { name: 'meditate', label: 'Meditate', icon: 'flower-2' },
  { name: 'note', label: 'Note To Self', icon: 'notebook-pen' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

/** Height of the tab bar above the bottom inset (content padding / FAB offset). */
export const TAB_BAR_BASE_HEIGHT = 70;
export const useTabBarHeight = () => {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + Math.max(18, insets.bottom + 6);
};

type Props = { active: string; onSelect: (name: string) => void };

function TabItem({ name, label, icon, active, onSelect }: { name: string; label: string; icon: IconName; active: boolean; onSelect: (n: string) => void }) {
  const ref = useTourTarget(`tab-${name}` as TourKey);
  return (
    <Pressable
      ref={ref}
      collapsable={false}
      onPress={() => onSelect(name)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: 'center', gap: 5 }}
    >
      <View style={{ width: 52, height: 32, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.surfaceSunken : colors.surfaceCard }}>
        <Icon name={icon} size={20} color={active ? colors.brown800 : colors.brown400} />
      </View>
      <Text style={[font(active ? 800 : 600, 10.5), { color: active ? colors.brown800 : colors.brown500 }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/** kit.jsx TabBar: white panel rounded 28 on top, sunken pill behind the active icon. */
export function TabBar({ active, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: colors.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: shadow.tabBar, flexDirection: 'row',
        paddingTop: 10, paddingHorizontal: 4, paddingBottom: Math.max(18, insets.bottom + 6),
      }}
    >
      {TABS.map((t) => (
        <TabItem key={t.name} {...t} active={t.name === active} onSelect={onSelect} />
      ))}
    </View>
  );
}
