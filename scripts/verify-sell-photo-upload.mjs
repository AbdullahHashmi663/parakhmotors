import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';

const nodeRequire = createRequire(import.meta.url);
const cache = new Map();
function load(sourcePath) {
  const filename = path.resolve(sourcePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = (specifier) => {
    if (specifier.startsWith('@/')) return load(path.join('src', specifier.slice(2) + '.ts'));
    if (specifier.startsWith('.')) return load(path.resolve(path.dirname(filename), specifier + '.ts'));
    return nodeRequire(specifier);
  };
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { processSellPhoto, readSellRequestSubmission } = load('src/backend/utils/sell-photo-upload.ts');
const { MAX_UPLOAD_PHOTO_BYTES, MAX_SELL_UPLOAD_BYTES } = load('src/lib/sell-photo-rules.ts');
let checks = 0;
const invalid = async (task, status = 400) => { await assert.rejects(task, (error) => error.statusCode === status); checks++; };
const details = { sellerName: 'Local validation', brand: 'Toyota', model: 'Corolla' };
const upload = (photos = [], data = JSON.stringify(details), extra) => {
  const form = new FormData();
  form.append('details', data);
  for (const photo of photos) form.append('photos', photo);
  if (extra) form.append(extra, 'untrusted');
  return new Request('http://localhost/api/sell-requests', { method: 'POST', body: form });
};
const pixel = { create: { width: 80, height: 60, channels: 3, background: '#426377' } };
const jpg = await sharp(pixel).jpeg().toBuffer();
const png = await sharp(pixel).png().toBuffer();
const webp = await sharp(pixel).webp().toBuffer();
for (const [type, data] of [['image/jpeg', jpg], ['image/png', png], ['image/webp', webp]]) {
  const result = await processSellPhoto(new File([data], 'car', { type }));
  const metadata = await sharp(result.data).metadata();
  assert.equal(result.mimeType, 'image/webp');
  assert.equal(metadata.format, 'webp');
  assert.equal(result.width, 80);
  assert.equal(result.height, 60);
  assert.equal(result.size, result.data.length);
  assert.ok(result.size <= MAX_UPLOAD_PHOTO_BYTES);
  checks++;
}
const oriented = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#533322' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
const orientationResult = await processSellPhoto(new File([oriented], 'rotated.jpg', { type: 'image/jpeg' }));
assert.deepEqual([orientationResult.width, orientationResult.height], [600, 1200]); checks++;
const stripped = await sharp(orientationResult.data).metadata();
assert.equal(stripped.exif, undefined); assert.equal(stripped.icc, undefined); checks++;
await invalid(processSellPhoto(new File([jpg], 'spoof.png', { type: 'image/png' })));
await invalid(processSellPhoto(new File(['<svg></svg>'], 'unsafe.svg', { type: 'image/svg+xml' })));
await invalid(processSellPhoto(new File(['<svg></svg>'], 'unsafe.jpg', { type: 'image/jpeg' })));
await invalid(processSellPhoto(new File([], 'empty.jpg', { type: 'image/jpeg' })));
await invalid(processSellPhoto(new File([Buffer.alloc(MAX_UPLOAD_PHOTO_BYTES + 1)], 'large.webp', { type: 'image/webp' })), 413);
await invalid(processSellPhoto(new File([jpg.subarray(0, 25)], 'damaged.jpg', { type: 'image/jpeg' })));
const huge = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: '#334455' } }).png().toBuffer();
assert.ok(huge.length < MAX_UPLOAD_PHOTO_BYTES);
await invalid(processSellPhoto(new File([huge], 'pixels.png', { type: 'image/png' })));
const animation = await sharp(Buffer.alloc(600).fill(255, 0, 300), { raw: { width: 10, height: 20, channels: 3, pageHeight: 10 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
await invalid(processSellPhoto(new File([animation], 'animation.webp', { type: 'image/webp' })));
const plain = await readSellRequestSubmission(new Request('http://localhost/api/sell-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) }));
assert.deepEqual(plain, { details, photos: [] }); checks++;
const file = new File([jpg], 'car.jpg', { type: 'image/jpeg' });
const parsed = await readSellRequestSubmission(upload([file]));
assert.deepEqual(parsed.details, details); assert.equal(parsed.photos.length, 1); checks++;
assert.equal((await readSellRequestSubmission(upload())).photos.length, 0); checks++;
await invalid(readSellRequestSubmission(upload(Array(7).fill(file))));
await invalid(readSellRequestSubmission(upload([], '[]')));
await invalid(readSellRequestSubmission(upload([], '{bad')));
await invalid(readSellRequestSubmission(upload([], JSON.stringify(details), 'imageUrl')));
await invalid(readSellRequestSubmission(upload([], JSON.stringify({ text: 'X'.repeat(65 * 1024) }))), 413);
const repeated = new FormData(); repeated.append('details', '{}'); repeated.append('details', '{}');
await invalid(readSellRequestSubmission(new Request('http://localhost/api/sell-requests', { method: 'POST', body: repeated })));
const textPhoto = new FormData(); textPhoto.append('details', '{}'); textPhoto.append('photos', '/untrusted.jpg');
await invalid(readSellRequestSubmission(new Request('http://localhost/api/sell-requests', { method: 'POST', body: textPhoto })));
await invalid(readSellRequestSubmission(new Request('http://localhost/api/sell-requests', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=invalid', 'Content-Length': String(MAX_SELL_UPLOAD_BYTES + 1) }, body: 'bad' })), 413);
await invalid(readSellRequestSubmission(new Request('http://localhost/api/sell-requests', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=invalid', 'Content-Length': '1' }, body: Buffer.alloc(MAX_SELL_UPLOAD_BYTES + 1) })), 413);
await invalid(readSellRequestSubmission(new Request('http://localhost/api/sell-requests', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=invalid' }, body: 'bad' })));
console.log(JSON.stringify({ result: 'passed', checks, scope: 'Local photo decode, optimization and bounded multipart validation; no database writes' }));
