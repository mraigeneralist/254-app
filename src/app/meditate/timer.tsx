import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, ProgressRing } from '@/components/ds';
import { Dialog } from '@/components/Feedback';
import { addMeditationSession } from '@/data/actions';
import { toDateKey } from '@/domain/dates';
import { elapsedMs, finishTimer, minutesToSave, pauseTimer, remainingMs, resumeTimer, stopTimer, useTimer, type TimerState } from '@/features/meditation';
import { bellById, playBell } from '@/features/bells';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { colors, font, text } from '@/theme';

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};


function save(t: TimerState, minutes: number) {
  addMeditationSession({ date: toDateKey(new Date(t.startedAt)), started_at: new Date(t.startedAt).toISOString(), planned_minutes: t.plannedMin, actual_minutes: minutes });
}

/** M03 running · M04 paused · M05 end early. Countdown derives from the end time, so it's exact after locking/backgrounding. */
export default function TimerScreen() {
  useKeepAwake();
  useStatusBarStyle('light');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const timer = useTimer((s) => s.timer);
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(false);
  const wasRunning = useRef(false);
  const finishing = useRef(false);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, []);

  // reached zero (also when coming back after the screen was off)
  useEffect(() => {
    if (!timer || finishing.current || timer.endAt === null || remainingMs(timer, now) > 0) return;
    finishing.current = true;
    (async () => {
      const t = finishTimer();
      if (!t) return;
      save(t, t.plannedMin);
      // The scheduled end alarm rings the bell. Only if there is none (notifications off) and we're
      // finishing live (not returning long after the end), play the bell from the app instead.
      if (!t.notifId && t.endAt !== null && Date.now() - t.endAt < 5000) playBell(bellById(t.sound).id);
      router.replace({ pathname: '/meditate/done', params: { min: String(t.plannedMin), at: String(t.startedAt) } });
    })();
  }, [timer, now, router]);

  useEffect(() => {
    if (!timer && !finishing.current) router.back();
  }, [timer, router]);

  const askEnd = () => {
    if (!timer) return;
    wasRunning.current = timer.endAt !== null;
    void pauseTimer();
    setConfirm(true);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      askEnd();
      return true;
    });
    return () => sub.remove();
  });

  if (!timer) return <View style={{ flex: 1, backgroundColor: colors.brown800 }} />;
  const paused = timer.endAt === null;
  const left = remainingMs(timer, now);
  const pct = (elapsedMs(timer, now) / (timer.plannedMin * 60_000)) * 100;
  const saveMin = minutesToSave(timer, now);
  const el = Math.floor(elapsedMs(timer, now) / 1000);

  return (
    <View style={{ flex: 1, backgroundColor: colors.brown800, paddingTop: insets.top }}>
      <Text style={[text.over, { color: colors.cream300, textAlign: 'center', marginTop: 28 }]}>{`${timer.plannedMin} min session`}</Text>
      <View style={{ alignItems: 'center', marginTop: 70 }}>
        <View style={{ position: 'absolute', top: -26, width: 322, height: 322, borderRadius: 161, backgroundColor: 'rgba(155,177,103,0.10)' }} />
        <ProgressRing value={pct} max={100} size={270} stroke={10} color={colors.green300} track="rgba(255,255,255,0.12)" textColor={colors.cream100} label={fmt(left)} caption={paused ? 'Paused' : 'remaining'} animated={false} />
      </View>
      <Text style={[font(500, 15, 1.5), { color: colors.cream300, textAlign: 'center', marginTop: 56, marginHorizontal: 32 }]}>
        {paused ? 'Take your time. Resume when you’re ready.' : 'Breathe in for four, out for six.'}
      </Text>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(80, insets.bottom + 56), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        <Pressable onPress={askEnd} hitSlop={16} style={{ width: 64, alignItems: 'center' }}>
          <Text style={[font(700, 15), { color: colors.cream300 }]}>End</Text>
        </Pressable>
        <IconButton icon={paused ? 'play' : 'pause'} variant="fab" size={80} label={paused ? 'Resume' : 'Pause'} onPress={() => void (paused ? resumeTimer() : pauseTimer())} />
        <View style={{ width: 64 }} />
      </View>

      <Dialog
        visible={confirm}
        onClose={() => {
          setConfirm(false);
          if (wasRunning.current) void resumeTimer();
        }}
        icon="square"
        tone="green"
        title="End session early?"
        body={saveMin ? `You’ve meditated for ${Math.floor(el / 60)} min ${el % 60} s. We’ll save ${saveMin} ${saveMin === 1 ? 'minute' : 'minutes'} to your history.` : 'Less than a minute so far — this session won’t be saved.'}
        cancel="Keep going"
        confirm={saveMin ? 'End & save' : 'End'}
        onCancel={() => {
          setConfirm(false);
          if (wasRunning.current) void resumeTimer();
        }}
        onConfirm={async () => {
          setConfirm(false);
          finishing.current = true;
          const t = await stopTimer();
          const m = t ? minutesToSave(t) : null;
          if (t && m) {
            save(t, m);
            router.replace({ pathname: '/meditate/done', params: { min: String(m), at: String(t.startedAt), early: '1' } });
          } else router.back();
        }}
      />
    </View>
  );
}
