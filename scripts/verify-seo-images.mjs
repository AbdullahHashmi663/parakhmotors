import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImageResponse } from 'next/og.js';
import { defaultThemes } from '../src/lib/themes.ts';

// Exercise the real card component and Next image renderer without starting a server.
const source = await readFile('src/lib/seo-image.tsx', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replaceAll(/(['"])@\/lib\/([^'"]+)\1/g, (_match, _quote, name) =>
  JSON.stringify(pathToFileURL(path.resolve(`src/lib/${name}.ts`)).href));
await mkdir('.next', { recursive: true });
await mkdir('docs/screenshots', { recursive: true });
const temporary = path.resolve('.next/verify-seo-image.mjs');
await writeFile(temporary, compiled);
try {
  const { SeoImage, seoImageSize } = await import(pathToFileURL(temporary).href);
  const baseVehicle = JSON.parse(await readFile('src/data/db.json', 'utf8')).vehicles[0];
  const cases = [
    { theme: defaultThemes.find(t => t.id === 'palette-parakh-beige-maroon'), name: 'seo-beige-preview' },
    { theme: defaultThemes.find(t => t.id === 'parakh-rosso'), name: 'seo-dark-preview' },
    { theme: defaultThemes.find(t => t.id === 'palette-parakh-beige-maroon'), vehicle: { ...baseVehicle, title: 'Mercedes-Benz S-Class S 580 4MATIC Long Wheelbase', discountPrice: 45000000 }, name: 'seo-vehicle-preview' },
  ];
  for (const { name, ...props } of cases) {
    const element = createElement(SeoImage, props);
    const markup = renderToStaticMarkup(element);
    assert.ok(markup.includes('fill-rule="evenodd"'), 'Must embed the supplied vector logo');
    if (props.vehicle) assert.ok(markup.includes('4.50 Crore'), 'Must display discounted price');
    const response = new ImageResponse(element, seoImageSize);
    const png = Buffer.from(await response.arrayBuffer());
    const info = await sharp(png).metadata();
    assert.equal(info.width, 1200);
    assert.equal(info.height, 630);
    assert.equal(info.format, 'png');
    await writeFile(`docs/screenshots/${name}.png`, png);
  }
  console.log('Rendered and verified 3 SEO cards: light, dark, and a long vehicle title with discounted pricing.');
} finally {
  await unlink(temporary);
}
