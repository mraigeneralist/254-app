import {
  Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, Urbanist_700Bold, Urbanist_800ExtraBold,
  Urbanist_900Black, useFonts,
} from '@expo-google-fonts/urbanist';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SnackHost } from '@/components/Feedback';
import { RingingOverlay } from '@/components/RingingOverlay';
import { Splash } from '@/components/Splash';
import { useProfile } from '@/data/selectors';
import { initSession, useSession } from '@/data/session';
import { AppEffects } from '@/features/AppEffects';
import { loadTimer } from '@/features/meditation';
import { cancelAllReminders } from '@/features/notifications';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Sends the user to the right place for their state: intro → auth → onboarding → app. */
function useGate(ready: boolean) {
  const router = useRouter();
  const segments = useSegments();
  const session = useSession((s) => s.session);
  const introSeen = useSession((s) => s.introSeen);
  const profile = useProfile();
  const onboarded = !!session && profile.onboarding_completed;
  const group = segments[0] as string | undefined;

  useEffect(() => {
    if (!ready || group === 'set-password') return;
    if (!session) {
      if (group !== '(auth)') router.replace(introSeen ? '/log-in' : '/intro');
    } else if (!onboarded) {
      if (group !== '(setup)') router.replace('/first-habit');
    } else if (!group || group === '(auth)' || group === '(setup)') {
      router.replace('/today');
    }
  }, [ready, session, onboarded, introSeen, group, router]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, Urbanist_700Bold, Urbanist_800ExtraBold, Urbanist_900Black,
  });
  const initialized = useSession((s) => s.initialized);
  const session = useSession((s) => s.session);
  const dataReady = useSession((s) => s.dataReady);
  const [minSplash, setMinSplash] = useState(true);

  useEffect(() => {
    void initSession();
    void loadTimer();
    const t = setTimeout(() => setMinSplash(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // sign-out: clear scheduled reminders
  const uid = session?.user.id;
  useEffect(() => {
    if (initialized && !uid) void cancelAllReminders().catch(() => undefined);
  }, [initialized, uid]);

  const ready = initialized && (!session || dataReady);
  useGate(ready);

  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.brown800 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surfacePage }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfacePage }, animation: 'slide_from_right' }}>
          <Stack.Screen name="celebrate" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="meditate/timer" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="habit/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="challenge/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="note/new" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        {session && dataReady && <AppEffects />}
        <SnackHost />
        <RingingOverlay />
        {(!ready || minSplash) && <Splash caption={session && !dataReady ? 'Loading your streaks…' : undefined} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
