import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';

type TimerAlarmNative = {
  schedule(atMillis: number, title: string, body: string, sound: string): boolean;
  cancel(): void;
  stop(): void;
  isRinging(): boolean;
  addListener(event: 'onRingingChange', listener: (e: { ringing: boolean }) => void): EventSubscription;
};

/** Android-only native alarm that rings until stopped. `null` on other platforms. */
export const TimerAlarm = requireOptionalNativeModule<TimerAlarmNative>('TimerAlarm');
