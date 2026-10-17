import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BarChart, Card, Icon, IconButton, type IconName } from '@/components/ds';
import { EmptyState } from '@/components/Feedback';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { useTabBarHeight } from '@/components/TabBar';
import { AvatarEditor } from '@/components/AvatarEditor';
import { useChallengeViews, useEmail, useHabitViews, useProfile } from '@/data/selectors';
import { live, useData } from '@/data/store';
import { challengeIcon, habitIcon } from '@/features/checkins';
import { computeStats } from '@/features/stats';
import { useToday } from '@/hooks/useToday';
import { dayMonth, dayMonthYear, num, plural } from '@/lib/format';
import { colors, font, kindTone, ring, shadow, text, tones, type ToneName } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Stat({ v, l, icon, tone }: { v: string | number; l: string; icon: IconName; tone: ToneName }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceCard, borderRadius: 20, padding: 14, boxShadow: shadow.xs }}>
      <Icon name={icon} size={18} color={tones[tone].d} />
      <Text style={[font(800, 22, 1), { color: colors.textPrimary, marginTop: 10 }]}>{v}</Text>
      <Text style={[text.cap, { marginTop: 6 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{l}</Text>
    </View>
  );
}

function Labels({ items }: { items: string[] }) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 8, paddingHorizontal: 2 }}>
      {items.map((x, i) => (
        <Text key={i} style={[text.cap, { fontSize: 11, flex: 1, textAlign: 'center' }]}>{x}</Text>
      ))}
    </View>
  );
}

type ListItem = { key: string; name: string; sub: string; icon: IconName; tone: ToneName; href: Href };

function ListBlock({ title, items, empty }: { title: string; items: ListItem[]; empty: string }) {
  const router = useRouter();
  return (
    <Card title={title} style={{ marginTop: 12 }}>
      {items.length ? (
        items.map((it, i) => (
          <Pressable key={it.key} onPress={() => router.push(it.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.cream200 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: tones[it.tone].t, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={it.icon} size={16} color={tones[it.tone].d} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={text.t} numberOfLines={1}>{it.name}</Text>
              <Text style={text.cap}>{it.sub}</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.brown300} />
          </Pressable>
        ))
      ) : (
        <Text style={text.sm}>{empty}</Text>
      )}
    </Card>
  );
}

const HEAT = [colors.cream200, colors.green100, colors.green200, colors.green300, colors.green500];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const tabBar = useTabBarHeight();
  const profile = useProfile();
  const email = useEmail();
  const habits = useHabitViews(today);
  const challenges = useChallengeViews(today);
  const sessionRows = useData((s) => s.tables.meditation_sessions);
  const sessions = useMemo(() => live(sessionRows), [sessionRows]);
  const st = useMemo(() => computeStats(habits, challenges, sessions, today), [habits, challenges, sessions, today]);
  const [allStreaks, setAllStreaks] = useState(false);

  const empty = st.totalCheckins === 0 && st.meditationSessions === 0 && challenges.every((c) => c.checkins.length === 0);
  const max30 = Math.max(1, ...st.last30.map((d) => d.count));
  const maxHeat = Math.max(1, ...st.heatmap.map((d) => d.count));
  const maxMed = Math.max(1, ...st.medWeeks.map((w) => w.minutes));
  const firstActive = habits.find((v) => !v.state.completedDate);
  const nearestBuild = habits.filter((v) => v.habit.kind === 'build' && !v.state.completedDate).sort((a, b) => b.state.current - a.state.current)[0];
  const nearestBreak = habits.filter((v) => v.habit.kind === 'break' && !v.state.completedDate).sort((a, b) => b.state.current - a.state.current)[0];

  // month labels under the heatmap
  const heatLabels = Array.from({ length: 6 }, (_, i) => {
    const d = st.heatmap[Math.min(st.heatmap.length - 1, Math.round((i * 23 * 7) / 5))].date;
    return new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: tabBar + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'flex-end', paddingTop: 14 }}>
          <IconButton icon="settings" size={40} label="Settings" onPress={() => router.push('/settings')} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <AvatarEditor name={profile.name || email} size={68} />
          <View style={{ flex: 1 }}>
            <Text style={text.h1} numberOfLines={1}>{profile.name || 'Your profile'}</Text>
            <Text style={[text.sm, { marginTop: 4 }]} numberOfLines={1}>{email}</Text>
            <Text style={[text.cap, { marginTop: 2 }]}>{`Member since ${dayMonthYear(profile.created_at.slice(0, 10))}`}</Text>
          </View>
        </View>

        <View style={{ gap: 8, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat v={st.building} l="Building" icon="sprout" tone="green" />
            <Stat v={st.breaking} l="Breaking" icon="shield" tone="orange" />
            <Stat v={st.built.length} l="Built" icon="badge-check" tone="green" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat v={st.broken.length} l="Broken" icon="shield-check" tone="orange" />
            <Stat v={st.challenges.active.length} l="Challenges" icon="trophy" tone="yellow" />
            <Stat v={num(st.meditationMinutes)} l="Meditation min" icon="flower-2" tone="purple" />
          </View>
        </View>

        {empty ? (
          <Card style={{ marginTop: 14 }}>
            <EmptyState icon="chart-column" pad={20} title="Your stats start here" body={firstActive ? `Check in on ${firstActive.habit.name} today and your streaks, heatmap and milestones will appear.` : 'Check in on a habit today and your streaks, heatmap and milestones will appear.'} cta="Go to Today" ctaIcon="sun" onCta={() => router.navigate('/today')} />
          </Card>
        ) : (
          <>
            {st.streaks.length > 0 && (
              <Card title="Current streaks" style={{ marginTop: 14 }}>
                <View style={{ gap: 12 }}>
                  {(allStreaks ? st.streaks : st.streaks.slice(0, 6)).map((s) => (
                    <Pressable key={s.id} onPress={() => router.push(s.href as Href)}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={[font(600, 13), { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{s.name}</Text>
                        <Text style={[font(800, 13), { color: colors.textPrimary }]}>{s.day}</Text>
                      </View>
                      <ProgressBar value={s.day} max={s.max} tone={kindTone[s.kind]} />
                    </Pressable>
                  ))}
                </View>
                {st.streaks.length > 6 && (
                  <Pressable onPress={() => setAllStreaks(!allStreaks)} hitSlop={8}>
                    <Text style={[text.cap, { marginTop: 12, color: colors.green600, fontFamily: font(700, 12).fontFamily }]}>{allStreaks ? 'Show less' : `See all ${st.streaks.length}`}</Text>
                  </Pressable>
                )}
              </Card>
            )}
            {st.longest && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, padding: 16, borderRadius: 24, backgroundColor: colors.brown800 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="flame" size={22} color={colors.yellow500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[font(600, 12), { color: colors.cream300 }]}>Longest streak ever</Text>
                  <Text style={[font(800, 17), { color: colors.white, marginTop: 2 }]} numberOfLines={1}>{`${plural(st.longest.days, 'day')} · ${st.longest.name}`}</Text>
                </View>
              </View>
            )}
            <Card title="Check-ins · last 30 days" style={{ marginTop: 12 }}>
              <BarChart data={st.last30.map((d) => ({ value: (d.count / max30) * 100 }))} height={110} gap={3} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={[text.cap, { fontSize: 11 }]}>{dayMonth(st.last30[0].date)}</Text>
                <Text style={[text.cap, { fontSize: 11 }]}>{dayMonth(st.last30[15].date)}</Text>
                <Text style={[text.cap, { fontSize: 11 }]}>Today</Text>
              </View>
            </Card>
            <Card title="Check-in heatmap" style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {Array.from({ length: 24 }, (_, w) => (
                  <View key={w} style={{ flex: 1, gap: 3 }}>
                    {st.heatmap.slice(w * 7, w * 7 + 7).map((d) => {
                      const lv = d.future || d.count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((d.count / maxHeat) * 4)));
                      return <View key={d.date} style={{ aspectRatio: 1, borderRadius: 3, backgroundColor: d.future ? 'transparent' : HEAT[lv] }} />;
                    })}
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                {heatLabels.map((m, i) => (
                  <Text key={i} style={[text.cap, { fontSize: 11 }]}>{m}</Text>
                ))}
              </View>
            </Card>
            <Card title="Meditation per week" style={{ marginTop: 12 }}>
              <BarChart data={st.medWeeks.map((w) => ({ value: (w.minutes / maxMed) * 100 }))} height={100} />
              <Labels items={st.medWeeks.map((w, i) => (i % 2 === 0 || i === 7 ? dayMonth(w.week) : ''))} />
            </Card>
            {st.milestones.length > 0 && (
              <Card title={`Milestones earned · ${st.milestones.length}`} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
                  {st.milestones.slice(0, 6).map((m, i) => (
                    <View key={i} style={{ width: '33.33%', alignItems: 'center' }}>
                      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: m.day >= 100 ? colors.yellow500 : colors.green100, boxShadow: `${ring(4, colors.white)}, ${ring(5, colors.cream300)}` }}>
                        <Text style={[font(900, 18), { color: colors.brown800 }]}>{m.day}</Text>
                      </View>
                      <Text style={[text.cap, { fontSize: 11, marginTop: 8, lineHeight: 14, textAlign: 'center', paddingHorizontal: 4 }]} numberOfLines={2}>{m.name}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </>
        )}

        <ListBlock
          title="Built habits"
          items={st.built.map((v) => ({ key: v.habit.id, name: v.habit.name, sub: `Built ${dayMonthYear(v.state.completedDate!)} · started ${dayMonthYear(v.habit.start_date)}`, icon: habitIcon(v), tone: 'green', href: `/habit/${v.habit.id}` }))}
          empty={nearestBuild ? `None yet. ${nearestBuild.habit.name} is ${254 - nearestBuild.state.current} days away from Day 254.` : 'Habits you keep for 254 days land here.'}
        />
        <ListBlock
          title="Broken addictions"
          items={st.broken.map((v) => ({ key: v.habit.id, name: v.habit.name, sub: `Broken ${dayMonthYear(v.state.completedDate!)} · 254 days clean`, icon: habitIcon(v), tone: 'orange', href: `/habit/${v.habit.id}` }))}
          empty={nearestBreak ? `None yet. ${nearestBreak.habit.name} is ${254 - nearestBreak.state.current} days away.` : 'Addictions you break for 254 days land here.'}
        />
        <ListBlock
          title={`Challenges · ${st.challenges.active.length} active · ${st.challenges.completed.length} done · ${st.challenges.failed.length} failed`}
          items={[...st.challenges.active, ...st.challenges.completed, ...st.challenges.failed].map((c) => ({
            key: c.challenge.id,
            name: c.challenge.name,
            sub:
              c.state.status === 'active' ? `Active · Day ${c.state.day} of ${c.state.durationDays}`
              : c.state.status === 'completed' ? `Completed ${dayMonthYear(c.state.completedDate!)}`
              : `Failed ${dayMonthYear(c.state.failedDate!)} · reached Day ${c.state.day} of ${c.state.durationDays}`,
            icon: c.state.status === 'completed' ? 'badge-check' : c.state.status === 'failed' ? 'triangle-alert' : challengeIcon(c),
            tone: c.state.status === 'completed' ? 'green' : c.state.status === 'failed' ? 'orange' : 'yellow',
            href: `/challenge/${c.challenge.id}`,
          }))}
          empty="No challenges yet."
        />
      </ScrollView>
      <StatusBarScrim />
    </View>
  );
}
