import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { toDateKey, type DateKey } from '@/domain/dates';

/**
 * The device's local date, updated at local midnight and whenever the app returns to the
 * foreground (so a phone that was off overnight, or a timezone change, is picked up immediately).
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => toDateKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        setToday(toDateKey());
        arm();
      }, Math.min(next.getTime() - now.getTime(), 2 ** 31 - 1));
    };
    arm();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        setToday(toDateKey());
        arm();
      }
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
