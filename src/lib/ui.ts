import { create } from 'zustand';
import type { IconName } from '@/components/ds';

export type SnackSpec = {
  text: string;
  icon?: IconName;
  action?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
  /** distance from the bottom of the screen (above tab bar by default) */
  bottom?: number;
  duration?: number;
};

type UiState = {
  snack: (SnackSpec & { key: number }) | null;
  /** guided tour step (1-based) or 0 when not running */
  tourStep: number;
  /** one-shot request to start the tour once Today is on screen */
  tourRequested: boolean;
};

export const useUi = create<UiState>(() => ({ snack: null, tourStep: 0, tourRequested: false }));

export function showSnack(spec: SnackSpec) {
  useUi.setState({ snack: { ...spec, key: Date.now() } });
}
export const hideSnack = () => useUi.setState({ snack: null });

export const requestTour = () => useUi.setState({ tourRequested: true });
