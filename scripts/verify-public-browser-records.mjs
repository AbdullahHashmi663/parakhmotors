import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
const marker = 'browser-public-qa-20261011';
const email = `${marker}@example.invalid`;
const snapshotPath = join(tmpdir(), 'parakh-public-browser-settings-20261011.sha256');
const tables = [
  ['inspections', 'customer_name', 1], ['sell_requests', 'seller_name', 2],
  ['find_requests', 'buyer_name', 1], ['inquiries', 'name', 2],
];
const requirePhoto = process.argv.includes('--require-photo');
let checks = 0;
let beforeSettings;
let uploadedPhotos = 0;
let cleanupPassed = false;
const check = (callback) => { callback(); checks++; };
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function settings() {
  return (await pool.query("SELECT to_jsonb(s) AS settings FROM public.dealership_settings s WHERE id = 'main_settings'")).rows[0].settings;
}

if (process.argv.includes('--snapshot')) {
  try {
    writeFileSync(snapshotPath, fingerprint(await settings()));
    console.log(JSON.stringify({ result: 'settings fingerprint saved', path: snapshotPath }));
  } catch (error) {
    console.error('Browser settings snapshot failed: ' + error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
} else {
  try {
    beforeSettings = await settings();
    if (existsSync(snapshotPath)) check(() => assert.equal(fingerprint(beforeSettings), readFileSync(snapshotPath, 'utf8'), 'Browser form interactions must not change business details, prices or theme'));
    const records = {};
    for (const [table, name, expected] of tables) {
      records[table] = (await pool.query(`SELECT * FROM public.${table} WHERE email = $1 AND ${name} = $2 ORDER BY created_at`, [email, marker])).rows;
      check(() => assert.equal(records[table].length, expected, `The browser must save exactly ${expected} ${table} records`));
      check(() => assert.ok(records[table].every(record => record.phone === '03001234567')));
    }
    const inspection = records.inspections[0];
    check(() => assert.equal(inspection.status, 'pending'));
    const inspectionPackage = beforeSettings.website_content.packages.find(item => item.id === inspection.package_type);
    check(() => assert.ok(inspectionPackage?.enabled));
    check(() => assert.equal(Number(inspection.estimated_fee), inspectionPackage.price, 'The browser booking must use the published fee'));
    check(() => assert.ok(records.sell_requests.every(record => record.status === 'received')));
    check(() => assert.equal(records.sell_requests.filter(record => record.condition_description.includes('(investor)')).length, 1, 'Exactly one browser submission must be the investor cash offer'));
    check(() => assert.equal(records.sell_requests.filter(record => record.model === '').length, 1, 'The simplified seller form must submit without its removed model field'));
    check(() => assert.equal(records.find_requests[0].status, 'active'));
    check(() => assert.ok(records.inquiries.every(record => record.status === 'new')));
    check(() => assert.equal(records.inquiries.filter(record => record.vehicle_id).length, 1, 'Exactly one inquiry must refer to the selected vehicle'));
    check(() => assert.equal(records.inquiries.filter(record => !record.vehicle_id).length, 1, 'The contact form must save its separate inquiry'));
    const sellIds = records.sell_requests.map(record => record.id);
    const photos = (await pool.query('SELECT id, request_id, mime_type, width, height, size FROM public.sell_request_photos WHERE request_id = ANY($1::text[])', [sellIds])).rows;
    uploadedPhotos = photos.length;
    if (requirePhoto) check(() => assert.ok(photos.length >= 1, 'The browser-selected car photo must be saved with its request'));
    if (photos.length) check(() => assert.ok(photos.every(photo => photo.mime_type === 'image/webp' && photo.width > 0 && photo.height > 0 && Number(photo.size) > 0)));
  } catch (error) {
    console.error('Public browser record verification failed: ' + error.message);
    process.exitCode = 1;
  } finally {
    try {
      const sellIds = (await pool.query('SELECT id FROM public.sell_requests WHERE email = $1 AND seller_name = $2', [email, marker])).rows.map(record => record.id);
      for (const [table, name] of tables) {
        await pool.query(`DELETE FROM public.${table} WHERE email = $1 AND ${name} = $2`, [email, marker]);
        const remaining = await pool.query(`SELECT id FROM public.${table} WHERE email = $1 AND ${name} = $2`, [email, marker]);
        check(() => assert.equal(remaining.rowCount, 0, `Generated browser ${table} records must be removed`));
      }
      const remainingPhotos = await pool.query('SELECT id FROM public.sell_request_photos WHERE request_id = ANY($1::text[])', [sellIds]);
      check(() => assert.equal(remainingPhotos.rowCount, 0, 'The generated photos must be removed with their requests'));
      const afterSettings = await settings();
      if (beforeSettings) check(() => assert.deepEqual(afterSettings, beforeSettings, 'Cleanup must leave business settings untouched'));
      if (existsSync(snapshotPath)) {
        check(() => assert.equal(fingerprint(afterSettings), readFileSync(snapshotPath, 'utf8'), 'Business settings must still match the saved fingerprint'));
        unlinkSync(snapshotPath);
      }
      cleanupPassed = true;
    } catch (error) {
      console.error('Public browser verification cleanup failed: ' + error.message);
      process.exitCode = 1;
    }
    await pool.end();
    if (!process.exitCode) console.log(JSON.stringify({ result: 'passed', checks, browserRequestsSavedAndRemoved: 6, uploadedPhotos, cleanupPassed, adminPortalUsed: false }));
  }
}
