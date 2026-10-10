import assert from 'node:assert/strict';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const id = process.argv[2];
assert.match(id || '', /^pm-inq-[a-f0-9-]{36}$/);
const pool = new pg.Pool(databaseConfig());
try {
  const result = await pool.query("SELECT status FROM public.inquiries WHERE id = $1 AND name = 'Website verification' AND email = 'browser-check@example.invalid' AND message = 'Temporary browser verification of the live Supabase inquiry flow.'", [id]);
  assert.equal(result.rowCount, 1);
  assert.equal(result.rows[0].status, 'contacted');
  const removed = await pool.query("DELETE FROM public.inquiries WHERE id = $1 AND name = 'Website verification' AND email = 'browser-check@example.invalid'", [id]);
  assert.equal(removed.rowCount, 1);
  console.log('Browser submission and admin status update persisted to Supabase. Temporary browser record removed.');
} finally {
  await pool.end();
}
