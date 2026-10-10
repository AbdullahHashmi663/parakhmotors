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

const colors = { evergreen: '#153e35', ivory: '#f7f8f2', lime: '#d7edaf' };
const pathElement = (d, attributes = '') => `<path d="${d}" ${attributes}/>`;

function crestMarkup(badge, car, simplified = false) {
  const strokes = `stroke="${car}" stroke-linecap="round" stroke-linejoin="round"`;
  return [
    pathElement(brandLogo.crest, `fill="${badge}"`),
    ...(!simplified ? [pathElement(brandLogo.inset, `${strokes} stroke-width="0.8" opacity="0.45"`)] : []),
    `<g ${strokes} stroke-width="${simplified ? 3.2 : 2}">`,
    pathElement(brandLogo.roof),
    pathElement(brandLogo.body),
    ...(!simplified ? [pathElement(brandLogo.windshield, 'stroke-width="1.25"'), pathElement(brandLogo.details, 'stroke-width="1.5"')] : []),
    '</g>',
    ...brandLogo.lights.map((d) => pathElement(d, `fill="${car}"`)),
    ...(!simplified ? [
      pathElement(brandLogo.grille, `${strokes} stroke-width="1.1"`),
      pathElement(brandLogo.horizon, `${strokes} stroke-width="1"`),
      pathElement(brandLogo.diamond, `fill="${car}"`),
    ] : []),
  ].join('\n');
}

function logoMarkup(badge, car, lettering) {
  return `${crestMarkup(badge, car)}
<g transform="translate(-6 0)" stroke="${lettering}" stroke-linecap="square" stroke-linejoin="miter">
${brandLogo.wordmark.map((d) => pathElement(d, 'stroke-width="2.3"')).join('\n')}
${brandLogo.descriptor.map((d) => pathElement(d, 'stroke-width="1.2"')).join('\n')}
${pathElement(brandLogo.rules, 'stroke-width="0.7"')}
</g>`;
}

function presentationSvg(background, badge, car, lettering) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="330" viewBox="0 0 320 110" fill="none" role="img" aria-labelledby="logo-title">
<title id="logo-title">Parakh Motors — original automotive crest</title>
<rect width="320" height="110" fill="${background}"/>
<g transform="translate(32 19)">${logoMarkup(badge, car, lettering)}</g>
</svg>\n`;
}

const primary = presentationSvg('#ffffff', colors.evergreen, colors.ivory, colors.evergreen);
const reversed = presentationSvg(colors.evergreen, colors.lime, colors.evergreen, colors.ivory);
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${brandLogo.markViewBox}" fill="none" role="img" aria-labelledby="mark-title">
<title id="mark-title">Parakh Motors car crest</title>
${crestMarkup(colors.evergreen, colors.ivory, true)}
</svg>\n`;

await writeFile(path.join(brandDirectory, 'parakh-logo.svg'), primary);
await writeFile(path.join(brandDirectory, 'logo-dark.svg'), reversed);
await writeFile(path.join(brandDirectory, 'mark.svg'), mark);

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 90 90" fill="none">
<rect width="90" height="90" fill="${colors.evergreen}"/>
<g transform="translate(9 9)">${crestMarkup(colors.lime, colors.evergreen, true)}</g>
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

const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="640" viewBox="0 0 800 320" fill="none">
<rect width="800" height="160" fill="#ffffff"/>
<rect y="160" width="800" height="160" fill="${colors.evergreen}"/>
<g transform="translate(144 8) scale(2)">${logoMarkup(colors.evergreen, colors.ivory, colors.evergreen)}</g>
<g transform="translate(144 168) scale(2)">${logoMarkup(colors.lime, colors.evergreen, colors.ivory)}</g>
</svg>`;
await sharp(Buffer.from(previewSvg)).png().toFile(path.join(previewDirectory, 'car-logo-preview.png'));
console.log('Generated Parakh Motors SVG signatures, car crest, Apple icon, and four-size favicon.');
