import type { Theme } from '@/types';

type RGB = [number, number, number];
type ColorResolver = (value: string) => string;
const black: RGB = [0, 0, 0];
const white: RGB = [255, 255, 255];
const clamp = (value: number) => Math.min(255, Math.max(0, value));
const mix = (color: RGB, background: RGB, amount: number): RGB => color.map((channel, index) => clamp(channel * amount + background[index] * (1 - amount))) as RGB;
const hex = (color: RGB) => '#' + color.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('');
const rounded = (color: RGB) => color.map(Math.round) as RGB;

function parseColor(value: string, background: RGB, fallback: RGB): RGB {
  const input = value.trim().toLowerCase();
  const named: Record<string, RGB> = { black, white, red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], transparent: background };
  if (named[input]) return named[input];
  const match = input.match(/^#([a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i);
  if (match) {
    const value = match[1].length <= 4 ? [...match[1]].map(char => char + char).join('') : match[1];
    const color = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16)) as RGB;
    return value.length === 8 ? mix(color, background, parseInt(value.slice(6, 8), 16) / 255) : color;
  }
  const rgb = input.match(/^rgba?\((.+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3 || parts.some(part => !Number.isFinite(parseFloat(part)))) return fallback;
    const color = parts.slice(0, 3).map(part => clamp(parseFloat(part) * (part.endsWith('%') ? 2.55 : 1))) as RGB;
    const alpha = parts[3] === undefined ? 1 : Math.min(1, Math.max(0, parseFloat(parts[3]) / (parts[3].endsWith('%') ? 100 : 1)));
    return mix(color, background, alpha);
  }
  const hsl = input.match(/^hsla?\((.+)\)$/);
  if (hsl) {
    const parts = hsl[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3 || parts.some(part => !Number.isFinite(parseFloat(part)))) return fallback;
    const hue = ((parseFloat(parts[0]) % 360) + 360) % 360 / 360;
    const saturation = Math.min(1, Math.max(0, parseFloat(parts[1]) / 100));
    const lightness = Math.min(1, Math.max(0, parseFloat(parts[2]) / 100));
    const channel = (offset: number) => {
      const k = (offset + hue * 12) % 12;
      return 255 * (lightness - saturation * Math.min(lightness, 1 - lightness) * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    const color: RGB = [channel(0), channel(8), channel(4)];
    const alpha = parts[3] === undefined ? 1 : Math.min(1, Math.max(0, parseFloat(parts[3]) / (parts[3].endsWith('%') ? 100 : 1)));
    return mix(color, background, alpha);
  }
  return fallback;
}
function luminance(color: RGB): number {
  const linear = color.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}
function contrast(color: RGB, background: RGB): number {
  const a = luminance(color);
  const b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
function readable(preferred: RGB, backgrounds: RGB[], minimum = 4.5, fallback?: RGB): RGB {
  // Check the actual rounded CSS colors, not their intermediate float values.
  const score = (color: RGB) => Math.min(...backgrounds.map(background => contrast(rounded(color), rounded(background))));
  if (score(preferred) >= minimum) return preferred;
  const candidates = fallback ? [black, white, fallback] : [black, white];
  const target = candidates.reduce((best, color) => score(color) > score(best) ? color : best);
  for (let amount = .05; amount <= 1; amount += .05) {
    const adjusted = mix(target, preferred, amount);
    if (score(adjusted) >= minimum) return adjusted;
  }
  return target;
}

function readableSurface(surface: RGB, background: RGB, ink: RGB): RGB {
  for (let amount = 1; amount >= 0; amount -= .05) {
    const adjusted = mix(surface, background, amount);
    if (contrast(rounded(ink), rounded(adjusted)) >= 4.5) return adjusted;
  }
  return background;
}

/** Translate each saved palette into the roles used by the redesigned interface. */
export function createThemeTokens(theme: Theme, resolve: ColorResolver = value => value) {
  const background = parseColor(resolve(theme.background), white, [247, 248, 242]);
  const foreground = parseColor(resolve(theme.foreground), background, [24, 36, 32]);
  const primary = parseColor(resolve(theme.primary), background, [21, 62, 53]);
  const accent = parseColor(resolve(theme.accent), background, [215, 237, 175]);
  const dark = luminance(background) < .2;
  const ink = readable(foreground, [background]);
  // A custom card color must still support the shared text color of the page.
  const card = readableSurface(parseColor(resolve(theme.card_bg), background, background), background, ink);
  const soft = readableSurface(mix(foreground, background, dark ? .045 : .025), background, ink);
  const tint = readableSurface(mix(primary, background, dark ? .10 : .065), background, ink);
  const surfaces = [background, card, soft, tint];
  const muted = readable(mix(ink, background, .68), surfaces, 4.6, ink);
  const link = readable(primary, surfaces, 4.6, ink);
  const inverse = dark ? mix(background, black, .72) : luminance(primary) < .15 ? primary : mix(primary, black, .25);
  const inverseText = readable(foreground, [inverse], 4.6);
  const inverseMuted = readable(mix(inverseText, inverse, .72), [inverse], 4.6);
  const border = parseColor(resolve(theme.border_color), background, mix(ink, background, .2));
  const hover = mix(primary, dark ? white : black, .88);
  const tokens: Record<`--${string}`, string> = {
    '--pm-paper': hex(background), '--pm-surface': hex(card), '--pm-ink': hex(ink),
    '--pm-muted': hex(muted), '--pm-green': hex(link), '--pm-lime': hex(accent), '--pm-line': hex(border),
    '--pm-button-bg': hex(primary), '--pm-button-text': hex(readable(foreground, [primary], 4.6)),
    '--pm-tint': hex(tint), '--pm-soft': hex(soft), '--pm-hover': hex(hover),
    '--pm-inverse-bg': hex(inverse), '--pm-inverse-text': hex(inverseText), '--pm-inverse-muted': hex(inverseMuted),
    '--pm-inverse-accent': hex(readable(accent, [inverse], 4.6)),
    '--pm-inverse-line': hex(mix(inverseText, inverse, .18)), '--pm-accent-text': hex(readable(foreground, [accent], 4.6)),
    '--pm-focus': hex(readable(primary, surfaces, 3.1, ink)), '--pm-overlay-text': '#ffffff',
  };
  // Hover may need a different foreground from the resting primary action.
  tokens['--pm-hover-text'] = hex(readable(foreground, [hover], 4.6));
  return { tokens, mode: dark ? 'dark' : 'light' } as const;
}

export function colorContrast(foreground: string, background: string): number {
  const bg = parseColor(background, white, white);
  return contrast(parseColor(foreground, bg, black), bg);
}
