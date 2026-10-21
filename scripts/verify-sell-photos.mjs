import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import sharp from 'sharp';
import { databaseConfig } from './database-config.mjs';

const pool = new pg.Pool(databaseConfig());
const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const marker = `photo-verification-${randomUUID()}`;
const email = `${marker}@example.invalid`;
let cookie = '';
let checks = 0;
let originalContent;
let cleanupPassed = false;
let flowFinished = false;
const check = (callback) => { callback(); checks++; };
async function request(route, status, { method = 'GET', body, admin = false } = {}) {
  const multipart = body instanceof FormData;
  const response = await fetch(origin + route, {
    method, headers: { ...(body === undefined || multipart ? {} : { 'Content-Type': 'application/json' }), ...(admin ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  check(() => assert.equal(response.status, status, `${method} ${route}: ${response.status}, expected ${status}`));
  return response;
}
const multipart = (details, photos) => {
  const body = new FormData();
  body.append('details', JSON.stringify(details));
  for (const [index, photo] of photos.entries()) body.append('photos', new Blob([photo.bytes], { type: photo.type }), `car-photo-${index + 1}.${photo.extension || 'webp'}`);
  return body;
};

try {
  originalContent = (await pool.query("SELECT website_content FROM public.dealership_settings WHERE id = 'main_settings'")).rows[0].website_content;
  const settings = (await (await request('/api/admin/settings', 200)).json()).data;
  const selected = settings.websiteContent.packages.find((item) => ['selling', 'investor'].includes(item.kind) && item.enabled);
  assert.ok(selected, 'At least one selling package must be available for this test');
  const details = { sellerName: marker, email, phone: '03001234567', city: 'Lahore', brand: 'Test', model: 'Photo verification', year: 2022, mileage: 10000, expectedPrice: 4000000, packageType: selected.id };
  const source = sharp({ create: { width: 64, height: 40, channels: 3, background: '#6650a8' } });
  const jpeg = await source.clone().jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const png = await source.clone().png().toBuffer();
  const webp = await source.clone().webp().toBuffer();
  const samples = [{ bytes: jpeg, type: 'image/jpeg', extension: 'jpg' }, { bytes: png, type: 'image/png', extension: 'png' }, { bytes: webp, type: 'image/webp' }];
  const received = (await (await request('/api/sell-requests', 201, { method: 'POST', body: multipart(details, samples) })).json()).data;
  check(() => assert.equal(received.photos.length, 3));
  check(() => assert.deepEqual(received.photos.map((photo) => [photo.width, photo.height]), [[40, 64], [64, 40], [64, 40]]));
  check(() => assert.ok(received.photos.every((photo) => photo.url === `/api/sell-requests/${received.id}/photos/${photo.id}` && photo.size > 0 && photo.size <= 512 * 1024)));
  await request(received.photos[0].url, 401);
  const login = await request('/api/admin/session', 200, { method: 'POST', body: { username: process.env.ADMIN_USERNAME || 'parakhmotors777', password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD } });
  cookie = login.headers.get('set-cookie').split(';')[0];
  const all = (await (await request('/api/admin/data', 200, { admin: true })).json()).data;
  check(() => assert.deepEqual(all.sellRequests.find((item) => item.id === received.id).photos, received.photos));
  const listing = (await (await request('/api/sell-requests', 200, { admin: true })).json()).data;
  check(() => assert.equal(listing.find((item) => item.id === received.id).photos.length, 3));
  const image = await request(received.photos[0].url, 200, { admin: true });
  check(() => assert.match(image.headers.get('content-type'), /^image\/webp/));
  check(() => assert.match(image.headers.get('cache-control'), /no-store/));
  check(() => assert.equal(image.headers.get('x-content-type-options'), 'nosniff'));
  const metadata = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
  check(() => assert.equal(metadata.format, 'webp'));
  check(() => assert.equal(metadata.exif, undefined));
  check(() => assert.equal(metadata.orientation, undefined));
  await request(`/api/sell-requests/pm-sell-missing/photos/${received.photos[0].id}`, 404, { admin: true });
  const plain = (await (await request('/api/sell-requests', 201, { method: 'POST', body: details })).json()).data;
  check(() => assert.deepEqual(plain.photos, []));
  await request('/api/sell-requests', 400, { method: 'POST', body: multipart(details, Array(7).fill(samples[2])) });
  await request('/api/sell-requests', 400, { method: 'POST', body: multipart(details, [{ bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), type: 'image/svg+xml', extension: 'svg' }]) });
  await request('/api/sell-requests', 400, { method: 'POST', body: multipart(details, [{ bytes: Buffer.from('not an image'), type: 'image/jpeg', extension: 'jpg' }]) });
  await request('/api/sell-requests', 400, { method: 'POST', body: multipart(details, [{ bytes: webp, type: 'image/png', extension: 'png' }]) });
  await request('/api/sell-requests', 400, { method: 'POST', body: multipart(details, [{ bytes: Buffer.alloc(0), type: 'image/webp' }]) });
  await request('/api/sell-requests', 413, { method: 'POST', body: multipart(details, [{ bytes: Buffer.alloc(512 * 1024 + 1), type: 'image/webp' }]) });
  await request('/api/sell-requests', 413, { method: 'POST', body: multipart(details, [{ bytes: Buffer.alloc(4 * 1024 * 1024 + 1), type: 'image/webp' }]) });
  const incomplete = new FormData(); incomplete.append('photos', new Blob([webp], { type: 'image/webp' }), 'car.webp');
  await request('/api/sell-requests', 400, { method: 'POST', body: incomplete });
  flowFinished = true;
} catch (error) {
  console.error('Sell photo verification failed: ' + error.message);
  process.exitCode = 1;
} finally {
  try {
    const records = await pool.query('SELECT id FROM public.sell_requests WHERE email = $1 AND seller_name = $2', [email, marker]);
    const ids = records.rows.map((record) => record.id);
    await pool.query('DELETE FROM public.sell_requests WHERE email = $1 AND seller_name = $2', [email, marker]);
    const remaining = await pool.query('SELECT COUNT(*) FROM public.sell_request_photos WHERE request_id = ANY($1::text[])', [ids]);
    check(() => assert.equal(Number(remaining.rows[0].count), 0));
    if (flowFinished) check(() => assert.equal(records.rows.length, 2, 'Invalid uploads must not create additional seller requests'));
    const finalContent = (await pool.query("SELECT website_content FROM public.dealership_settings WHERE id = 'main_settings'")).rows[0].website_content;
    check(() => assert.deepEqual(finalContent, originalContent, 'Business details and prices must remain unchanged'));
    cleanupPassed = true;
  } catch (error) {
    console.error('Verification cleanup failed: ' + error.message);
    process.exitCode = 1;
  }
  await pool.end();
  if (!process.exitCode) console.log(JSON.stringify({ result: 'passed', checks, cleanupPassed, scope: 'Private sell photos, multipart validation, orientation, metadata privacy, compatibility and cascade cleanup' }));
}
