import { useRouter } from 'expo-router';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { useRef, useState, type ReactNode } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MilestoneTrack } from '@/components/Calendar';
import { Badge, BarChart, Button, Icon } from '@/components/ds';
import { Wordmark } from '@/components/Screen';
import { markIntroSeen } from '@/data/session';
import { colors, font, shadow, text } from '@/theme';

type Page = { dark?: boolean; kicker: string; title: string; body: string; hero: ReactNode };

const heroCard = { width: '100%' as const, backgroundColor: colors.surfaceCard, borderRadius: 28, padding: 22, boxShadow: shadow.md };

const PAGES: Page[] = [
  {
    dark: true,
    kicker: 'Welcome to 254',
    title: 'Good habits, kept for good.',
    body: 'Build the habits you want and break the ones you don’t — one check-in a day.',
    hero: (
      <View style={{ alignItems: 'center' }}>
        <Wordmark size={150} color={colors.cream100} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
          <Badge tone="green" variant="solid" icon="sprout">Build</Badge>
          <Badge tone="orange" variant="solid" icon="shield">Break</Badge>
          <Badge tone="yellow" variant="solid" icon="trophy">Challenge</Badge>
        </View>
      </View>
    ),
  },
  {
    kicker: 'Why 254 days',
    title: '254 days gives a habit its best chance.',
    body: 'A 2010 UCL study (Lally et al.) found new habits took 18 to 254 days to become automatic — about 66 on average. 254 is the top of that range, so going the distance helps a habit truly stick.',
    hero: (
      <View style={heroCard}>
        <Text style={text.over}>Days to become automatic</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
          <Text style={[font(900, 52, 1, -0.03), { color: colors.brown800 }]}>18</Text>
          <Icon name="arrow-right" size={22} color={colors.brown400} />
          <Text style={[font(900, 52, 1, -0.03), { color: colors.green600 }]}>254</Text>
        </View>
        <View style={{ height: 14, borderRadius: 999, backgroundColor: colors.cream200, marginTop: 22 }}>
          <View style={{ position: 'absolute', left: '7%', right: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: colors.green300 }} />
          <View style={{ position: 'absolute', left: '26%', top: -3, width: 4, height: 20, borderRadius: 2, backgroundColor: colors.brown800 }} />
          <View style={{ position: 'absolute', right: -2, top: -5, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.green600, boxShadow: '0px 0px 0px 4px #ffffff' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Text style={text.cap}>Fastest habits</Text>
          <Text style={[text.cap, { color: colors.brown800, fontFamily: font(800, 12).fontFamily }]}>Average ≈ 66</Text>
          <Text style={[text.cap, { color: colors.green600, fontFamily: font(800, 12).fontFamily }]}>Upper end</Text>
        </View>
      </View>
    ),
  },
  {
    kicker: 'Why good habits matter',
    title: 'Small daily actions compound.',
    body: 'Twenty pages, one run, a glass of water. Done every day, they add up to big changes in your health, focus and mood.',
    hero: (
      <View style={heroCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={text.t}>Pages read</Text>
          <Badge icon="trending-up">+20 a day</Badge>
        </View>
        <BarChart data={[6, 9, 12, 16, 21, 27, 34, 42, 52, 63, 76, 90].map((v) => ({ value: v }))} height={150} start="Day 1" end="Day 254" />
      </View>
    ),
  },
  {
    kicker: 'How 254 works',
    title: 'Check in daily. Milestones protect your progress.',
    body: 'Every check-in adds a day. Miss one and you fall back to your last milestone — not to zero.',
    hero: (
      <View style={[heroCard, { padding: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={text.t}>Read 20 pages</Text>
            <Text style={[text.cap, { marginTop: 3 }]}>Day 47 of 254</Text>
          </View>
          <Badge icon="shield-check">Day 30 saved</Badge>
        </View>
        <View style={{ marginTop: 20 }}>
          <MilestoneTrack day={47} />
        </View>
      </View>
    ),
  },
];

export default function Intro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const list = useRef<FlatList<Page>>(null);
  const page = PAGES[i];
  const last = i === PAGES.length - 1;
  useStatusBarStyle(page.dark ? 'light' : 'dark');

  const finish = async () => {
    await markIntroSeen();
    router.replace('/sign-up');
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setI(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={{ flex: 1, backgroundColor: page.dark ? colors.brown800 : colors.surfacePage }}>
      <FlatList
        ref={list}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(p) => p.kicker}
        renderItem={({ item: p }) => (
          <View style={{ width, flex: 1, backgroundColor: p.dark ? colors.brown800 : colors.surfacePage, paddingTop: insets.top + 48, paddingHorizontal: 24, paddingBottom: Math.max(36, insets.bottom + 16) + 76 }}>
            <View style={{ flex: 1, maxHeight: 330, minHeight: 220, alignItems: 'center', justifyContent: 'center' }}>{p.hero}</View>
            <View style={{ marginTop: 20 }}>
              <Text style={[text.over, { color: p.dark ? colors.green300 : colors.green600 }]}>{p.kicker}</Text>
              <Text style={[font(800, 30, 1.12, -0.02), { color: p.dark ? colors.cream100 : colors.textPrimary, marginTop: 10 }]}>{p.title}</Text>
              <Text style={[font(500, 15, 1.55), { color: p.dark ? colors.cream300 : colors.textSecondary, marginTop: 12 }]}>{p.body}</Text>
            </View>
          </View>
        )}
      />
      {!last && (
        <Pressable onPress={finish} hitSlop={12} style={{ position: 'absolute', top: insets.top + 14, right: 24 }}>
          <Text style={[font(700, 14), { color: page.dark ? colors.cream300 : colors.textSecondary }]}>Skip</Text>
        </Pressable>
      )}
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: Math.max(36, insets.bottom + 16), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {PAGES.map((_, k) => (
            <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 8, backgroundColor: k === i ? (page.dark ? colors.green300 : colors.brown800) : page.dark ? 'rgba(255,255,255,0.25)' : colors.cream400 }} />
          ))}
        </View>
        <Button
          variant={last || page.dark ? 'accent' : 'primary'}
          iconRight="arrow-right"
          onPress={() => {
            if (last) void finish();
            else list.current?.scrollToIndex({ index: i + 1, animated: true });
            if (!last) setI(i + 1);
          }}
        >
          {last ? 'Get started' : 'Next'}
        </Button>
      </View>
    </View>
  );
}
