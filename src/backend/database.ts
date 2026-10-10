import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool, type PoolClient } from 'pg';

declare global {
  var __parakhDatabase: { key: string; pool: Pool } | undefined;
}

export function getDatabasePool(): Pool {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('Database has not been configured');
  const caPath = process.env.DATABASE_SSL_CA_PATH || 'supabase/certs/prod-ca-2021.crt';
  const key = `${rawUrl}|${caPath}`;
  if (global.__parakhDatabase?.key === key) return global.__parakhDatabase.pool;
  const address = new URL(rawUrl);
  if (!['postgres:', 'postgresql:'].includes(address.protocol)) throw new Error('Invalid database configuration');
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) address.searchParams.delete(key);
  const pool = new Pool({
    connectionString: address.toString(),
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_SSL_CA_PATH
        ? readFileSync(/* turbopackIgnore: true */ process.env.DATABASE_SSL_CA_PATH, 'utf8')
        : readFileSync(path.join(process.cwd(), 'supabase', 'certs', 'prod-ca-2021.crt'), 'utf8'),
    },
    max: 5,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10000,
    query_timeout: 15000,
    application_name: 'parakh-motors',
    allowExitOnIdle: true,
  });
  // Background disconnects must not crash the server or print connection credentials.
  pool.on('error', () => console.warn('Database connection interrupted.'));
  global.__parakhDatabase?.pool.end().catch(() => {});
  global.__parakhDatabase = { key, pool };
  return pool;
}

export async function databaseTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDatabasePool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getDatabaseHealth(): Promise<{ configured: boolean; connected: boolean; source: string }> {
  const configured = Boolean(process.env.DATABASE_URL);
  try {
    await getDatabasePool().query('SELECT 1');
    return { configured, connected: true, source: 'supabase' };
  } catch {
    return { configured, connected: false, source: configured ? 'supabase' : 'unconfigured' };
  }
}
