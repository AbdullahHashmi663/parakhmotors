import { readFileSync } from 'node:fs';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
let client;
try {
  client = await pool.connect();
  await client.query('BEGIN');
  await client.query(readFileSync('supabase/migrations/20261011_vehicle_discounts.sql', 'utf8'));
  const result = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'discount_price'",
  );
  if (result.rowCount !== 1) throw new Error('Vehicle discount migration verification failed');
  await client.query('COMMIT');
  console.log(JSON.stringify({ migration: '20261011_vehicle_discounts', status: 'complete' }));
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ migration: '20261011_vehicle_discounts', status: 'failed', code: error.code || 'DATABASE_MIGRATION_FAILED' }));
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
