import assert from 'node:assert/strict';
import { defaultThemes } from '../src/lib/themes.ts';
import { createThemeTokens, colorContrast } from '../src/lib/theme-tokens.ts';

const light = {
  ...defaultThemes[0], id: 'test-light', background: '#f7f8f2', foreground: '#182420',
  card_bg: '#ffffff', primary: '#153e35', accent: '#d7edaf', border_color: '#dde3d8',
};
const palettes = [...defaultThemes, light,
  { ...light, id: 'test-low-contrast', foreground: '#efefef', primary: '#f5f5f5', accent: '#fff', card_bg: '#000' },
  { ...light, id: 'test-gray', background: '#757575', foreground: '#787878', card_bg: '#eee', primary: '#777', accent: '#888' },
  { ...light, id: 'test-hsl', background: 'hsl(210 30% 95%)', foreground: 'hsl(210 30% 15%)', card_bg: 'rgba(255,255,255,.7)' },
  { ...light, id: 'test-dark-accent', accent: '#05130d' },
];
let checks = 0;
for (const palette of palettes) {
  const { tokens, mode } = createThemeTokens(palette);
  for (const text of ['--pm-ink', '--pm-muted', '--pm-green']) {
    for (const surface of ['--pm-paper', '--pm-surface', '--pm-soft', '--pm-tint']) {
      assert.ok(colorContrast(tokens[text], tokens[surface]) >= 4.5, `${palette.id}: ${text} on ${surface}`);
      checks++;
    }
  }
  for (const [text, surface] of [
    ['--pm-button-text', '--pm-button-bg'], ['--pm-hover-text', '--pm-hover'],
    ['--pm-accent-text', '--pm-lime'], ['--pm-inverse-text', '--pm-inverse-bg'],
    ['--pm-inverse-muted', '--pm-inverse-bg'],
    ['--pm-inverse-accent', '--pm-inverse-bg'],
  ]) {
    assert.ok(colorContrast(tokens[text], tokens[surface]) >= 4.5, `${palette.id}: ${text} on ${surface}`);
    checks++;
  }
  for (const surface of ['--pm-paper', '--pm-surface', '--pm-soft', '--pm-tint']) {
    assert.ok(colorContrast(tokens['--pm-focus'], tokens[surface]) >= 3, `${palette.id}: focus on ${surface}`);
    checks++;
  }
  assert.equal(mode, palette === light || palette.id !== 'test-gray' && palette.id.startsWith('test-') ? 'light' : 'dark');
  checks++;
}
assert.equal(new Set(defaultThemes.map(theme => createThemeTokens(theme).tokens['--pm-paper'])).size, defaultThemes.length);
assert.equal(createThemeTokens(light).tokens['--pm-paper'], light.background);
console.log(`${checks + 2} theme checks passed across ${palettes.length} palettes.`);
