/**
 * Local SQLite store — the app's source of truth on the device.
 *
 *   records(tbl, id, data)  every row of every table, as JSON
 *   outbox(seq, tbl, rid, data)  pending changes to push; one entry per row (latest wins)
 *   meta(k, v)  sync cursors, the signed-in user id, small flags
 */
import { openDatabaseSync } from 'expo-sqlite';
import type { TableName, TableRows } from './types';

const db = openDatabaseSync('254.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS records (tbl TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (tbl, id));
  CREATE TABLE IF NOT EXISTS outbox (seq INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, rid TEXT NOT NULL, data TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS outbox_rid ON outbox (tbl, rid);
  CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
`);

export type OutboxEntry = { seq: number; tbl: TableName; rid: string; data: Record<string, unknown> };

export function loadTable<T extends TableName>(tbl: T): TableRows[T][] {
  return db.getAllSync<{ data: string }>('SELECT data FROM records WHERE tbl = ?', [tbl]).map((r) => JSON.parse(r.data));
}

export function putRecords(tbl: TableName, rows: { id: string; row: object }[]): void {
  if (rows.length === 0) return;
  db.withTransactionSync(() => {
    for (const { id, row } of rows) {
      db.runSync('INSERT OR REPLACE INTO records (tbl, id, data) VALUES (?, ?, ?)', [tbl, id, JSON.stringify(row)]);
    }
  });
}

/** Save a local edit and queue it for upload, replacing any older pending edit of the same row. */
export function writeAndEnqueue(tbl: TableName, id: string, row: object): void {
  const data = JSON.stringify(row);
  db.withTransactionSync(() => {
    db.runSync('INSERT OR REPLACE INTO records (tbl, id, data) VALUES (?, ?, ?)', [tbl, id, data]);
    db.runSync('DELETE FROM outbox WHERE tbl = ? AND rid = ?', [tbl, id]);
    db.runSync('INSERT INTO outbox (tbl, rid, data) VALUES (?, ?, ?)', [tbl, id, data]);
  });
}

export function outboxBatch(limit = 200): OutboxEntry[] {
  return db
    .getAllSync<{ seq: number; tbl: TableName; rid: string; data: string }>('SELECT seq, tbl, rid, data FROM outbox ORDER BY seq LIMIT ?', [limit])
    .map((r) => ({ ...r, data: JSON.parse(r.data) }));
}

export function removeOutbox(seqs: number[]): void {
  if (seqs.length === 0) return;
  db.withTransactionSync(() => {
    for (const s of seqs) db.runSync('DELETE FROM outbox WHERE seq = ?', [s]);
  });
}

export function pendingKeys(tbl: TableName): Set<string> {
  return new Set(db.getAllSync<{ rid: string }>('SELECT rid FROM outbox WHERE tbl = ?', [tbl]).map((r) => r.rid));
}

export function pendingCount(): number {
  return db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM outbox', [])?.n ?? 0;
}

export function getMeta(k: string): string | null {
  return db.getFirstSync<{ v: string }>('SELECT v FROM meta WHERE k = ?', [k])?.v ?? null;
}

export function setMeta(k: string, v: string | null): void {
  if (v === null) db.runSync('DELETE FROM meta WHERE k = ?', [k]);
  else db.runSync('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)', [k, v]);
}

/** Wipe everything (sign-out / switching accounts). */
export function clearAll(): void {
  db.execSync('DELETE FROM records; DELETE FROM outbox; DELETE FROM meta;');
}
