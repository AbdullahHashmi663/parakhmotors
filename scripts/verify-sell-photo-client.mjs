import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

let checks = 0;
function check(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function load(sourcePath, globals = {}, mocks = {}, cache = new Map()) {
  const filename = path.resolve(sourcePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const require = specifier => {
    if (specifier in mocks) return mocks[specifier];
    if (specifier.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key });
    let target = specifier.startsWith('@/') ? path.join('src', specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) throw new Error(`Unexpected dependency ${specifier}`);
    if (!path.extname(target)) target += '.ts';
    return load(target, globals, mocks, cache);
  };
  vm.runInNewContext(compiled, { module: loadedModule, exports: loadedModule.exports, require, File, Blob, FormData, Headers, Response, URL, Event, ...globals }, { filename });
  return loadedModule.exports;
}

const { MAX_ORIGINAL_PHOTO_BYTES, MAX_UPLOAD_PHOTO_BYTES } = load('src/lib/sell-photo-rules.ts');
const { validateOriginalSellPhoto, fitSellPhotoDimensions } = load('src/lib/prepare-sell-photos.ts');
for (const type of ['image/jpeg', 'image/png', 'image/webp']) check(validateOriginalSellPhoto({ type, size: 100 }), undefined);
check(validateOriginalSellPhoto({ type: 'image/jpeg', size: MAX_ORIGINAL_PHOTO_BYTES }), undefined);
assert.match(validateOriginalSellPhoto({ type: 'image/gif', size: 100 }), /JPEG, PNG or WebP/); checks++;
assert.match(validateOriginalSellPhoto({ type: 'image/jpeg', size: 0 }), /Empty/); checks++;
assert.match(validateOriginalSellPhoto({ type: 'image/jpeg', size: MAX_ORIGINAL_PHOTO_BYTES + 1 }), /5 MB/); checks++;
check(JSON.stringify(fitSellPhotoDimensions(4000, 3000)), JSON.stringify({ width: 1600, height: 1200 }));
check(JSON.stringify(fitSellPhotoDimensions(3000, 4000)), JSON.stringify({ width: 900, height: 1200 }));
check(JSON.stringify(fitSellPhotoDimensions(600, 400)), JSON.stringify({ width: 600, height: 400 }));
assert.throws(() => fitSellPhotoDimensions(0, 1), /invalid dimensions/); checks++;
assert.throws(() => fitSellPhotoDimensions(Infinity, 1), /invalid dimensions/); checks++;

function photoEnvironment(sizeFor) {
  const calls = [];
  let released = 0;
  const canvas = { width: 0, height: 0,
    getContext: () => ({ drawImage: () => {} }),
    toBlob(callback, type, quality) { calls.push({ width: this.width, height: this.height, quality }); callback(new Blob([new Uint8Array(sizeFor(this, quality))], { type })); },
  };
  return { calls, get released() { return released; }, globals: {
    createImageBitmap: async () => ({ width: 4000, height: 3000, close() { released++; } }),
    document: { createElement: () => canvas },
  } };
}
const input = new File(['private original bytes'], 'owner-home-plate.jpg', { type: 'image/jpeg' });
const simpleEnv = photoEnvironment(() => 100);
const prepared = await load('src/lib/prepare-sell-photos.ts', simpleEnv.globals).prepareSellPhotos([input]);
check(prepared.length, 1);
check(prepared[0].name, 'car-photo-1.webp');
check(prepared[0].type, 'image/webp');
check(prepared[0].size, 100);
check(simpleEnv.calls, [{ width: 1600, height: 1200, quality: 0.82 }]);
check(simpleEnv.released, 1);
const qualityEnv = photoEnvironment((_, quality) => quality > 0.7 ? MAX_UPLOAD_PHOTO_BYTES + 1 : 200);
await load('src/lib/prepare-sell-photos.ts', qualityEnv.globals).prepareSellPhotos([input]);
check(qualityEnv.calls.map(call => call.quality), [0.82, 0.7]);
const scaleEnv = photoEnvironment(canvas => canvas.width > 1200 ? MAX_UPLOAD_PHOTO_BYTES + 1 : 300);
await load('src/lib/prepare-sell-photos.ts', scaleEnv.globals).prepareSellPhotos([input]);
check(scaleEnv.calls.at(-1), { width: 1200, height: 900, quality: 0.82 });
const oversizeEnv = photoEnvironment(() => MAX_UPLOAD_PHOTO_BYTES + 1);
await assert.rejects(() => load('src/lib/prepare-sell-photos.ts', oversizeEnv.globals).prepareSellPhotos([input]), /could not be reduced/); checks++;
check(oversizeEnv.released, 1);
await assert.rejects(() => load('src/lib/prepare-sell-photos.ts', simpleEnv.globals).prepareSellPhotos(Array(7).fill(input)), /up to 6/); checks++;
await assert.rejects(() => load('src/lib/prepare-sell-photos.ts', simpleEnv.globals).prepareSellPhotos([new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })]), /JPEG, PNG or WebP/); checks++;
const wrongFormatEnv = photoEnvironment(() => 100);
wrongFormatEnv.globals.document.createElement = () => ({ getContext: () => ({ drawImage: () => {} }), toBlob: callback => callback(new Blob(['bad'], { type: 'image/png' })) });
await assert.rejects(() => load('src/lib/prepare-sell-photos.ts', wrongFormatEnv.globals).prepareSellPhotos([input]), /could not prepare/); checks++;
check(wrongFormatEnv.released, 1);

const requests = [];
const { api } = load('src/lib/api-client.ts', { fetch: async (url, options) => { requests.push({ url, ...options }); return new Response(JSON.stringify({ success: true, data: { id: 'offline-request' } }), { status: 201 }); } });
const payload = { sellerName: 'Offline customer', phone: '03001234567', email: 'offline@example.com', city: 'Lahore', brand: 'Toyota', model: 'Corolla', year: 2022, mileage: 45000, expectedPrice: 4000000, packageType: 'sell_lahore' };
await api.sellRequests.submit(payload);
check(requests[0].headers.get('Content-Type'), 'application/json');
check(JSON.parse(requests[0].body), payload);
await api.sellRequests.submit(payload, prepared);
check(requests[1].url, '/api/sell-requests');
check(requests[1].method, 'POST');
check(requests[1].headers.get('Content-Type'), null);
check(JSON.parse(requests[1].body.get('details')), payload);
check(requests[1].body.getAll('photos').length, 1);
check(requests[1].body.get('photos').name, 'car-photo-1.webp');
await api.sellRequests.submit(payload, []);
check(typeof requests[2].body, 'string');

// Run the real chooser's event handlers with a minimal React renderer.
const slots = [], cleanups = [], revoked = [];
let slot = 0, urlCount = 0, selected = [], props = { onChange: files => { selected = files; }, disabled: false };
const react = {
  useId: () => 'offline-photos',
  useState(initial) { const index = slot++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef(initial) { const index = slot++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
  useEffect(effect) { const index = slot++; if (!(index in slots)) { slots[index] = true; const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } },
};
const jsx = (type, props, key) => ({ type, props, key });
const component = load('src/components/SellPhotoUpload.tsx', { URL: { createObjectURL: () => `blob:offline-${++urlCount}`, revokeObjectURL: url => revoked.push(url) } }, { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/image': { __esModule: true, default: 'image' }, 'lucide-react': { Camera: 'camera', CircleAlert: 'alert', X: 'x' } }).default;
function render() { slot = 0; return component(props); }
function descendants(node) { if (!node || typeof node !== 'object') return []; return [node, ...(Array.isArray(node.props?.children) ? node.props.children.flatMap(descendants) : descendants(node.props?.children))]; }
function choose(files) { const event = { currentTarget: { files, value: 'original-value' } }; descendants(render()).find(node => node.type === 'input').props.onChange(event); check(event.currentTarget.value, ''); }
choose([input]); check(selected.length, 1);
choose([input]); check(selected.length, 1);
assert.match(descendants(render()).find(node => node.props?.role === 'alert').props.children[1].props.children, /already attached/); checks++;
choose(Array.from({ length: 6 }, (_, index) => new File([`photo ${index}`], `photo-${index}.png`, { type: 'image/png' })));
check(selected.length, 6);
assert.match(descendants(render()).find(node => node.props?.role === 'alert').props.children[1].props.children, /up to 6/); checks++;
const remove = descendants(render()).find(node => node.type === 'button');
remove.props.onClick(); check(selected.length, 5); check(revoked.length, 1);
choose([input]); check(selected.length, 6);
props = { ...props, disabled: true };
check(render().props.disabled, true);
descendants(render()).find(node => node.type === 'button').props.onClick(); check(selected.length, 6);
cleanups.forEach(cleanup => cleanup()); check(revoked.length, urlCount);

console.log(`Passed ${checks} offline car-photo client checks. No database or network writes were performed.`);
