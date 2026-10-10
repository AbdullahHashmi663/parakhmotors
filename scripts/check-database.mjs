import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
try {
  await pool.query('SELECT 1');
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(JSON.stringify({ connected: true, tables: tables.rows.map((row) => row.table_name) }));
} catch (error) {
  console.error(JSON.stringify({ connected: false, code: error.code || 'CONNECTION_FAILED' }));
  process.exitCode = 1;
} finally {
  await pool.end();
}
