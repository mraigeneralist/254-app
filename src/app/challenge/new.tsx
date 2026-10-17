import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, CHALLENGE_ICONS, Icon, SegmentedControl, type IconName } from '@/components/ds';
import { Field } from '@/components/Form';
import { AppBar, Screen } from '@/components/Screen';
import { createChallenge } from '@/data/actions';
import { challengeEndDate, isValidDuration } from '@/domain/challenges';
import { useToday } from '@/hooks/useToday';
import { mediumDate } from '@/lib/format';
import { colors, font, insetBorder, text, tones } from '@/theme';

const OPTIONS = ['30', '60', '90', 'Custom'] as const;

/** C03 / C04 New challenge — preset or custom length (1–365 days); starts today. */
export default function NewChallenge() {
  const router = useRouter();
  const today = useToday();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [opt, setOpt] = useState<(typeof OPTIONS)[number]>('30');
  const [custom, setCustom] = useState('45');
  const [icon, setIcon] = useState<IconName>('trophy');
  const days = opt === 'Custom' ? Number(custom) : Number(opt);
  const valid = isValidDuration(days);

  const save = () => {
    createChallenge({ name, description, duration_days: days, icon }, today);
    router.back();
  };

  return (
    <Screen header={<AppBar title="New challenge" close />} footer={<Button size="lg" fullWidth disabled={!name.trim() || !valid} onPress={save}>Start</Button>}>
      <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 18 }}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. 30-day reading challenge" autoFocus maxLength={120} />
        <View>
          <Text style={[font(700, 12), { color: colors.textPrimary, marginBottom: 8 }]}>Duration</Text>
          <SegmentedControl options={OPTIONS} value={opt} onChange={setOpt} />
        </View>
        {opt === 'Custom' && (
          <Field
            label="Number of days"
            value={custom}
            onChangeText={(t) => setCustom(t.replace(/[^0-9]/g, '').slice(0, 3))}
            keyboardType="number-pad"
            trailing={<Text style={text.cap}>days</Text>}
            hint="Between 1 and 365 days"
            error={custom && !valid ? 'Choose between 1 and 365 days.' : null}
          />
        )}
        <Field label="Description (optional)" value={description} onChangeText={setDescription} placeholder="What are you proving to yourself?" multiline height={88} maxLength={500} />
        <View>
          <Text style={[font(700, 12), { color: colors.textPrimary, marginBottom: 8 }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
            {CHALLENGE_ICONS.map((ic) => {
              const on = ic === icon;
              return (
                <Pressable key={ic} onPress={() => setIcon(ic)} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? tones.yellow.t : colors.surfaceCard, boxShadow: on ? insetBorder(2, tones.yellow.s) : insetBorder(1, colors.borderSubtle) }}>
                  <Icon name={ic} size={20} color={on ? tones.yellow.d : colors.brown500} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        {valid && (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Icon name="calendar-days" size={14} color={colors.textSecondary} />
            <Text style={text.cap}>{`Starts today · ends ${mediumDate(challengeEndDate(today, days))}`}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
