import { readFileSync } from 'node:fs';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';
import { hashAdminPassword } from '../src/backend/passwords.ts';

const pool = new pg.Pool(databaseConfig());
const source = JSON.parse(readFileSync('src/data/db.json', 'utf8'));
const schema = readFileSync('supabase/schema.sql', 'utf8');
const column = (key) => key === 'primary' ? 'primary_color' : key.replace(/[A-Z]/g, (char) => '_' + char.toLowerCase());
async function insert(client, table, record) {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  await client.query(`INSERT INTO public.${table} (${entries.map(([key]) => column(key)).join(', ')}) VALUES (${entries.map((_, index) => '$' + (index + 1)).join(', ')}) ON CONFLICT (id) DO NOTHING`, entries.map(([, value]) => value));
}

let client;
try {
  client = await pool.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('parakh-database-setup'))");
  await client.query('CREATE TABLE IF NOT EXISTS public.parakh_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT NOW())');
  await client.query('ALTER TABLE public.parakh_migrations ENABLE ROW LEVEL SECURITY');
  await client.query('REVOKE ALL ON public.parakh_migrations FROM anon, authenticated');
  const version = '001_postgresql_persistence';
  const applied = await client.query('SELECT id FROM public.parakh_migrations WHERE id = $1', [version]);
  if (!applied.rowCount) {
    await client.query(schema);
    for (const vehicle of source.vehicles) await insert(client, 'vehicles', vehicle);
    const themeCount = await client.query('SELECT COUNT(*)::int AS count FROM public.themes');
    if (themeCount.rows[0].count === 0) {
      const activeId = source.settings.activeThemeId;
      const selected = source.themes.some(theme => theme.id === activeId) ? activeId : source.themes[0].id;
      for (const theme of source.themes) await insert(client, 'themes', { ...theme, is_active: theme.id === selected });
    }
    const settings = { ...source.settings };
    // Upgrade only known pre-redesign defaults, preserving custom dealership copy.
    if (settings.heroHeadline === "PAKISTAN'S PREMIER CURATED LUXURY AUTOMOTIVE DEALERSHIP") settings.heroHeadline = 'A better drive. Starts with trust.';
    if (settings.heroSubheadline === 'Uncompromising luxury, certified forensic inspections, verified ownership history, and hassle-free white-glove trade-in.') settings.heroSubheadline = 'Great cars. Honest advice. Complete peace of mind. Your next chapter deserves a better beginning.';
    if (settings.tagline === 'TRUST BETTER — BUY & SELL FEARLESSLY TRUST DELIVERED') settings.tagline = 'A little expertise goes a long way. We help you buy, sell and inspect with confidence.';
    if (settings.announcement === 'Complimentary 200+ Point Inspection & Verified History with every Certified Car!') settings.announcement = 'Independent inspections. Honest advice. Better journeys.';
    const activeTheme = await client.query('SELECT id FROM public.themes WHERE is_active = true LIMIT 1');
    if (activeTheme.rows[0]) settings.activeThemeId = activeTheme.rows[0].id;
    await insert(client, 'dealership_settings', { id: 'main_settings', ...settings });
    // These specific IDs belong to demonstration requests, not customer submissions.
    const demoIds = new Set(['pm-insp-101', 'pm-insp-102', 'pm-inq-201', 'pm-inq-202', 'pm-sell-301', 'pm-find-401']);
    for (const [key, table] of [['inspections', 'inspections'], ['inquiries', 'inquiries'], ['sellRequests', 'sell_requests'], ['findRequests', 'find_requests']]) {
      for (const record of source[key]) if (!demoIds.has(record.id)) await insert(client, table, record);
    }
    await client.query('INSERT INTO public.parakh_migrations (id) VALUES ($1)', [version]);
  }
  // Add screenshot-inspired built-in palettes to existing databases as well as fresh installs.
  for (const theme of source.themes.filter(theme => theme.id.startsWith('palette-'))) {
    await insert(client, 'themes', theme);
  }
  await client.query(readFileSync('supabase/migrations/20261021_admin_accounts.sql', 'utf8'));
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_RECOVERY_EMAIL) {
    await insert(client, 'admin_accounts', {
      id: 'main_admin', username: process.env.ADMIN_USERNAME || 'parakhmotors777',
      password_hash: await hashAdminPassword(process.env.ADMIN_PASSWORD), recovery_email: process.env.ADMIN_RECOVERY_EMAIL,
    });
  }
  await client.query('COMMIT');
  const counts = {};
  for (const table of ['vehicles', 'themes', 'dealership_settings', 'inspections', 'inquiries', 'sell_requests', 'find_requests']) {
    counts[table] = (await client.query(`SELECT COUNT(*)::int AS count FROM public.${table}`)).rows[0].count;
  }
  console.log(JSON.stringify({ setup: 'complete', previouslyApplied: Boolean(applied.rowCount), counts }));
} catch (error) {
  if (client) await client.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ setup: 'failed', code: error.code || 'DATABASE_SETUP_FAILED' }));
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
