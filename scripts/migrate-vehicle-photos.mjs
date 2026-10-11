import { readFileSync } from 'node:fs';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
let client;
try {
  client = await pool.connect();
  await client.query(readFileSync('supabase/migrations/20261011_vehicle_photos.sql', 'utf8'));
  const result = await client.query("SELECT c.relrowsecurity AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'vehicle_photos') AND NOT has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AND NOT has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS private_table FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'vehicle_photos'");
  if (!result.rows[0]?.private_table) throw new Error('Migration verification failed');
  console.log(JSON.stringify({ migration: '20261011_vehicle_photos', status: 'complete', privatePhotos: true }));
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ migration: '20261011_vehicle_photos', status: 'failed', code: error.code || 'DATABASE_MIGRATION_FAILED' }));
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
