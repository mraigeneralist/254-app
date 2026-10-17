import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge } from '@/components/ds';
import { Fab } from '@/components/Fab';
import { Banner, EmptyState } from '@/components/Feedback';
import { HabitCard } from '@/components/HabitCard';
import { MissedNotice } from '@/components/MissedNotice';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { SyncStatus } from '@/components/SyncStatus';
import { useTabBarHeight } from '@/components/TabBar';
import { TodayHeader, type TodaySegment } from '@/components/TodayHeader';
import { TourOverlay, useTourTarget } from '@/components/Tour';
import { restartChallenge } from '@/data/actions';
import { useChallengeViews, useHabitViews, useProfile } from '@/data/selectors';
import { useSync } from '@/data/sync';
import { challengeIcon, doChallengeCheckIn, doChallengeUndo, doHabitCheckIn, doHabitUndo, habitIcon } from '@/features/checkins';
import { useMissedQueue } from '@/features/missed';
import { useToday } from '@/hooks/useToday';
import { longDate } from '@/lib/format';
import { showSnack, useUi } from '@/lib/ui';

export default function TodayScreen() {
  const router = useRouter();
  const today = useToday();
  const profile = useProfile();
  const habits = useHabitViews(today);
  const challenges = useChallengeViews(today);
  const online = useSync((s) => s.online);
  const tabBar = useTabBarHeight();
  const [segment, setSegment] = useState<TodaySegment>('Build');
  const markDoneRef = useTourTarget('markDone');
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const active = useMemo(() => habits.filter((v) => v.habit.status === 'active' && !v.state.completedDate), [habits]);
  const build = active.filter((v) => v.habit.kind === 'build');
  const brk = active.filter((v) => v.habit.kind === 'break');
  const activeChallenges = challenges.filter((v) => v.state.status === 'active');
  const best = Math.max(0, ...active.map((v) => v.state.current));

  // guided tour: start once Today is on screen after onboarding / "Replay tour"
  const tourRequested = useUi((s) => s.tourRequested);
  useFocusEffect(
    useCallback(() => {
      if (!tourRequested) return;
      setSegment(build.length === 0 && brk.length > 0 ? 'Break' : 'Build');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      const t = setTimeout(() => useUi.setState({ tourRequested: false, tourStep: 1 }), 600);
      return () => clearTimeout(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tourRequested]),
  );

  // missed-day / failed-challenge notices
  const { queue, acknowledge } = useMissedQueue(habits, challenges, today);
  const notice = queue[0] ?? null;

  const list = segment === 'Build' ? build : segment === 'Break' ? brk : null;
  const doneCount = (segment === 'Challenges' ? activeChallenges.filter((v) => v.state.checkedInToday) : (list ?? []).filter((v) => v.state.checkedInToday)).length;
  const totalCount = segment === 'Challenges' ? activeChallenges.length : (list ?? []).length;

  const summary =
    totalCount === 0 && active.length === 0 ? (
      <Badge tone="green" variant="plain" icon="sprout">Let’s get started</Badge>
    ) : (
      <>
        <Badge tone="green" variant="plain" icon="circle-check">{`${doneCount} of ${totalCount} ${segment === 'Break' ? 'clean' : 'done'}`}</Badge>
        <Badge tone="orange" variant="plain" icon="flame">{best > 0 ? `Best: Day ${best}` : 'Day 1 starts today'}</Badge>
      </>
    );

  const onFab = () => {
    if (segment === 'Challenges') router.push('/challenge/new');
    else router.push({ pathname: '/habit/new', params: { kind: segment === 'Build' ? 'build' : 'break' } });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: tabBar }} showsVerticalScrollIndicator={false}>
        <TodayHeader dateLabel={longDate(today)} name={profile.name} segment={segment} onSegment={setSegment} summary={summary} status={<SyncStatus />} onBell={() => router.push('/settings/notifications')} />
        <View style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}>
          {!online && <Banner text="You’re offline — check-ins will sync when you’re back" />}

          {segment !== 'Challenges' &&
            list!.map((v, i) => (
              <HabitCard
                key={v.habit.id}
                item={{ id: v.habit.id, name: v.habit.name, day: v.state.current, icon: habitIcon(v) }}
                kind={v.habit.kind}
                done={v.state.checkedInToday}
                actionRef={i === 0 ? markDoneRef : undefined}
                onPress={() => router.push(`/habit/${v.habit.id}`)}
                onCheckIn={() => doHabitCheckIn(v, today, router)}
                onUndo={() => doHabitUndo(v, today)}
              />
            ))}

          {segment === 'Challenges' &&
            activeChallenges.map((v) => (
              <HabitCard
                key={v.challenge.id}
                item={{ id: v.challenge.id, name: v.challenge.name, day: v.state.day, total: v.state.durationDays, icon: challengeIcon(v) }}
                kind="challenge"
                done={v.state.checkedInToday}
                onPress={() => router.push(`/challenge/${v.challenge.id}`)}
                onCheckIn={() => doChallengeCheckIn(v, today, router)}
                onUndo={() => doChallengeUndo(v, today)}
              />
            ))}

          {segment === 'Build' && build.length === 0 && (
            <EmptyState icon="sprout" title="No habits yet" body="Start with one small thing you can do every day — even two minutes counts." cta="New habit" onCta={onFab} />
          )}
          {segment === 'Break' && brk.length === 0 && (
            <EmptyState icon="shield" tone="orange" title="Nothing to break yet" body="Junk food, late-night scrolling, anything you want out of your life. Stay clean for 254 days and it’s gone." cta="New addiction to break" onCta={onFab} />
          )}
          {segment === 'Challenges' && activeChallenges.length === 0 && (
            <EmptyState icon="trophy" tone="yellow" title="No challenges yet" body="Pick a finish line — 30, 60 or 90 days — and show up every day until you cross it." cta="New challenge" onCta={onFab} />
          )}
        </View>
      </ScrollView>
      {totalCount > 0 && <Fab onPress={onFab} label={segment === 'Challenges' ? 'New challenge' : segment === 'Build' ? 'New habit' : 'New addiction to break'} tour />}
      <StatusBarScrim />

      <MissedNotice
        item={notice}
        count={queue.length > 1 ? `1 of ${queue.length}` : undefined}
        isLast={queue.length <= 1}
        onNext={() => notice && acknowledge(notice)}
        onRestart={() => {
          if (!notice?.challengeId) return;
          const old = challenges.find((c) => c.challenge.id === notice.challengeId)?.challenge;
          acknowledge(notice);
          if (old) {
            restartChallenge(old, today);
            setSegment('Challenges');
            showSnack({ icon: 'rotate-ccw', text: `${old.name} restarted · Day 1 starts today` });
          }
        }}
      />
      <TourOverlay onFinish={() => undefined} />
    </View>
  );
}
