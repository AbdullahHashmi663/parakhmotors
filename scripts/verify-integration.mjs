import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const marker = 'Integration ' + randomUUID();
const created = [];
let cookie = '';
let savedSettings;
let savedThemeId;
let tests = 0;
async function request(path, method = 'GET', body, options = {}) {
  const headers = { ...options.headers };
  if (options.admin) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(origin + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  return { response, data };
}
async function expectStatus(path, status, method = 'GET', body, options) {
  const result = await request(path, method, body, options);
  assert.equal(result.response.status, status, `${method} ${path}: expected ${status}, received ${result.response.status}`);
  tests += 1;
  return result;
}
async function create(path, table, body) {
  const { data } = await expectStatus(path, 201, 'POST', body, { admin: table === 'vehicles' });
  assert.ok(data.data.id);
  created.push({ path: path + '/' + data.data.id, table, id: data.data.id });
  assert.equal((await pool.query(`SELECT id FROM public.${table} WHERE id = $1`, [data.data.id])).rowCount, 1);
  tests += 1;
  return data.data;
}
async function checkRestrictedRoles() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE anon');
    assert.ok((await client.query('SELECT id FROM public.vehicles LIMIT 1')).rowCount);
    tests += 1;
    await assert.rejects(client.query('SELECT id FROM public.inquiries'), (error) => error.code === '42501');
    tests += 1;
    await client.query('ROLLBACK');
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

try {
  const { data: health } = await expectStatus('/api/health', 200);
  assert.equal(health.database.connected, true);
  assert.equal(health.database.source, 'supabase');
  await checkRestrictedRoles();
  for (const path of ['/api/admin/data', '/api/inspections', '/api/inquiries', '/api/sell-requests', '/api/car-finder']) {
    await expectStatus(path, 401);
    await expectStatus(path, 401, 'GET', undefined, { headers: { Cookie: 'pm_admin_session=authenticated' } });
  }
  await expectStatus('/api/vehicles', 401, 'POST', {});
  await expectStatus('/api/admin/settings', 401, 'PUT', {});
  await expectStatus('/api/admin/themes', 401, 'POST', {});
  const invalid = await expectStatus('/api/admin/session', 401, 'POST', { password: 'not-the-password' });
  assert.equal(invalid.data.success, false);
  const login = await expectStatus('/api/admin/session', 200, 'POST', { password: process.env.ADMIN_PASSWORD });
  const setCookie = login.response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  cookie = setCookie.split(';')[0];
  await expectStatus('/api/admin/data', 200, 'GET', undefined, { admin: true });
  await expectStatus('/api/admin/settings', 403, 'PUT', { dealershipName: marker }, { admin: true, headers: { Origin: 'https://different-origin.invalid' } });
  const expiredPayload = Buffer.from(JSON.stringify({ expires: Math.floor(Date.now() / 1000) - 1, nonce: 'test' })).toString('base64url');
  const key = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(process.env.ADMIN_PASSWORD).digest('hex');
  const expired = expiredPayload + '.' + createHmac('sha256', key).update(expiredPayload).digest('base64url');
  await expectStatus('/api/admin/data', 401, 'GET', undefined, { headers: { Cookie: 'pm_admin_session=' + expired } });

  const vehicleBody = { title: marker, brand: 'Toyota', model: 'Corolla', year: 2022, price: 5000000, mileage: 25000, fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan', condition: 'used', inspectionScore: 95, color: 'White', location: 'Lahore', status: 'available', featured: false, images: ['/images/hero-drive.webp'], features: ['Test feature'], description: 'Temporary integration verification listing' };
  await expectStatus('/api/vehicles', 400, 'POST', { ...vehicleBody, price: 5000000.5 }, { admin: true });
  await expectStatus('/api/vehicles', 400, 'POST', { ...vehicleBody, inspectionScore: 95.5 }, { admin: true });
  const vehicle = await create('/api/vehicles', 'vehicles', vehicleBody);
  await expectStatus('/api/vehicles/' + vehicle.id, 200);
  const updatedVehicle = await expectStatus('/api/vehicles/' + vehicle.id, 200, 'PUT', { price: 5100000, status: 'reserved', id: 'must-not-change' }, { admin: true });
  assert.equal(updatedVehicle.data.data.id, vehicle.id);
  assert.equal(updatedVehicle.data.data.price, 5100000);
  const results = await expectStatus('/api/vehicles?search=' + encodeURIComponent(marker) + '&limit=1', 200);
  assert.equal(results.data.data[0].id, vehicle.id);
  const page = await expectStatus('/api/vehicles?limit=2&page=2', 200);
  assert.equal(page.data.meta.page, 2);
  assert.equal(page.data.data.length, 2);
  await expectStatus('/api/vehicles?limit=-1', 400);

  const contact = { name: marker, phone: '03001234567', email: 'integration@example.invalid' };
  const futureDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const inspectionBody = { customerName: contact.name, email: contact.email, phone: contact.phone, city: 'Lahore', carMake: 'Toyota', carModel: 'Corolla', carYear: 2022, packageType: 'basic', preferredDate: futureDate, preferredTimeSlot: 'morning', locationAddress: 'Integration test address', notes: marker };
  await expectStatus('/api/inspections', 400, 'POST', { ...inspectionBody, preferredDate: '2020-01-01' });
  const inspection = await create('/api/inspections', 'inspections', inspectionBody);
  assert.equal(inspection.estimatedFee, 7000);
  await expectStatus('/api/inspections/' + inspection.id, 401);
  await expectStatus('/api/inspections/' + inspection.id, 200, 'PATCH', { status: 'confirmed' }, { admin: true });
  await expectStatus('/api/inspections/' + inspection.id, 400, 'PATCH', { status: 'invalid' }, { admin: true });

  const inquiry = await create('/api/inquiries', 'inquiries', { ...contact, message: marker, type: 'vehicle', vehicleId: vehicle.id });
  await expectStatus('/api/inquiries/' + inquiry.id, 200, 'PATCH', { status: 'contacted' }, { admin: true });
  await expectStatus('/api/inquiries', 400, 'POST', { ...contact, email: 'invalid', message: marker });
  const sellBody = { sellerName: contact.name, phone: contact.phone, email: contact.email, city: 'Lahore', brand: 'Toyota', model: 'Corolla', year: 2022, mileage: 25000, expectedPrice: 5000000, conditionDescription: marker };
  await expectStatus('/api/sell-requests', 400, 'POST', { ...sellBody, expectedPrice: 5000000.5 });
  const sell = await create('/api/sell-requests', 'sell_requests', sellBody);
  await expectStatus('/api/sell-requests/' + sell.id, 200, 'PATCH', { status: 'valuation_provided' }, { admin: true });
  const finderBody = { buyerName: contact.name, phone: contact.phone, email: contact.email, targetBrand: 'Toyota', targetModel: 'Corolla', minYear: 2022, budgetMax: 6000000, preferredCity: 'Lahore', notes: marker };
  await expectStatus('/api/car-finder', 400, 'POST', { ...finderBody, budgetMax: 6000000.5 });
  const finder = await create('/api/car-finder', 'find_requests', finderBody);
  await expectStatus('/api/car-finder/' + finder.id, 200, 'PATCH', { status: 'options_found' }, { admin: true });

  const adminData = await expectStatus('/api/admin/data', 200, 'GET', undefined, { admin: true });
  assert.ok(adminData.data.data.inspections.some(row => row.id === inspection.id && row.status === 'confirmed'));
  assert.ok(adminData.data.data.inquiries.some(row => row.id === inquiry.id && row.status === 'contacted'));
  assert.ok(adminData.data.data.sellRequests.some(row => row.id === sell.id && row.status === 'valuation_provided'));
  assert.ok(adminData.data.data.findRequests.some(row => row.id === finder.id && row.status === 'options_found'));
  savedSettings = adminData.data.data.settings;
  savedThemeId = savedSettings.activeThemeId;
  await expectStatus('/api/admin/settings', 200, 'PUT', { announcement: marker }, { admin: true });
  const publicSettings = await expectStatus('/api/admin/settings', 200);
  assert.equal(publicSettings.data.data.announcement, marker);
  await expectStatus('/api/admin/settings', 400, 'PUT', { currency: 'USD' }, { admin: true });
  await expectStatus('/api/admin/settings', 200, 'PUT', savedSettings, { admin: true });
  const theme = { id: 'custom-test-' + randomUUID(), name: marker, category: 'Custom', description: 'Temporary verification palette', background: '#f6f7f2', foreground: '#18392f', card_bg: '#ffffff', border_color: '#dddddd', primary: '#18392f', accent: '#d4ef83', glow_color: 'rgba(0,0,0,0.1)', is_active: false };
  await expectStatus('/api/admin/themes', 200, 'POST', { action: 'save_theme', theme }, { admin: true });
  created.push({ path: '/api/admin/themes?id=' + theme.id, table: 'themes', id: theme.id });
  await expectStatus('/api/admin/themes', 200, 'POST', { action: 'set_active', themeId: theme.id }, { admin: true });
  const themes = await expectStatus('/api/admin/themes', 200);
  assert.equal(themes.data.activeTheme.id, theme.id);
  assert.equal(themes.data.data.filter(row => row.is_active).length, 1);
  await expectStatus('/api/admin/themes', 200, 'POST', { action: 'set_active', themeId: savedThemeId }, { admin: true });
  console.log(JSON.stringify({ checks: tests, result: 'passed', database: 'supabase', customerFlows: ['inspection', 'contact/vehicle inquiry', 'sell/investor request', 'car finder'], adminFlows: ['login', 'inventory CRUD', 'request statuses', 'themes', 'settings'], privacy: 'verified' }));
} catch (error) {
  console.error('Integration verification failed: ' + error.message);
  process.exitCode = 1;
} finally {
  if (savedSettings) await request('/api/admin/settings', 'PUT', savedSettings, { admin: true }).catch(() => {});
  if (savedThemeId) await request('/api/admin/themes', 'POST', { action: 'set_active', themeId: savedThemeId }, { admin: true }).catch(() => {});
  for (const record of created.reverse()) {
    const result = await request(record.path, 'DELETE', undefined, { admin: true }).catch(() => null);
    if (result?.response.status !== 200) await pool.query(`DELETE FROM public.${record.table} WHERE id = $1`, [record.id]);
    assert.equal((await pool.query(`SELECT id FROM public.${record.table} WHERE id = $1`, [record.id])).rowCount, 0);
  }
  await pool.end();
  console.log('Temporary verification records removed; original settings restored.');
}
