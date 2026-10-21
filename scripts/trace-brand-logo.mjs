import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

// Trace the flat, upper signature of the supplied 1536 x 1024 brand board.
// The resulting transparent SVG paths preserve the supplied lettering and symbol.
if (!process.argv[2]) throw new Error('Pass the path to the Parakh Motors brand board');
const width = 992;
const height = 284;
const { data, info } = await sharp(process.argv[2])
  .extract({ left: 274, top: 74, width, height }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

function simplify(points, tolerance = 0.65) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points.at(-1);
  const dx = bx - ax, dy = by - ay;
  let farthest = tolerance * tolerance, split = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
    const distance = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
    if (distance > farthest) { farthest = distance; split = i; }
  }
  return split ? [...simplify(points.slice(0, split + 1), tolerance).slice(0, -1), ...simplify(points.slice(split), tolerance)] : [points[0], points.at(-1)];
}

function trace(select) {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * info.channels;
    mask[y * width + x] = Number(select(data[offset], data[offset + 1], data[offset + 2], x));
  }
  const edges = new Map();
  const point = (x, y) => y * (width + 1) + x;
  const add = (x, y, bx, by) => {
    const key = point(x, y);
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push(point(bx, by));
  };
  const filled = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (filled(x, y)) {
    if (!filled(x, y - 1)) add(x, y, x + 1, y);
    if (!filled(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!filled(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!filled(x - 1, y)) add(x, y + 1, x, y);
  }
  const paths = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    let current = start;
    const contour = [];
    do {
      contour.push([current % (width + 1), Math.floor(current / (width + 1))]);
      const next = edges.get(current);
      if (!next?.length) throw new Error('Unclosed logo contour');
      const destination = next.pop();
      if (!next.length) edges.delete(current);
      current = destination;
    } while (current !== start);
    const area = Math.abs(contour.reduce((sum, [x, y], i) => {
      const next = contour[(i + 1) % contour.length];
      return sum + x * next[1] - y * next[0];
    }, 0)) / 2;
    if (area < 3) continue;
    const halfway = Math.floor(contour.length / 2);
    const reduced = [...simplify(contour.slice(0, halfway + 1)).slice(0, -1), ...simplify([...contour.slice(halfway), contour[0]]).slice(0, -1)];
    paths.push('M' + reduced.map(p => p.join(' ')).join('L') + 'Z');
  }
  return paths.join('');
}

const maroon = (r, g, b) => r < 185 && g < 120 && b < 140 && r - g > 28;
const logo = {
  viewBox: `0 0 ${width} ${height}`,
  markViewBox: '-8 -24 334 334',
  mark: trace((r, g, b, x) => x < 325 && maroon(r, g, b)),
  wordmark: trace((r, g, b, x) => x >= 325 && maroon(r, g, b)),
  accent: trace((r, g, b, x) => x >= 325 && r < 225 && g > 100 && r - g > 15 && g - b > 18),
};
await writeFile(new URL('../src/lib/brand-logo.ts', import.meta.url),
  '/** Vector outlines traced from the supplied Parakh Motors brand signature. */\nexport const brandLogo = ' + JSON.stringify(logo, null, 2) + ' as const;\n');
console.log('Traced inspection symbol, wordmark, and secondary lettering into SVG paths.');
