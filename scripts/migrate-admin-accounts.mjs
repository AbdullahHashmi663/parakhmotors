import { readFileSync } from 'node:fs';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';
import { hashAdminPassword } from '../src/backend/passwords.ts';

const pool = new pg.Pool(databaseConfig());
let client;
try {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_RECOVERY_EMAIL) throw new Error('Initial password and recovery email are required');
  const hash = await hashAdminPassword(process.env.ADMIN_PASSWORD);
  client = await pool.connect();
  await client.query('BEGIN');
  await client.query(readFileSync('supabase/migrations/20261021_admin_accounts.sql', 'utf8'));
  await client.query(`INSERT INTO public.admin_accounts (id, username, password_hash, recovery_email)
    VALUES ('main_admin', $1, $2, $3) ON CONFLICT (id) DO NOTHING`,
  [process.env.ADMIN_USERNAME || 'parakhmotors777', hash, process.env.ADMIN_RECOVERY_EMAIL]);
  await client.query('COMMIT');
  console.log(JSON.stringify({ migration: '20261021_admin_accounts', status: 'complete', account: 'parakhmotors777' }));
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ migration: '20261021_admin_accounts', status: 'failed', code: error.code || 'MIGRATION_FAILED' }));
  process.exitCode = 1;
} finally { client?.release(); await pool.end(); }
