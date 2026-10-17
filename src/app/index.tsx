import { View } from 'react-native';
import { colors } from '@/theme';

/** Entry: the root layout's gate redirects from here to intro / log-in / onboarding / Today. */
export default function Index() {
  return <View style={{ flex: 1, backgroundColor: colors.brown800 }} />;
}
