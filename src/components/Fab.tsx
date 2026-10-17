import { View } from 'react-native';
import { IconButton, type IconButtonVariant, type IconName } from '@/components/ds';
import { useTabBarHeight } from './TabBar';
import { useTourTarget } from './Tour';

type Props = { onPress?: () => void; icon?: IconName; variant?: IconButtonVariant; label?: string; tour?: boolean };

/** Floating action button, 20 from the right and 44 above the tab bar (kit.jsx Fab bottom 132 on an 88 tab bar). */
export function Fab({ onPress, icon = 'plus', variant = 'fab', label = 'Add', tour }: Props) {
  const tabBar = useTabBarHeight();
  const ref = useTourTarget('fab');
  return (
    <View ref={tour ? ref : undefined} collapsable={false} style={{ position: 'absolute', right: 20, bottom: tabBar + 44, zIndex: 45, borderRadius: 28 }}>
      <IconButton icon={icon} variant={variant} size={56} onPress={onPress} label={label} />
    </View>
  );
}
