import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { hydrate, resetData, useData } from './store';
import { SUPABASE_URL, supabase } from './supabase';
import { initialSyncDone, startSyncEngine, syncNow, useSync } from './sync';

type SessionState = {
  initialized: boolean;
  session: Session | null;
  /** first pull after a fresh sign-in has finished (or given up) */
  dataReady: boolean;
  introSeen: boolean;
};

export const useSession = create<SessionState>(() => ({ initialized: false, session: null, dataReady: false, introSeen: false }));

const INTRO_KEY = '254:introSeen';

async function onUser(session: Session | null) {
  const uid = session?.user.id ?? null;
  const current = useData.getState().userId;
  useSession.setState({ session });
  if (!uid) {
    if (current) resetData();
    useSession.setState({ dataReady: false });
    return;
  }
  if (current === uid && useSession.getState().dataReady) return;
  hydrate(uid);
  if (initialSyncDone()) {
    useSession.setState({ dataReady: true });
    void syncNow();
    return;
  }
  // Fresh sign-in on this device: pull the account's data before deciding where to go
  // (e.g. skip onboarding if it was completed on another device). Give up after 10 s.
  useSession.setState({ dataReady: false });
  await Promise.race([syncNow(), new Promise((r) => setTimeout(r, 10_000))]);
  useSession.setState({ dataReady: true });
}

let initStarted = false;
export async function initSession() {
  if (initStarted) return;
  initStarted = true;
  startSyncEngine();
  const introSeen = (await AsyncStorage.getItem(INTRO_KEY)) === '1';
  useSession.setState({ introSeen });
  const { data } = await supabase.auth.getSession();
  await onUser(data.session);
  useSession.setState({ initialized: true });
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user.id !== useSession.getState().session?.user.id || !session) void onUser(session);
    else useSession.setState({ session });
  });
}

export async function markIntroSeen() {
  await AsyncStorage.setItem(INTRO_KEY, '1');
  useSession.setState({ introSeen: true });
}

// ─── auth actions (errors mapped to the wording in the designs) ─────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public field?: 'email' | 'password' | 'name',
  ) {
    super(message);
  }
}

const OFFLINE = "You're offline. Connect to the internet and try again.";

function mapError(e: { message?: string; status?: number; code?: string } | null): AuthError {
  const msg = e?.message ?? '';
  const code = e?.code ?? '';
  if (/fetch|network/i.test(msg) || e?.status === 0) return new AuthError(OFFLINE);
  if (code === 'user_already_exists' || /already registered|already exists/i.test(msg)) return new AuthError('This email is already in use. Log in instead?', 'email');
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return new AuthError('That password isn’t right. Try again or reset it.', 'password');
  if (code === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(msg)) return new AuthError('Enter a valid email address.', 'email');
  if (code === 'weak_password' || /password/i.test(msg)) return new AuthError('Use at least 8 characters.', 'password');
  if (code === 'over_email_send_rate_limit' || /rate limit/i.test(msg)) return new AuthError('Too many emails sent. Please wait a few minutes and try again.');
  return new AuthError(msg || 'Something went wrong. Please try again.');
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

async function guardOnline() {
  if (!useSync.getState().online) throw new AuthError(OFFLINE);
}

export async function signUp(name: string, email: string, password: string) {
  await guardOnline();
  if (!name.trim()) throw new AuthError('Enter your name.', 'name');
  if (!isValidEmail(email)) throw new AuthError('Enter a valid email address.', 'email');
  if (password.length < 8) throw new AuthError('Use at least 8 characters.', 'password');
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
  if (error) throw mapError(error);
  // with email confirmation off, an existing address returns a user with no identities
  if (data.user && (data.user.identities?.length ?? 0) === 0) throw new AuthError('This email is already in use. Log in instead?', 'email');
  if (!data.session) throw new AuthError('Could not sign you in. Please try logging in.');
}

export async function logIn(email: string, password: string) {
  await guardOnline();
  if (!isValidEmail(email)) throw new AuthError('Enter a valid email address.', 'email');
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw mapError(error);
}

export async function sendPasswordReset(email: string) {
  await guardOnline();
  if (!isValidEmail(email)) throw new AuthError('Enter a valid email address.', 'email');
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'two54://set-password' });
  if (error) throw mapError(error);
}

/** Opened from the reset-email link: tokens arrive in the URL fragment. */
export async function sessionFromRecoveryUrl(url: string): Promise<boolean> {
  const frag = url.includes('#') ? url.slice(url.indexOf('#') + 1) : url.split('?')[1] ?? '';
  const p = new URLSearchParams(frag);
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (p.get('error_description')) throw new AuthError(p.get('error_description')!.replace(/\+/g, ' '));
  if (!access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw mapError(error);
  return true;
}

export async function setNewPassword(password: string) {
  await guardOnline();
  if (password.length < 8) throw new AuthError('Use at least 8 characters.', 'password');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw mapError(error);
}

export async function changePassword(current: string, next: string) {
  await guardOnline();
  const email = useSession.getState().session?.user.email;
  if (!email) throw new AuthError('Not signed in.');
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: current });
  if (authErr) throw new AuthError('Your current password isn’t right.', 'password');
  await setNewPassword(next);
}

export async function logOut() {
  await syncNow().catch(() => undefined);
  await supabase.auth.signOut({ scope: 'local' });
}

export async function deleteAccount() {
  await guardOnline();
  const token = useSession.getState().session?.access_token;
  if (!token) throw new AuthError('Not signed in.');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! },
  }).catch(() => null);
  if (!res) throw new AuthError(OFFLINE);
  if (!res.ok) throw new AuthError('Could not delete your account. Please try again.');
  resetData();
  await supabase.auth.signOut({ scope: 'local' });
}
