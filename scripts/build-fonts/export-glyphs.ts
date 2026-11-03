/**
 * Exports Sunshine Print (src/blocks/letterStrokes.ts) as JSON for build_fonts.py.
 * Coordinates are in line units: y 0 = top line, 1 = baseline, 1.35 = descender.
 */
import { writeFileSync } from 'fs';
import { LETTER_STROKES, placeLetter, SPACE_WIDTH } from '../../src/blocks/letterStrokes';

const DOT_GAP = 0.12; // same ratio the builder uses (handwritingSizes)
// Lay letters out 100 units tall (like on a page), then scale back to line units.
const S = 100;
const u = (n: number) => n / S;
const glyphs: Record<string, unknown> = {};
for (const [ch, g] of Object.entries(LETTER_STROKES)) {
  const p = placeLetter(ch, 0, 0, S, DOT_GAP * S)!;
  const polylines = p.paths.map((d) =>
    d
      .replace(/[ML]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((n) => u(Number(n)))
      .reduce<number[][]>((acc, n, i) => (i % 2 ? (acc[acc.length - 1].push(n), acc) : (acc.push([n]), acc)), [])
  );
  glyphs[ch] = {
    width: g.width,
    polylines,
    dots: p.dots.map(([x, y]) => [u(x), u(y)]),
    traceDots: p.traceDots.map((d) => [u(d.x), u(d.y)]),
    start: [u(p.start[0]), u(p.start[1])],
  };
}
writeFileSync(process.argv[2], JSON.stringify({ spaceWidth: SPACE_WIDTH, glyphs }));
