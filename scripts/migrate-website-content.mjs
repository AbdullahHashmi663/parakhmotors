import { readFileSync } from 'node:fs';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
let client;
try {
  client = await pool.connect();
  await client.query(readFileSync('supabase/migrations/20261011_website_content.sql', 'utf8'));
  const result = await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dealership_settings' AND column_name = 'website_content' AND data_type = 'jsonb') AS content_column");
  if (!result.rows[0].content_column) throw new Error('Migration verification failed');
  console.log(JSON.stringify({ migration: '20261011_website_content', status: 'complete' }));
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ migration: '20261011_website_content', status: 'failed', code: error.code || 'DATABASE_MIGRATION_FAILED' }));
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
