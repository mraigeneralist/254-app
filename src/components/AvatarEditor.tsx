import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon, type IconName } from '@/components/ds';
import { AvatarError, pickAndUploadAvatar, removeAvatar, useAvatarUpload, useMyAvatarUrl } from '@/features/avatar';
import { showSnack } from '@/lib/ui';
import { colors, font, ring, text } from '@/theme';
import { Overlay } from './Feedback';

function SheetRow({ icon, label, danger, onPress }: { icon: IconName; label: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: danger ? colors.orange100 : colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={danger ? colors.orange600 : colors.brown800} />
      </View>
      <Text style={[font(700, 15), { color: danger ? colors.orange600 : colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/** Tappable profile picture with a camera badge; opens a sheet to choose or remove a photo. */
export function AvatarEditor({ name, size = 68 }: { name: string; size?: number }) {
  const insets = useSafeAreaInsets();
  const uri = useMyAvatarUrl();
  const busy = useAvatarUpload((s) => s.busy);
  const [sheet, setSheet] = useState(false);
  const badge = Math.round(size * 0.36);

  const choose = async () => {
    setSheet(false);
    try {
      const done = await pickAndUploadAvatar();
      if (done) showSnack({ icon: 'circle-check', text: 'Profile photo updated' });
    } catch (e) {
      showSnack({ tone: 'error', icon: 'circle-alert', text: e instanceof AvatarError ? e.message : 'Couldn’t update your photo.', action: 'Retry', onAction: () => void choose() });
    }
  };

  return (
    <>
      <Pressable onPress={() => setSheet(true)} disabled={busy} accessibilityRole="button" accessibilityLabel="Change profile photo" hitSlop={6}>
        <Avatar name={name} size={size} uri={uri} />
        {busy && (
          <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(55,35,21,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: badge, height: badge, borderRadius: badge / 2, backgroundColor: colors.brown800, alignItems: 'center', justifyContent: 'center', boxShadow: ring(2, colors.surfacePage) }}>
          <Icon name="camera" size={Math.round(badge * 0.55)} color={colors.cream0} />
        </View>
      </Pressable>

      <Overlay visible={sheet} onClose={() => setSheet(false)} align="bottom">
        <View style={{ backgroundColor: colors.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14, paddingHorizontal: 24, paddingBottom: Math.max(28, insets.bottom + 12) }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cream400, alignSelf: 'center', marginBottom: 18 }} />
          <Text style={text.h2}>Profile photo</Text>
          <View style={{ marginTop: 8 }}>
            <SheetRow icon="image-plus" label={uri ? 'Choose a new photo' : 'Choose from gallery'} onPress={choose} />
            {uri && (
              <SheetRow
                icon="trash-2"
                label="Remove photo"
                danger
                onPress={() => {
                  setSheet(false);
                  void removeAvatar();
                  showSnack({ icon: 'trash-2', text: 'Profile photo removed' });
                }}
              />
            )}
          </View>
        </View>
      </Overlay>
    </>
  );
}
