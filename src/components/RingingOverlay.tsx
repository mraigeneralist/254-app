import { useEffect, useState } from 'react';
import { AppState, Modal, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TimerAlarm } from '../../modules/timer-alarm';
import { Button, Icon } from '@/components/ds';
import { stopBell } from '@/features/meditation';
import { colors, easing, font } from '@/theme';

/** Whether the native end-of-session bell is ringing right now (Android). */
export function useBellRinging(): boolean {
  const [ringing, setRinging] = useState(() => TimerAlarm?.isRinging() ?? false);
  useEffect(() => {
    if (!TimerAlarm) return;
    const sub = TimerAlarm.addListener('onRingingChange', (e) => setRinging(e.ringing));
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') setRinging(TimerAlarm!.isRinging());
    });
    return () => {
      sub.remove();
      app.remove();
    };
  }, []);
  return ringing;
}

/** Full-screen "Time's up" with a big Stop button while the bell rings — like a clock app's timer. */
export function RingingOverlay() {
  const ringing = useBellRinging();
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (ringing) pulse.value = withRepeat(withSequence(withTiming(1.12, { duration: 700, easing: easing.out }), withTiming(1, { duration: 700, easing: easing.out })), -1);
    else pulse.value = 1;
  }, [ringing, pulse]);
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Modal visible={ringing} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={stopBell}>
      <View style={{ flex: 1, backgroundColor: colors.brown800, paddingTop: insets.top, paddingBottom: Math.max(40, insets.bottom + 24), paddingHorizontal: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(155,177,103,0.18)' }, halo]} />
            <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(155,177,103,0.28)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell-ring" size={56} color={colors.green300} />
            </View>
          </View>
          <Text style={[font(800, 34, 1.1, -0.02), { color: colors.cream100, marginTop: 36, textAlign: 'center' }]}>Time’s up</Text>
          <Text style={[font(500, 16, 1.5), { color: colors.cream300, marginTop: 10, textAlign: 'center' }]}>Your meditation session is complete.</Text>
        </View>
        <Button size="lg" fullWidth variant="accent" iconLeft="square" onPress={stopBell} textStyle={{ fontSize: 19 }} style={{ height: 64 }}>
          Stop
        </Button>
      </View>
    </Modal>
  );
}
