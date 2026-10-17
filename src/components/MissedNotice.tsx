import { Text, View } from 'react-native';
import { Badge, Button, Icon, type IconName } from '@/components/ds';
import { colors, font, shadow, text, tones, type ToneName } from '@/theme';
import { Overlay } from './Feedback';

export type MissedKind = 'fallback' | 'reset' | 'challenge';

export type MissedItem = {
  key: string;
  name: string;
  icon: IconName;
  tone: ToneName;
  from: number;
  to: number;
  dateLabel: string;
  kind: MissedKind;
  challengeId?: string;
};

type Props = {
  item: MissedItem | null;
  count?: string;
  isLast: boolean;
  onNext: () => void;
  onRestart?: () => void;
};

/** "Missed a day" dialog (S03 / S04 / S05). Challenges have no checkpoint, so they're marked failed. */
export function MissedNotice({ item, count, isLast, onNext, onRestart }: Props) {
  if (!item) return null;
  const { kind, from, to } = item;
  const msg =
    kind === 'fallback' ? (
      <Text style={[text.body, { fontSize: 14 }]}>
        You didn’t check in. Your <Text style={{ fontFamily: font(700, 14).fontFamily }}>Day {to}</Text> milestone kept your progress safe — you’re back at Day {to}, not zero.
      </Text>
    ) : kind === 'challenge' ? (
      <Text style={[text.body, { fontSize: 14 }]}>Challenges have no milestone protection, so this one is marked failed. Restart to begin again from Day 1.</Text>
    ) : (
      <Text style={[text.body, { fontSize: 14 }]}>No milestone reached yet, so the count starts again. Check in today and you’re on Day 1.</Text>
    );
  return (
    <Overlay visible onClose={onNext}>
      <View style={{ width: '100%', backgroundColor: colors.surfaceCard, borderRadius: 28, padding: 24, boxShadow: shadow.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.orange100, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={kind === 'challenge' ? 'triangle-alert' : 'rotate-ccw'} size={24} color={colors.orange600} />
          </View>
          {count ? <Text style={text.cap}>{count}</Text> : null}
        </View>
        <Text style={[text.over, { marginTop: 16 }]}>{kind === 'challenge' ? `Challenge failed · ${item.dateLabel}` : `Missed a day · ${item.dateLabel}`}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Icon name={item.icon} size={20} color={tones[item.tone].d} />
          <Text style={[text.h2, { flex: 1 }]} numberOfLines={2}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 20, paddingVertical: 18, borderRadius: 20, backgroundColor: colors.surfacePage }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[font(800, 30, 1), { color: colors.textTertiary, textDecorationLine: 'line-through' }]}>{from}</Text>
            <Text style={[text.cap, { marginTop: 4 }]}>was</Text>
          </View>
          <Icon name="arrow-right" size={22} color={colors.brown400} />
          <View style={{ alignItems: 'center' }}>
            <Text style={[font(900, 44, 1), { color: kind === 'fallback' ? colors.green600 : colors.orange600 }]}>{to}</Text>
            <Text style={[text.cap, { marginTop: 4 }]}>now</Text>
          </View>
        </View>
        {kind === 'fallback' && <Badge icon="shield-check" style={{ marginBottom: 12 }}>{`${to}-day milestone protected you`}</Badge>}
        {msg}
        {kind === 'challenge' && onRestart ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" size="lg" style={{ flex: 1, paddingHorizontal: 12 }} onPress={onNext}>{isLast ? 'Got it' : 'Next'}</Button>
            <Button size="lg" iconLeft="rotate-ccw" style={{ flex: 1, paddingHorizontal: 12 }} onPress={onRestart}>Restart</Button>
          </View>
        ) : (
          <Button fullWidth size="lg" style={{ marginTop: 20 }} onPress={onNext}>{isLast ? 'Got it' : 'Next'}</Button>
        )}
      </View>
    </Overlay>
  );
}
