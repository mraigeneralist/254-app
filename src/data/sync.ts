/**
 * Sync engine: push the outbox, then pull rows changed on the server since the last pull.
 *
 * - Runs after local edits (debounced), when the app returns to the foreground, when the network
 *   comes back, and every minute while open.
 * - Failed pushes stay in the outbox (nothing is lost) and are retried with backoff.
 * - Conflicts: the server ignores updates older than what it has (last write wins); pulled rows
 *   never overwrite local edits that are still waiting to be pushed.
 */
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { getMeta, outboxBatch, pendingCount, removeOutbox, setMeta, type OutboxEntry } from './db';
import { applyRemote, setOnLocalWrite, useData } from './store';
import { supabase } from './supabase';
import { CHECKIN_PARENT, TABLES, type TableName } from './types';

type SyncState = {
  online: boolean;
  syncing: boolean;
  pending: number;
  error: string | null;
  lastSyncedAt: number | null;
};

export const useSync = create<SyncState>(() => ({ online: true, syncing: false, pending: 0, error: null, lastSyncedAt: null }));

const SERVER_ONLY = ['synced_at'];
const PAGE = 1000;

function toServer(table: TableName, row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  for (const k of SERVER_ONLY) delete out[k];
  // check-ins are identified by (parent, date) on the server; let it generate its own id
  if (CHECKIN_PARENT[table]) delete out.id;
  return out;
}

const conflictTarget = (table: TableName) => {
  const parent = CHECKIN_PARENT[table];
  return parent ? `${parent},date` : 'id';
};

/** Errors caused by the row itself (constraint / permission) — retrying won't help, so drop it. */
const isPermanent = (code?: string) => !!code && (code.startsWith('23') || code === '42501' || code === '22P02' || code === 'PGRST204');

async function pushTable(table: TableName, entries: OutboxEntry[]): Promise<number[]> {
  const rows = entries.map((e) => toServer(table, e.data));
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictTarget(table) });
  if (!error) return entries.map((e) => e.seq);
  if (!isPermanent(error.code)) throw new Error(error.message);
  // a bad row in the batch: push one by one and drop only the rows the server rejects
  const done: number[] = [];
  for (const e of entries) {
    const r = await supabase.from(table).upsert(toServer(table, e.data), { onConflict: conflictTarget(table) });
    if (!r.error || isPermanent(r.error.code)) {
      if (r.error) console.warn(`[sync] dropped ${table}/${e.rid}: ${r.error.message}`);
      done.push(e.seq);
    } else throw new Error(r.error.message);
  }
  return done;
}

async function push() {
  for (;;) {
    const batch = outboxBatch(200);
    if (batch.length === 0) return;
    for (const table of TABLES) {
      const entries = batch.filter((e) => e.tbl === table);
      if (entries.length) removeOutbox(await pushTable(table, entries));
    }
    useSync.setState({ pending: pendingCount() });
  }
}

async function pull() {
  for (const table of TABLES) {
    const key = `cursor:${table}`;
    let cursor = getMeta(key);
    for (;;) {
      let q = supabase.from(table).select('*').order('synced_at', { ascending: true }).limit(PAGE);
      // small overlap so rows committed concurrently with the last pull are never missed (merges are idempotent)
      if (cursor) q = q.gt('synced_at', new Date(Date.parse(cursor) - 2000).toISOString());
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      if (!data?.length) break;
      applyRemote(table, data as never[]);
      const last = (data.at(-1) as { synced_at: string }).synced_at;
      if (last === cursor) break;
      cursor = last;
      setMeta(key, cursor);
      if (data.length < PAGE) break;
    }
  }
}

let running = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let failures = 0;

export async function syncNow(): Promise<boolean> {
  if (!useData.getState().userId) return false;
  if (running) {
    again = true;
    return false;
  }
  if (!useSync.getState().online) {
    useSync.setState({ pending: pendingCount() });
    return false;
  }
  running = true;
  useSync.setState({ syncing: true });
  try {
    await push();
    await pull();
    setMeta('initialSyncDone', '1');
    failures = 0;
    useSync.setState({ error: null, lastSyncedAt: Date.now() });
    return true;
  } catch (e) {
    failures += 1;
    useSync.setState({ error: e instanceof Error ? e.message : String(e) });
    // retry with backoff: 5s, 10s, 20s … up to 2 min
    schedule(Math.min(120_000, 5000 * 2 ** (failures - 1)));
    return false;
  } finally {
    running = false;
    useSync.setState({ syncing: false, pending: pendingCount() });
    if (again) {
      again = false;
      schedule(300);
    }
  }
}

export function schedule(delay = 600) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delay);
}

export const initialSyncDone = () => getMeta('initialSyncDone') === '1';

let started = false;
/** Wire up triggers once at app start. */
export function startSyncEngine() {
  if (started) return;
  started = true;
  setOnLocalWrite(() => {
    useSync.setState({ pending: pendingCount() });
    schedule();
  });
  NetInfo.addEventListener((s) => {
    const online = s.isConnected !== false && s.isInternetReachable !== false;
    const was = useSync.getState().online;
    useSync.setState({ online });
    if (online && !was) schedule(200);
  });
  AppState.addEventListener('change', (st) => {
    if (st === 'active') schedule(200);
  });
  setInterval(() => {
    if (AppState.currentState === 'active') void syncNow();
  }, 60_000);
}
