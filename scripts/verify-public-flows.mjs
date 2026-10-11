import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import sharp from 'sharp';
import { databaseConfig } from './database-config.mjs';

// This verifier uses only public endpoints. It never signs in or edits business data.
const pool = new pg.Pool(databaseConfig());
const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const marker = `public-flow-verification-${randomUUID()}`;
const email = `${marker}@example.invalid`;
const phone = '03001234567';
const tables = [
  ['inspections', 'customer_name'], ['inquiries', 'name'],
  ['sell_requests', 'seller_name'], ['find_requests', 'buyer_name'],
];
const created = [];
const flows = [];
let checks = 0;
let beforeSettings;
let cleanupPassed = false;
let finished = false;
const check = (callback) => { callback(); checks++; };
const fee = (value) => `Rs. ${value.toLocaleString('en-PK')}`;

async function request(path, status, { method = 'GET', body, raw, headers = {} } = {}) {
  const multipart = body instanceof FormData;
  const response = await fetch(origin + path, {
    method,
    headers: { ...(body === undefined || multipart ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: raw ?? (body === undefined ? undefined : multipart ? body : JSON.stringify(body)),
    signal: AbortSignal.timeout(60000),
  });
  check(() => assert.equal(response.status, status, `${method} ${path}: received ${response.status}, expected ${status}`));
  return response;
}
async function json(path, status, options) {
  const result = await (await request(path, status, options)).json();
  check(() => assert.equal(result.success, status < 400, `${path} must return the expected success state`));
  if (status >= 400) check(() => assert.ok(result.error?.message, 'A rejected request must explain the error'));
  return result;
}
async function create(path, table, body) {
  const result = (await json(path, 201, { method: 'POST', body })).data;
  check(() => assert.ok(result.id, `${path} must return a request reference`));
  created.push({ table, id: result.id });
  const stored = await pool.query(`SELECT * FROM public.${table} WHERE id = $1 AND email = $2`, [result.id, email]);
  check(() => assert.equal(stored.rowCount, 1, 'The successful request must be saved in PostgreSQL'));
  return { result, stored: stored.rows[0] };
}

try {
  beforeSettings = (await pool.query("SELECT to_jsonb(s) AS settings FROM public.dealership_settings s WHERE id = 'main_settings'")).rows[0].settings;
  const health = await (await request('/api/health', 200)).json();
  check(() => assert.equal(health.database.connected, true));
  check(() => assert.equal(health.database.source, 'supabase'));
  const settings = (await json('/api/admin/settings', 200)).data;
  check(() => assert.equal(settings.dealershipName, beforeSettings.dealership_name));
  const content = settings.websiteContent;
  const pageAssets = new Set();
  for (const route of ['/', '/client/services', '/client/inspection', '/client/sell-my-car', '/client/car-finding', '/client/investor', '/client/contact', '/client/about', '/client/privacy-policy']) {
    const html = await (await request(route, 200)).text();
    check(() => assert.match(html, /<main[\s>]/, `${route} must render its public page`));
    for (const asset of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"<>]+\.(?:js|css)(?:\?[^"<>]*)?)"/g)) pageAssets.add(asset[1].replaceAll('&amp;', '&'));
  }
  check(() => assert.ok(pageAssets.size > 0, 'Public pages must include their application assets'));
  for (const asset of pageAssets) {
    const response = await request(asset, 200);
    check(() => assert.match(response.headers.get('content-type') || '', asset.includes('.css') ? /text\/css/ : /(?:application|text)\/javascript/));
    const chunk = await response.text();
    check(() => assert.ok(chunk.length > 0, 'Application chunks must not be empty'));
  }

  const inventory = await json('/api/vehicles?limit=100', 200);
  check(() => assert.equal(inventory.data.length, Math.min(inventory.meta.total, 100)));
  const available = inventory.data.find(vehicle => vehicle.status === 'available');
  check(() => assert.ok(available, 'A public available vehicle is needed to verify its inquiry form'));
  const single = (await json(`/api/vehicles/${available.id}`, 200)).data;
  check(() => assert.equal(single.id, available.id));
  const byBrand = (await json(`/api/vehicles?brand=${encodeURIComponent(available.brand)}&limit=100`, 200)).data;
  check(() => assert.ok(byBrand.length && byBrand.every(vehicle => vehicle.brand.toLowerCase() === available.brand.toLowerCase())));
  const bySearch = (await json(`/api/vehicles?search=${encodeURIComponent(available.model)}&limit=100`, 200)).data;
  check(() => assert.ok(bySearch.some(vehicle => vehicle.id === available.id)));
  const byPrice = (await json(`/api/vehicles?minPrice=${available.price}&maxPrice=${available.price}&limit=100`, 200)).data;
  check(() => assert.ok(byPrice.length && byPrice.every(vehicle => vehicle.price === available.price)));
  for (const [sort, key, direction] of [['price_asc', 'price', 1], ['price_desc', 'price', -1], ['year_desc', 'year', -1], ['mileage_asc', 'mileage', 1]]) {
    const sorted = (await json(`/api/vehicles?sort=${sort}&limit=100`, 200)).data;
    check(() => assert.ok(sorted.every((vehicle, index) => index === 0 || direction * (vehicle[key] - sorted[index - 1][key]) >= 0), `${sort} must sort its results`));
  }
  const noResults = await json(`/api/vehicles?search=${marker}`, 200);
  check(() => assert.equal(noResults.data.length, 0));
  await json('/api/vehicles?limit=-1', 400);
  await json('/api/vehicles?minPrice=20&maxPrice=10', 400);
  await json('/api/vehicles?sort=invalid', 400);
  await json('/api/vehicles/pm-verification-missing', 404);
  flows.push('public pages and vehicle search/filter/sort/details');

  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const inspection = { customerName: marker, email, phone, city: 'Lahore', carMake: 'Toyota', carModel: 'Corolla', carYear: 2022, preferredDate: date, preferredTimeSlot: 'morning', locationAddress: 'Temporary public website verification address', notes: marker };
  const inspectionPackages = content.packages.filter(item => item.kind === 'inspection');
  for (const selected of inspectionPackages) {
    const body = { ...inspection, packageType: selected.id, estimatedFee: 1 };
    if (!selected.enabled) { await json('/api/inspections', 400, { method: 'POST', body }); continue; }
    const { result, stored } = await create('/api/inspections', 'inspections', body);
    check(() => assert.equal(result.estimatedFee, selected.price, 'The booking fee must use the published package price'));
    check(() => assert.equal(Number(stored.estimated_fee), selected.price));
    check(() => assert.equal(result.packageType, selected.id));
    check(() => assert.equal(result.status, 'pending'));
  }
  const activeInspection = inspectionPackages.find(item => item.enabled);
  if (activeInspection) {
    for (const invalid of [{ preferredDate: '2020-01-01' }, { preferredDate: '2027-02-30' }, { carYear: 2022.5 }, { phone: '123' }, { email: 'invalid' }, { packageType: 'invalid' }]) {
      await json('/api/inspections', 400, { method: 'POST', body: { ...inspection, packageType: activeInspection.id, ...invalid } });
    }
  }
  flows.push('inspection packages, persistence, fee authority and validation');

  const sell = { sellerName: marker, email, phone, city: 'Lahore', brand: 'Toyota Corolla', year: 2022, mileage: 42000, expectedPrice: 4500000, conditionDescription: marker };
  const sellingPackages = content.packages.filter(item => ['selling', 'investor'].includes(item.kind));
  for (const selected of sellingPackages) {
    const body = { ...sell, packageType: selected.id, ...(selected.kind === 'investor' ? { model: 'Corolla' } : {}) };
    if (!selected.enabled) { await json('/api/sell-requests', 400, { method: 'POST', body }); continue; }
    const { result, stored } = await create('/api/sell-requests', 'sell_requests', body);
    check(() => assert.equal(result.brand, 'Toyota Corolla'));
    check(() => assert.equal(stored.model, selected.kind === 'investor' ? 'Corolla' : '', 'Selling without the removed model field must succeed'));
    check(() => assert.ok(result.conditionDescription.includes(`Service fee: ${fee(selected.price)}`)));
    check(() => assert.ok(result.conditionDescription.includes(`(${selected.id})`)));
    check(() => assert.ok(result.estimatedMarketValueMin <= sell.expectedPrice && result.estimatedMarketValueMax >= sell.expectedPrice));
    check(() => assert.equal(result.status, 'received'));
  }
  const activeSelling = sellingPackages.find(item => item.enabled);
  if (activeSelling) {
    const image = await sharp({ create: { width: 64, height: 40, channels: 3, background: '#6650a8' } }).webp().toBuffer();
    const body = new FormData();
    body.append('details', JSON.stringify({ ...sell, packageType: activeSelling.id }));
    body.append('photos', new Blob([image], { type: 'image/webp' }), 'temporary-verification.webp');
    const { result } = await create('/api/sell-requests', 'sell_requests', body);
    check(() => assert.equal(result.photos.length, 1));
    check(() => assert.equal(result.photos[0].width, 64));
    const photos = await pool.query('SELECT id FROM public.sell_request_photos WHERE request_id = $1', [result.id]);
    check(() => assert.equal(photos.rowCount, 1, 'Uploaded car photos must be saved with their request'));
    await json(result.photos[0].url, 401);
    for (const invalid of [{ expectedPrice: 4500000.5 }, { mileage: -1 }, { brand: '' }, { model: 3 }, { packageType: 'invalid' }]) {
      await json('/api/sell-requests', 400, { method: 'POST', body: { ...sell, packageType: activeSelling.id, ...invalid } });
    }
  }
  flows.push('all selling and investor packages, removed model field, photo upload and validation');

  const finder = { buyerName: marker, email, phone, targetBrand: 'Toyota', targetModel: 'Corolla', minYear: 2022, preferredCity: 'Lahore', notes: marker };
  for (const budget of [content.sourcing.minimumBudget, content.sourcing.highBudgetThreshold, content.sourcing.highBudgetThreshold + 1]) {
    const selected = content.packages.find(item => item.id === (budget > content.sourcing.highBudgetThreshold ? 'above_1cr' : 'under_1cr'));
    const body = { ...finder, budgetMax: budget, packageType: 'ignored', estimatedFee: 1 };
    if (!selected?.enabled) { await json('/api/car-finder', 400, { method: 'POST', body }); continue; }
    const { result, stored } = await create('/api/car-finder', 'find_requests', body);
    check(() => assert.equal(result.budgetMax, budget));
    check(() => assert.equal(Number(stored.budget_max), budget));
    check(() => assert.ok(result.notes.includes(`Service fee: ${fee(selected.price)}`)));
    check(() => assert.ok(result.notes.includes(`(${selected.id})`), 'The server must choose the sourcing tier from the actual budget'));
    check(() => assert.equal(result.status, 'active'));
  }
  for (const invalid of [{ budgetMax: content.sourcing.minimumBudget - 1 }, { budgetMax: content.sourcing.minimumBudget + .5 }, { budgetMax: content.sourcing.minimumBudget, targetModel: '' }]) {
    await json('/api/car-finder', 400, { method: 'POST', body: { ...finder, ...invalid } });
  }
  flows.push('car finding, budget boundaries, persistence and authoritative sourcing fees');

  const contact = { name: marker, email, phone, message: marker };
  for (const type of ['general', 'inspection', 'sell', 'vehicle', 'finance']) {
    const { result, stored } = await create('/api/inquiries', 'inquiries', { ...contact, type });
    check(() => assert.equal(result.type, type));
    check(() => assert.equal(stored.message, marker));
    check(() => assert.equal(result.status, 'new'));
  }
  const vehicleInquiry = await create('/api/inquiries', 'inquiries', { ...contact, type: 'vehicle', vehicleId: available.id });
  check(() => assert.equal(vehicleInquiry.result.vehicleId, available.id));
  check(() => assert.equal(vehicleInquiry.stored.vehicle_id, available.id));
  for (const invalid of [{ email: 'invalid' }, { phone: '123' }, { message: '' }, { type: 'invalid' }, { vehicleId: 'pm-verification-missing' }]) {
    await json('/api/inquiries', 400, { method: 'POST', body: { ...contact, ...invalid } });
  }
  await json('/api/inquiries', 400, { method: 'POST', raw: '{invalid', headers: { 'Content-Type': 'application/json' } });
  await json('/api/inquiries', 400, { method: 'POST', body: [] });
  flows.push('all contact topics, vehicle inquiry, persistence and validation');
  finished = true;
} catch (error) {
  console.error('Public website verification failed: ' + error.message);
  process.exitCode = 1;
} finally {
  try {
    let generated = 0;
    const sellIds = [];
    for (const [table, name] of tables) {
      const records = await pool.query(`SELECT id FROM public.${table} WHERE email = $1 AND ${name} = $2`, [email, marker]);
      generated += records.rowCount;
      if (table === 'sell_requests') sellIds.push(...records.rows.map(record => record.id));
      await pool.query(`DELETE FROM public.${table} WHERE email = $1 AND ${name} = $2`, [email, marker]);
      const remaining = await pool.query(`SELECT id FROM public.${table} WHERE email = $1 AND ${name} = $2`, [email, marker]);
      check(() => assert.equal(remaining.rowCount, 0, `Only generated ${table} verification records must be removed`));
    }
    const remainingPhotos = await pool.query('SELECT id FROM public.sell_request_photos WHERE request_id = ANY($1::text[])', [sellIds]);
    check(() => assert.equal(remainingPhotos.rowCount, 0));
    if (finished) check(() => assert.equal(generated, created.length, 'Rejected payloads must not save extra records'));
    const afterSettings = (await pool.query("SELECT to_jsonb(s) AS settings FROM public.dealership_settings s WHERE id = 'main_settings'")).rows[0].settings;
    if (beforeSettings) check(() => assert.deepEqual(afterSettings, beforeSettings, 'Business details, prices and theme must remain unchanged'));
    cleanupPassed = true;
  } catch (error) {
    console.error('Public verification cleanup failed: ' + error.message);
    process.exitCode = 1;
  }
  await pool.end();
  if (!process.exitCode) console.log(JSON.stringify({ result: 'passed', checks, requestsSavedAndRemoved: created.length, cleanupPassed, adminPortalUsed: false, flows }));
}
