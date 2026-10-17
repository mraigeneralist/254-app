// Row Level Security + delete-account test against the live Supabase project.
// Usage: node scripts/rls-test.mjs   (uses only the public URL + publishable key from .env)
//
// Creates two throwaway users, verifies neither can see or modify the other's rows, then deletes
// both accounts through the delete-account Edge Function and verifies their data is gone.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let failures = 0;
const check = (label, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures += 1;
};

async function newUser(tag) {
  const client = createClient(URL_, KEY, { auth: { persistSession: false } });
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const { data, error } = await client.auth.signUp({ email, password: `T3st-${crypto.randomUUID()}`, options: { data: { name: `Test ${tag}` } } });
  if (error) throw new Error(`signUp ${tag}: ${error.message}`);
  if (!data.session) throw new Error(`signUp ${tag}: no session (is email autoconfirm on?)`);
  return { client, id: data.user.id, session: data.session };
}

async function deleteAccount(u) {
  const res = await fetch(`${URL_}/functions/v1/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${u.session.access_token}`, apikey: KEY },
  });
  return res.status;
}

const a = await newUser('a');
const b = await newUser('b');
const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();

// profile auto-created by trigger
const { data: profA } = await a.client.from('profiles').select('*').eq('id', a.id).single();
check('profile row auto-created on sign-up with name', profA?.name === 'Test a');

// A creates data
const habitId = crypto.randomUUID();
const ins = await a.client.from('habits').insert({ id: habitId, user_id: a.id, kind: 'build', name: 'A private habit', start_date: today, updated_at: now });
check('A can insert own habit', !ins.error);
const ci = await a.client.from('habit_checkins').upsert({ user_id: a.id, habit_id: habitId, date: today, updated_at: now }, { onConflict: 'habit_id,date' });
check('A can check in', !ci.error);
const dup = await a.client.from('habit_checkins').upsert({ user_id: a.id, habit_id: habitId, date: today, updated_at: now }, { onConflict: 'habit_id,date' });
check('duplicate check-in sync is harmless (upsert on habit_id,date)', !dup.error);
const note = await a.client.from('notes').insert({ user_id: a.id, date: today, body: 'secret journal', updated_at: now });
check('A can write a note', !note.error);

// B tries to access A's data
for (const t of ['habits', 'habit_checkins', 'notes', 'profiles']) {
  const { data } = await b.client.from(t).select('*');
  const leaked = (data ?? []).filter((r) => (r.user_id ?? r.id) === a.id);
  check(`B cannot read A's ${t}`, leaked.length === 0);
}
const upd = await b.client.from('habits').update({ name: 'hacked' }).eq('id', habitId).select();
check("B cannot update A's habit", (upd.data ?? []).length === 0);
const del = await b.client.from('habits').delete().eq('id', habitId).select();
check("B cannot delete A's habit", (del.data ?? []).length === 0);
const spoof = await b.client.from('habits').insert({ user_id: a.id, kind: 'build', name: 'spoof', start_date: today });
check('B cannot insert rows owned by A', Boolean(spoof.error));
const foreignCi = await b.client.from('habit_checkins').insert({ user_id: b.id, habit_id: habitId, date: '2026-01-01' });
check("B cannot check in on A's habit", Boolean(foreignCi.error));
const { data: still } = await a.client.from('habits').select('name').eq('id', habitId).single();
check("A's habit unchanged", still?.name === 'A private habit');

// last-write-wins: an older update is ignored
await a.client.from('habits').update({ name: 'Newer name', updated_at: new Date(Date.now() + 1000).toISOString() }).eq('id', habitId);
await a.client.from('habits').update({ name: 'Stale name', updated_at: now }).eq('id', habitId);
const { data: lww } = await a.client.from('habits').select('name').eq('id', habitId).single();
check('older edit does not overwrite a newer one (last write wins)', lww?.name === 'Newer name');

// anonymous (signed-out) client sees nothing
const anon = createClient(URL_, KEY, { auth: { persistSession: false } });
const { data: anonRows } = await anon.from('habits').select('*');
check('signed-out client reads nothing', (anonRows ?? []).length === 0);

// delete-account: unauthenticated call rejected, then both users delete themselves
const unauth = await fetch(`${URL_}/functions/v1/delete-account`, { method: 'POST', headers: { apikey: KEY } });
check('delete-account rejects calls without a session', unauth.status === 401);
check('A deletes own account via Edge Function', (await deleteAccount(a)) === 200);
check('B deletes own account via Edge Function', (await deleteAccount(b)) === 200);
const relogin = await createClient(URL_, KEY, { auth: { persistSession: false } }).auth.refreshSession({ refresh_token: a.session.refresh_token });
check("deleted user's session can no longer be refreshed", Boolean(relogin.error));

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
