import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { colors } from '@/theme';

/** Solid page-colored strip behind the system status bar, so content never scrolls under the clock/icons (design: Phone status bar sits on the page background). */
export function StatusBarScrim({ color = colors.surfacePage }: { color?: string }) {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');
  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: color, zIndex: 100 }} />;
}
