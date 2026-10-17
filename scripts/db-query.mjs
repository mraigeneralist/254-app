// Runs a read-only SQL query against the 254 project via the Management API (token from ./.secret).
// Usage: node scripts/db-query.mjs "select count(*) from public.habits"
import { readFileSync } from 'node:fs';

const REF = 'drbkkzrmrvwodinsllrk';
const token = readFileSync(new URL('../.secret', import.meta.url), 'utf8').replace(/^[^:]*:\s*/, '').trim();
const query = process.argv[2];
if (!query) {
  console.error('Usage: node scripts/db-query.mjs "<sql>"');
  process.exit(1);
}
const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query/read-only`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Failed:', res.status, JSON.stringify(body).slice(0, 400));
  process.exit(1);
}
console.table(body);
