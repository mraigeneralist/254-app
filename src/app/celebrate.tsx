import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Celebration } from '@/components/Celebration';
import { asIcon } from '@/components/ds';
import { useData } from '@/data/store';
import { showSnack } from '@/lib/ui';

const MILESTONE_BODY: Record<number, string> = {
  30: 'A whole month. Even if you miss a day now, you won’t drop below Day 30.',
  60: 'Two months. Your floor is now Day 60.',
  90: 'Three months strong. Your floor is now Day 90.',
  100: 'Triple digits. Your floor is now Day 100.',
  150: 'Five months of showing up. Your floor is now Day 150.',
  200: 'Two hundred days. Your floor is now Day 200.',
  250: 'Only four days to go. Your floor is now Day 250.',
};

/** S01/S02 milestones · S06 Habit Built! · S07 Addiction Broken! · S08 Challenge Complete! */
export default function Celebrate() {
  const router = useRouter();
  const { type, id, day } = useLocalSearchParams<{ type: string; id: string; day?: string }>();
  const habit = useData((s) => s.tables.habits[id]);
  const challenge = useData((s) => s.tables.challenges[id]);

  const missing = type === 'challenge' ? !challenge : !habit;
  useEffect(() => {
    if (missing) router.dismissTo('/today');
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toToday = () => router.dismissTo('/today');
  const share = (msg: string) => void Share.share({ message: msg }).catch(() => undefined);

  if (type === 'challenge' && challenge) {
    return (
      <>
        <Celebration
          tone="yellow"
          icon={asIcon(challenge.icon, 'trophy')}
          kicker={challenge.name}
          big={String(challenge.duration_days)}
          unit={`of ${challenge.duration_days} days`}
          title="Challenge Complete!"
          body="You showed up every single day. Set the next one?"
          cta="Back to Today"
          onCta={toToday}
          second="New challenge"
          onSecond={() => router.replace('/challenge/new')}
        />
      </>
    );
  }

  if (!habit) return null;

  if (type === 'built' || type === 'broken') {
    const built = type === 'built';
    return (
      <>
        <Celebration
          tone={built ? 'green' : 'orange'}
          icon={built ? 'sprout' : 'shield-check'}
          kicker={habit.name}
          big="254"
          unit={built ? 'days' : 'days clean'}
          title={built ? 'Habit Built!' : 'Addiction Broken!'}
          body={built ? 'It’s automatic now. This habit moves to Built on your Profile — it’s yours for good.' : '254 days without it. You’ve broken it for good — it moves to Broken on your Profile.'}
          cta={built ? 'See it on Profile' : 'Back to Today'}
          onCta={() => {
            if (built) router.dismissTo('/profile');
            else {
              toToday();
              showSnack({ icon: 'shield-check', text: `${habit.name} moved to Broken`, action: 'View', onAction: () => router.navigate('/profile') });
            }
          }}
          second={built ? 'Back to Today' : 'Share'}
          onSecond={built ? toToday : () => share(`254 days clean: I broke “${habit.name}” for good with 254.`)}
        />
      </>
    );
  }

  const n = Number(day) || 30;
  return (
    <>
      <Celebration
        tone={habit.kind === 'build' ? 'green' : 'orange'}
        icon="award"
        kicker={habit.name}
        big={String(n)}
        unit={habit.kind === 'build' ? 'days in a row' : 'days clean'}
        title={`${n}-Day Milestone reached!`}
        body={MILESTONE_BODY[n] ?? `Your floor is now Day ${n}.`}
        cta="Back to Today"
        onCta={toToday}
        second="Share"
        onSecond={() => share(`Day ${n} of “${habit.name}” — milestone reached on 254.`)}
      />
    </>
  );
}
