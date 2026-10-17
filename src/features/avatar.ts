/**
 * Profile pictures: pick (square crop) → resize to 512px JPEG → upload to the `avatars` bucket at
 * `<user id>/<random>.jpg` → save the path on the profile → delete the previous file.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { create } from 'zustand';
import { updateProfile } from '@/data/actions';
import { useData } from '@/data/store';
import { supabase } from '@/data/supabase';
import { useSync } from '@/data/sync';
import { uuid } from '@/lib/uuid';

const BUCKET = 'avatars';

/** Local preview while an upload is in flight. */
export const useAvatarUpload = create<{ previewUri: string | null; busy: boolean }>(() => ({ previewUri: null, busy: false }));

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** The URL to show for the signed-in user (local preview while uploading). */
export function useMyAvatarUrl(): string | null {
  const preview = useAvatarUpload((s) => s.previewUri);
  const path = useData((s) => (s.userId ? s.tables.profiles[s.userId]?.avatar_path : null));
  return preview ?? avatarUrl(path);
}

export class AvatarError extends Error {}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Returns false if the user cancelled. Throws AvatarError with a friendly message on failure. */
export async function pickAndUploadAvatar(): Promise<boolean> {
  const { userId, tables } = useData.getState();
  if (!userId) throw new AvatarError('Not signed in.');
  if (!useSync.getState().online) throw new AvatarError('You’re offline. Connect to the internet to change your photo.');

  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (picked.canceled || !picked.assets?.[0]) return false;

  useAvatarUpload.setState({ busy: true, previewUri: picked.assets[0].uri });
  try {
    const ctx = ImageManipulator.manipulate(picked.assets[0].uri);
    ctx.resize({ width: 512, height: null });
    const img = await ctx.renderAsync();
    const saved = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.82, base64: true });
    if (!saved.base64) throw new AvatarError('Could not process that photo.');
    useAvatarUpload.setState({ previewUri: saved.uri });

    const path = `${userId}/${uuid()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, base64ToBytes(saved.base64), { contentType: 'image/jpeg', upsert: false });
    if (error) throw new AvatarError('Couldn’t upload your photo. Please try again.');

    const old = tables.profiles[userId]?.avatar_path;
    updateProfile({ avatar_path: path });
    if (old && old !== path) void supabase.storage.from(BUCKET).remove([old]);
    return true;
  } finally {
    useAvatarUpload.setState({ busy: false, previewUri: null });
  }
}

export async function removeAvatar() {
  const { userId, tables } = useData.getState();
  if (!userId) return;
  const old = tables.profiles[userId]?.avatar_path;
  updateProfile({ avatar_path: null });
  if (old) void supabase.storage.from(BUCKET).remove([old]);
}
