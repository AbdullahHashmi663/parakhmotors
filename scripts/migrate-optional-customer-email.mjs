import { readFileSync } from 'node:fs';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
let client;
try {
  client = await pool.connect();
  await client.query(readFileSync('supabase/migrations/20261011_optional_customer_email.sql', 'utf8'));
  const result = await client.query("SELECT table_name, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'email' AND table_name = ANY($1::text[])", [['inspections', 'inquiries', 'sell_requests', 'find_requests']]);
  const nullableTables = result.rows.filter(row => row.is_nullable === 'YES').map(row => row.table_name);
  if (nullableTables.length !== 4) throw new Error('Email column migration verification failed');
  console.log(JSON.stringify({ migration: '20261011_optional_customer_email', status: 'complete', nullableTables }));
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ migration: '20261011_optional_customer_email', status: 'failed', code: error.code || 'DATABASE_MIGRATION_FAILED' }));
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
