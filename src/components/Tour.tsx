/**
 * Guided tour (O09–O15): dims the screen, cuts a spotlight around the target with a green ring,
 * and shows a coach card. Targets register themselves with `useTourTarget(key)`.
 */
import { useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '@/components/ds';
import { useUi } from '@/lib/ui';
import { colors, font, ring, shadow, text } from '@/theme';

export type TourKey = 'markDone' | 'fab' | 'segChallenges' | 'tab-tasks' | 'tab-meditate' | 'tab-note' | 'tab-profile';

export type ViewRef = ComponentRef<typeof View>;

const targets = new Map<TourKey, RefObject<ViewRef | null>>();

/** Attach the returned ref to the element the tour should highlight. */
export function useTourTarget(key: TourKey) {
  const ref = useRef<ViewRef>(null);
  useEffect(() => {
    targets.set(key, ref);
    return () => {
      if (targets.get(key) === ref) targets.delete(key);
    };
  }, [key]);
  return ref;
}

export const TOUR_STEPS: { key: TourKey; title: string; body: string; r?: number }[] = [
  { key: 'markDone', title: 'Mark done', body: 'Did it today? Tap Mark done. Each check-in adds one day to your count.' },
  { key: 'fab', title: 'Add more', body: 'Add a habit to build, an addiction to break or a new challenge.' },
  { key: 'segChallenges', title: 'Challenges', body: 'Set yourself a 30, 60 or 90-day challenge. No milestones here — miss a day and it fails, so you start again.' },
  { key: 'tab-tasks', title: 'Tasks', body: 'Your daily to-dos with a calendar. Overdue tasks roll into today.', r: 20 },
  { key: 'tab-meditate', title: 'Meditate', body: 'A simple timer — 5, 10, 15 minutes or your own length. Every session is saved.', r: 20 },
  { key: 'tab-note', title: 'Note To Self', body: 'A private journal only you can read. Write a line a day.', r: 20 },
  { key: 'tab-profile', title: 'Profile stats', body: 'Streaks, milestones, check-in heatmap and everything you’ve built or broken.', r: 20 },
];

type Rect = { x: number; y: number; w: number; h: number };

function roundedRectPath({ x, y, w, h }: Rect, r: number) {
  const rr = Math.min(r, h / 2, w / 2);
  return `M${x + rr},${y} H${x + w - rr} A${rr},${rr} 0 0 1 ${x + w},${y + rr} V${y + h - rr} A${rr},${rr} 0 0 1 ${x + w - rr},${y + h} H${x + rr} A${rr},${rr} 0 0 1 ${x},${y + h - rr} V${y + rr} A${rr},${rr} 0 0 1 ${x + rr},${y} Z`;
}

export function TourOverlay({ onFinish }: { onFinish: () => void }) {
  const step = useUi((s) => s.tourStep);
  const { width: W, height: H } = useWindowDimensions();
  const [rect, setRect] = useState<Rect | null>(null);
  const def = step > 0 ? TOUR_STEPS[step - 1] : null;

  useEffect(() => {
    if (!def) return;
    setRect(null);
    let tries = 0;
    const measure = () => {
      const node = targets.get(def.key)?.current;
      if (!node) {
        if (tries++ < 10) setTimeout(measure, 100);
        else setRect({ x: W / 2 - 40, y: H / 2 - 20, w: 80, h: 40 }); // target not on screen: center fallback
        return;
      }
      node.measureInWindow((x, y, w, h) => {
        if (w === 0 && tries++ < 10) setTimeout(measure, 100);
        else setRect({ x: x - 4, y: y - 4, w: w + 8, h: h + 8 });
      });
    };
    measure();
  }, [def, W, H]);

  if (!def) return null;
  const total = TOUR_STEPS.length;
  const last = step === total;
  const go = (n: number) => useUi.setState({ tourStep: n });
  const finish = () => {
    useUi.setState({ tourStep: 0 });
    onFinish();
  };
  const r = def.r ?? 999;
  const above = rect ? rect.y + rect.h / 2 > H / 2 : true;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={finish}>
      <View style={{ flex: 1 }}>
        {rect && (
          <>
            <Svg width={W} height={H} style={{ position: 'absolute' }}>
              <Path d={`M0,0 H${W} V${H} H0 Z ${roundedRectPath(rect, r)}`} fill={colors.coachScrim} fillRule="evenodd" />
            </Svg>
            <View pointerEvents="none" style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: Math.min(r, rect.h / 2), boxShadow: ring(3, colors.green300) }} />
          </>
        )}
        {rect && (
          <View style={[{ position: 'absolute', left: 16, right: 16, backgroundColor: colors.surfaceCard, borderRadius: 24, padding: 20, boxShadow: shadow.lg }, above ? { bottom: H - rect.y + 18 } : { top: rect.y + rect.h + 18 }]}>
            <Text style={[text.over, { color: colors.green600 }]}>{`Step ${step} of ${total}`}</Text>
            <Text style={[font(800, 19, 1.2), { color: colors.textPrimary, marginTop: 8 }]}>{def.title}</Text>
            <Text style={[text.sm, { fontSize: 14, lineHeight: 20, marginTop: 6 }]}>{def.body}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <Pressable hitSlop={10} onPress={() => (step > 1 ? go(step - 1) : finish())}>
                <Text style={[font(700, 14), { color: colors.textSecondary }]}>{step > 1 ? 'Back' : 'Skip tour'}</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {step > 1 && !last && (
                  <Pressable hitSlop={10} onPress={finish}>
                    <Text style={[font(700, 14), { color: colors.textSecondary }]}>Skip</Text>
                  </Pressable>
                )}
                <Button size="sm" iconRight={last ? 'check' : 'arrow-right'} onPress={() => (last ? finish() : go(step + 1))}>{last ? 'Finish' : 'Next'}</Button>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
