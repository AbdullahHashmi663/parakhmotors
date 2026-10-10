import { readFileSync } from 'node:fs';
import nextEnv from '@next/env';

export function databaseConfig() {
  nextEnv.loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const address = new URL(process.env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(address.protocol)) throw new Error('Invalid database protocol');
  // Keep TLS configuration explicit; URL sslmode options can override pg's ssl object.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) address.searchParams.delete(key);
  return {
    connectionString: address.toString(),
    ssl: {
      rejectUnauthorized: true,
      ca: readFileSync(process.env.DATABASE_SSL_CA_PATH || 'supabase/certs/prod-ca-2021.crt', 'utf8'),
    },
    max: 3,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10000,
    query_timeout: 15000,
    application_name: 'parakh-motors-setup',
    allowExitOnIdle: true,
  };
}
