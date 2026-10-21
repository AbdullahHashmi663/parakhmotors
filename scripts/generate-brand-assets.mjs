import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { brandLogo } from '../src/lib/brand-logo.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const brandDirectory = path.join(root, 'public', 'brand');
const previewDirectory = path.join(root, 'docs', 'screenshots');
await mkdir(brandDirectory, { recursive: true });
await mkdir(previewDirectory, { recursive: true });

const colors = { maroon: '#6B1F2A', beige: '#EADCC8', gold: '#AC8960' };
const pathElement = (d, attributes = '') => `<path d="${d}" ${attributes}/>`;

function markMarkup(color) {
  return pathElement(brandLogo.mark, `fill="${color}" fill-rule="evenodd"`);
}

function logoMarkup(primary, secondary) {
  return `${markMarkup(primary)}
${pathElement(brandLogo.wordmark, `fill="${primary}" fill-rule="evenodd"`)}
${pathElement(brandLogo.accent, `fill="${secondary}" fill-rule="evenodd"`)}`;
}

function presentationSvg(primary, secondary) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="992" height="284" viewBox="${brandLogo.viewBox}" fill="none" role="img" aria-labelledby="logo-title">
<title id="logo-title">Parakh Motors — Inspect, Buy, Sell</title>
${logoMarkup(primary, secondary)}
</svg>\n`;
}

const primary = presentationSvg(colors.maroon, colors.gold);
const reversed = presentationSvg(colors.beige, colors.beige);
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${brandLogo.markViewBox}" fill="none" role="img" aria-labelledby="mark-title">
<title id="mark-title">Parakh Motors inspection symbol</title>
${markMarkup(colors.maroon)}
</svg>\n`;

await writeFile(path.join(brandDirectory, 'parakh-logo.svg'), primary);
await writeFile(path.join(brandDirectory, 'logo-dark.svg'), reversed);
await writeFile(path.join(brandDirectory, 'mark.svg'), mark);

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 90 90" fill="none">
<rect width="90" height="90" rx="14" fill="${colors.beige}"/>
<svg x="9" y="9" width="72" height="72" viewBox="${brandLogo.markViewBox}">${markMarkup(colors.maroon)}</svg>
</svg>`;
await sharp(Buffer.from(appleSvg)).png().toFile(path.join(brandDirectory, 'apple-touch-icon.png'));

// Standard ICO directory with PNG payloads preserves crisp edges at each browser size.
const iconSizes = [16, 32, 48, 64];
const icons = await Promise.all(iconSizes.map((size) => sharp(Buffer.from(mark)).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + iconSizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(iconSizes.length, 4);
let offset = directory.length;
icons.forEach((png, index) => {
  const entry = 6 + index * 16;
  directory.writeUInt8(iconSizes[index], entry);
  directory.writeUInt8(iconSizes[index], entry + 1);
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(png.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(path.join(root, 'src', 'app', 'favicon.ico'), Buffer.concat([directory, ...icons]));

const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
<rect width="1200" height="380" fill="${colors.beige}"/>
<rect y="380" width="1200" height="380" fill="${colors.maroon}"/>
<g transform="translate(104 48)">${logoMarkup(colors.maroon, colors.gold)}</g>
<g transform="translate(104 428)">${logoMarkup(colors.beige, colors.beige)}</g>
</svg>`;
await sharp(Buffer.from(previewSvg)).png().toFile(path.join(previewDirectory, 'inspection-logo-preview.png'));
console.log('Generated Parakh Motors signatures, inspection symbol, Apple icon, and four-size favicon.');
