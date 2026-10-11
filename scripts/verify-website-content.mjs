import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const created = [];
let cookie = '';
let original;
let rawOriginal;
let checks = 0;
let changed = false;
async function request(route, status, method = 'GET', body, admin = false) {
  const response = await fetch(origin + route, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(admin ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  assert.equal(response.status, status, `${method} ${route} returned ${response.status} instead of ${status}`);
  checks++;
  return { response, result };
}
async function save(content) {
  changed = true;
  return (await request('/api/admin/settings', 200, 'PUT', { websiteContent: content }, true)).result.data;
}
async function create(route, body, table) {
  const record = (await request(route, 201, 'POST', body)).result.data;
  assert.ok(record.id);
  created.push({ route: route + '/' + record.id, table, id: record.id });
  return record;
}
try {
  await request('/api/admin/settings', 401, 'PUT', { websiteContent: {} });
  const login = await request('/api/admin/session', 200, 'POST', { password: process.env.ADMIN_PASSWORD });
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  original = (await request('/api/admin/settings', 200)).result.data;
  rawOriginal = (await pool.query("SELECT website_content FROM public.dealership_settings WHERE id = 'main_settings'")).rows[0].website_content;
  const malformed = structuredClone(original.websiteContent);
  malformed.packages[1].id = malformed.packages[0].id;
  await request('/api/admin/settings', 400, 'PUT', { websiteContent: malformed }, true);
  malformed.packages = original.websiteContent.packages;
  malformed.home.heroImage = 'javascript:alert(1)';
  await request('/api/admin/settings', 400, 'PUT', { websiteContent: malformed }, true);
  const content = structuredClone(original.websiteContent);
  const marker = 'Content verification ' + randomUUID();
  content.pages.services.headline = marker;
  content.contact.whatsappMessage = marker;
  content.services.push({ ...content.services[0], id: 'verification-' + randomUUID().slice(0, 8), title: marker, packageIds: [], href: '/client/contact' });
  content.pages.inspection.extras.formAside.rows = [{ title: marker, description: 'Editable page block verified' }];
  const basic = content.packages.find((item) => item.id === 'basic');
  basic.enabled = true;
  basic.price += 123;
  const saved = await save(content);
  assert.equal(saved.websiteContent.pages.services.headline, marker); checks++;
  const publicSettings = (await request('/api/admin/settings', 200)).result.data;
  assert.equal(publicSettings.websiteContent.contact.whatsappMessage, marker); checks++;
  assert.equal(publicSettings.websiteContent.services.at(-1).title, marker); checks++;
  assert.deepEqual((await pool.query("SELECT website_content FROM public.dealership_settings WHERE id = 'main_settings'")).rows[0].website_content, saved.websiteContent); checks++;
  const contact = { email: 'content-verification@example.invalid', phone: '03001234567' };
  const inspection = { ...contact, customerName: marker, city: 'Lahore', carMake: 'Toyota', carModel: 'Corolla', carYear: 2022, packageType: 'basic', preferredDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), estimatedFee: 1 };
  assert.equal((await create('/api/inspections', inspection, 'inspections')).estimatedFee, basic.price); checks++;
  basic.enabled = false;
  await save(content);
  await request('/api/inspections', 400, 'POST', inspection);
  const selling = content.packages.find((item) => item.id === 'sell_outside');
  selling.enabled = true;
  selling.price = 33333;
  content.sourcing.minimumBudget = 6000000;
  content.sourcing.highBudgetThreshold = 8000000;
  const sourcing = content.packages.find((item) => item.id === 'under_1cr');
  sourcing.enabled = true;
  sourcing.price = 54321;
  await save(content);
  const sell = { ...contact, sellerName: marker, city: 'Lahore', brand: 'Toyota', model: 'Corolla', year: 2022, mileage: 25000, expectedPrice: 5000000, packageType: 'sell_outside', estimatedFee: 1 };
  assert.match((await create('/api/sell-requests', sell, 'sell_requests')).conditionDescription, /33,333/); checks++;
  const finder = { ...contact, buyerName: marker, targetBrand: 'Toyota', targetModel: 'Corolla', minYear: 2022, budgetMax: 6500000, preferredCity: 'Lahore', estimatedFee: 1 };
  assert.match((await create('/api/car-finder', finder, 'find_requests')).notes, /54,321/); checks++;
  await request('/api/car-finder', 400, 'POST', { ...finder, budgetMax: 5000000 });
  selling.enabled = false;
  sourcing.enabled = false;
  await save(content);
  await request('/api/sell-requests', 400, 'POST', sell);
  await request('/api/car-finder', 400, 'POST', finder);
  console.log(JSON.stringify({ result: 'passed', checks, scope: 'Admin content persistence, public reads, safe validation and server service prices' }));
} catch (error) {
  console.error('Website content verification failed: ' + error.message);
  process.exitCode = 1;
} finally {
  try {
    if (changed && original) {
      await request('/api/admin/settings', 200, 'PUT', { websiteContent: original.websiteContent }, true);
      await pool.query("UPDATE public.dealership_settings SET website_content = $1::jsonb WHERE id = 'main_settings'", [JSON.stringify(rawOriginal)]);
      assert.deepEqual((await pool.query("SELECT website_content FROM public.dealership_settings WHERE id = 'main_settings'")).rows[0].website_content, rawOriginal);
    }
    for (const record of created.reverse()) {
      try { await request(record.route, 200, 'DELETE', undefined, true); }
      catch { await pool.query(`DELETE FROM public.${record.table} WHERE id = $1`, [record.id]); }
      assert.equal((await pool.query(`SELECT id FROM public.${record.table} WHERE id = $1`, [record.id])).rowCount, 0);
    }
    console.log('Temporary verification requests removed and original website content restored.');
  } catch (error) {
    console.error('Website content cleanup failed: ' + error.message);
    process.exitCode = 1;
  } finally { await pool.end(); }
}
