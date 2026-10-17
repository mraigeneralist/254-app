import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, type IconButtonVariant, type IconName } from '@/components/ds';
import { TAB_BAR_BASE_HEIGHT } from './TabBar';

type Props = { onPress?: () => void; icon?: IconName; variant?: IconButtonVariant; label?: string };

/** Floating action button, 20 from the right and 44 above the tab bar (kit.jsx Fab bottom 132 on an 88 tab bar). */
export function Fab({ onPress, icon = 'plus', variant = 'fab', label = 'Add' }: Props) {
  const insets = useSafeAreaInsets();
  const tabBar = TAB_BAR_BASE_HEIGHT + Math.max(18, insets.bottom + 6);
  return (
    <View style={{ position: 'absolute', right: 20, bottom: tabBar + 44, zIndex: 45 }}>
      <IconButton icon={icon} variant={variant} size={56} onPress={onPress} label={label} />
    </View>
  );
}
