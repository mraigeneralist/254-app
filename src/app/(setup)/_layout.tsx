import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function SetupLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfacePage }, animation: 'slide_from_right' }} />;
}
