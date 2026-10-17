/**
 * In-memory mirror of the local SQLite store, exposed to React via zustand.
 * Every mutation goes: memory + SQLite + outbox → (debounced) sync with Supabase.
 */
import { create } from 'zustand';
import { clearAll, getMeta, loadTable, pendingKeys, putRecords, setMeta, writeAndEnqueue } from './db';
import { localId, TABLES, type TableName, type TableRows } from './types';

export type Tables = { [K in TableName]: Record<string, TableRows[K]> };

const emptyTables = (): Tables =>
  Object.fromEntries(TABLES.map((t) => [t, {}])) as unknown as Tables;

type DataState = {
  userId: string | null;
  hydrated: boolean;
  tables: Tables;
};

export const useData = create<DataState>(() => ({ userId: null, hydrated: false, tables: emptyTables() }));

let onLocalWrite: (() => void) | null = null;
/** The sync engine registers here to be told about local edits. */
export function setOnLocalWrite(fn: () => void) {
  onLocalWrite = fn;
}

/** Load the signed-in user's data from SQLite (wiping it first if it belongs to someone else). */
export function hydrate(userId: string) {
  if (getMeta('userId') !== userId) {
    clearAll();
    setMeta('userId', userId);
  }
  const tables = emptyTables();
  for (const t of TABLES) {
    const rows = loadTable(t) as { id: string }[];
    const map: Record<string, unknown> = {};
    for (const r of rows) map[localId(t, r as Record<string, unknown>)] = r;
    (tables as Record<string, unknown>)[t] = map;
  }
  useData.setState({ userId, hydrated: true, tables });
}

export function resetData() {
  clearAll();
  useData.setState({ userId: null, hydrated: false, tables: emptyTables() });
}

const nowIso = () => new Date().toISOString();

/**
 * Save a row locally (creating or updating) and queue it for sync. Stamps user_id / timestamps.
 * Returns the saved row.
 */
export function saveRow<T extends TableName>(table: T, row: Partial<TableRows[T]> & Record<string, unknown>): TableRows[T] {
  const { userId, tables } = useData.getState();
  if (!userId) throw new Error('Not signed in');
  const now = nowIso();
  const id = localId(table, row);
  const existing = tables[table][id] as Record<string, unknown> | undefined;
  const full = {
    ...(existing ?? { created_at: now, deleted_at: null }),
    ...row,
    ...(table === 'profiles' ? {} : { user_id: userId }),
    updated_at: now,
  } as unknown as TableRows[T];
  writeAndEnqueue(table, id, full as object);
  useData.setState((s) => ({ tables: { ...s.tables, [table]: { ...s.tables[table], [id]: full } } }));
  onLocalWrite?.();
  return full;
}

/** Soft delete (syncs to other devices). */
export function softDelete<T extends TableName>(table: T, id: string) {
  const existing = useData.getState().tables[table][id] as Record<string, unknown> | undefined;
  if (!existing || existing.deleted_at) return;
  saveRow(table, { ...existing, deleted_at: nowIso() } as Partial<TableRows[T]> & Record<string, unknown>);
}

/** Merge rows pulled from the server. Local edits that haven't been pushed yet win. */
export function applyRemote<T extends TableName>(table: T, rows: TableRows[T][]) {
  if (rows.length === 0) return;
  const pending = pendingKeys(table);
  const current = useData.getState().tables[table] as Record<string, { updated_at: string }>;
  const accepted: { id: string; row: TableRows[T] }[] = [];
  for (const row of rows) {
    const id = localId(table, row as unknown as Record<string, unknown>);
    if (pending.has(id)) continue;
    const local = current[id];
    if (!local || Date.parse((row as { updated_at: string }).updated_at) >= Date.parse(local.updated_at)) {
      accepted.push({ id, row });
    }
  }
  if (accepted.length === 0) return;
  putRecords(table, accepted);
  useData.setState((s) => {
    const next = { ...s.tables[table] } as Record<string, TableRows[T]>;
    for (const { id, row } of accepted) next[id] = row;
    return { tables: { ...s.tables, [table]: next } };
  });
}

/** Live (not soft-deleted) rows of a table. */
export function live<T>(map: Record<string, T>): T[] {
  return Object.values(map).filter((r) => !(r as { deleted_at?: string | null }).deleted_at);
}
