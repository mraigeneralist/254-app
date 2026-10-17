import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

/** Sets the status-bar icon colour whenever the screen gains focus (screens stay mounted in stacks/tabs). */
export function useStatusBarStyle(style: 'light' | 'dark') {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style, true);
    }, [style]),
  );
}
