/**
 * @license
 * Sunshine Brigade Worksheet Builder - Sunshine Print handwriting model
 *
 * Our own print alphabet for children aged 3 to 5, drawn as the strokes a child makes
 * with a pencil, in the order they make them. The builder draws every tracing letter,
 * word and number from this file, and the Sunshine Print font files are generated from
 * it too (scripts/build-fonts), so the screen, the PDF and Affinity always match.
 *
 * Rules
 *   Lines     y = 0 top line, 0.5 dashed midline, 1 baseline, 1.35 descender line.
 *             Capitals, tall letters (b d f h k l) and numbers touch the top line.
 *   Strokes   One even line, round ends. Only four moves: pull down, slide across,
 *             circle (back or forward) and slant.
 *   Order     Top to bottom, left to right. Down strokes first, then across.
 *             Crossbars and dots come last.
 *   Circles   Pull back (counter-clockwise) from about one o'clock: C G O Q a c d g o q.
 *   Bowls     Lowercase bowls are the same circle as o (half the line height).
 *             Arches in h m n r share one radius and spring from the stick.
 *   Widths    Narrow: E F L I; regular: most capitals; wide: M W. Round capitals are
 *             gentle ovals, not full circles, so they sit with the others.
 *   Starts    The first point of the first stroke is the black start dot.
 *
 * Stroke order follows the common North American verbal paths, e.g.
 * "M: pull down, slant down, slant up, pull down", "J: pull down, curve around, across".
 */

import { arc, line, Piece, placeDots, TraceDot } from './traceShapes';

/** A straight line, an elliptical arc (degrees, 0 = right, 90 = top, counter-clockwise on the page), or a single dot. */
export type StrokeSeg =
  | ['L', number, number, number, number]
  | ['A', number, number, number, number, number, number]
  | ['D', number, number];

export interface LetterGlyph {
  width: number;
  strokes: StrokeSeg[][];
}

// Shorthands
const L = (x1: number, y1: number, x2: number, y2: number): StrokeSeg => ['L', x1, y1, x2, y2];
const A = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): StrokeSeg => ['A', cx, cy, rx, ry, a0, a1];
const D = (x: number, y: number): StrokeSeg => ['D', x, y];

// Shared shapes
const R = 0.25; // lowercase bowl radius (o)
const ARCH = 0.24; // arch radius for h m n r
const CAP_RX = 0.42; // round capitals: oval half-width
/** Lowercase "circle back" from about one o'clock, all the way round. */
const bowlBack = (cx = 0.25): StrokeSeg => A(cx, 0.75, R, R, 45, 405);
/** Arch over from the stick at x0 to x0 + 2r, then pull down to the baseline. */
const archDown = (x0: number, r = ARCH): StrokeSeg[] => [A(x0 + r, 0.5 + r, r, r, 180, 0), L(x0 + 2 * r, 0.5 + r, x0 + 2 * r, 1)];

export const LETTER_STROKES: Record<string, LetterGlyph> = {
  // ---------------------------------------------------------------- Capitals
  A: { width: 0.8, strokes: [[L(0.4, 0, 0, 1)], [L(0.4, 0, 0.8, 1)], [L(0.16, 0.64, 0.64, 0.64)]] },
  B: {
    width: 0.6,
    strokes: [
      [L(0, 0, 0, 1)],
      [L(0, 0, 0.3, 0), A(0.3, 0.25, 0.24, 0.25, 90, -90), L(0.3, 0.5, 0, 0.5)],
      [L(0, 0.5, 0.33, 0.5), A(0.33, 0.75, 0.27, 0.25, 90, -90), L(0.33, 1, 0, 1)],
    ],
  },
  C: { width: 0.84, strokes: [[A(CAP_RX, 0.5, CAP_RX, 0.5, 45, 315)]] },
  D: { width: 0.72, strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.22, 0), A(0.22, 0.5, 0.5, 0.5, 90, -90), L(0.22, 1, 0, 1)]] },
  E: { width: 0.58, strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.58, 0)], [L(0, 0.5, 0.48, 0.5)], [L(0, 1, 0.58, 1)]] },
  F: { width: 0.58, strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.58, 0)], [L(0, 0.5, 0.48, 0.5)]] },
  G: { width: 0.84, strokes: [[A(CAP_RX, 0.5, CAP_RX, 0.5, 45, 360), L(0.84, 0.5, 0.5, 0.5)]] },
  H: { width: 0.7, strokes: [[L(0, 0, 0, 1)], [L(0.7, 0, 0.7, 1)], [L(0, 0.5, 0.7, 0.5)]] },
  I: { width: 0.5, strokes: [[L(0.25, 0, 0.25, 1)], [L(0, 0, 0.5, 0)], [L(0, 1, 0.5, 1)]] },
  J: { width: 0.8, strokes: [[L(0.55, 0, 0.55, 0.72), A(0.3, 0.72, 0.25, 0.28, 0, -180)], [L(0.3, 0, 0.8, 0)]] },
  K: { width: 0.66, strokes: [[L(0, 0, 0, 1)], [L(0.62, 0, 0, 0.55), L(0, 0.55, 0.66, 1)]] },
  L: { width: 0.56, strokes: [[L(0, 0, 0, 1)], [L(0, 1, 0.56, 1)]] },
  M: { width: 0.9, strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.45, 1), L(0.45, 1, 0.9, 0), L(0.9, 0, 0.9, 1)]] },
  N: { width: 0.72, strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.72, 1), L(0.72, 1, 0.72, 0)]] },
  O: { width: 0.84, strokes: [[A(CAP_RX, 0.5, CAP_RX, 0.5, 60, 420)]] },
  P: { width: 0.6, strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.3, 0), A(0.3, 0.25, 0.3, 0.25, 90, -90), L(0.3, 0.5, 0, 0.5)]] },
  Q: { width: 0.9, strokes: [[A(CAP_RX, 0.5, CAP_RX, 0.5, 60, 420)], [L(0.52, 0.68, 0.9, 1.04)]] },
  R: {
    width: 0.66,
    strokes: [[L(0, 0, 0, 1)], [L(0, 0, 0.3, 0), A(0.3, 0.25, 0.3, 0.25, 90, -90), L(0.3, 0.5, 0.12, 0.5), L(0.12, 0.5, 0.66, 1)]],
  },
  S: { width: 0.62, strokes: [[A(0.31, 0.25, 0.29, 0.25, 30, 270), A(0.31, 0.75, 0.31, 0.25, 90, -150)]] },
  T: { width: 0.7, strokes: [[L(0.35, 0, 0.35, 1)], [L(0, 0, 0.7, 0)]] },
  U: { width: 0.72, strokes: [[L(0, 0, 0, 0.64), A(0.36, 0.64, 0.36, 0.36, 180, 360), L(0.72, 0.64, 0.72, 0)]] },
  V: { width: 0.8, strokes: [[L(0, 0, 0.4, 1), L(0.4, 1, 0.8, 0)]] },
  W: { width: 1.04, strokes: [[L(0, 0, 0.26, 1), L(0.26, 1, 0.52, 0), L(0.52, 0, 0.78, 1), L(0.78, 1, 1.04, 0)]] },
  X: { width: 0.72, strokes: [[L(0, 0, 0.72, 1)], [L(0.72, 0, 0, 1)]] },
  Y: { width: 0.76, strokes: [[L(0, 0, 0.38, 0.5)], [L(0.76, 0, 0.38, 0.5), L(0.38, 0.5, 0.38, 1)]] },
  Z: { width: 0.68, strokes: [[L(0, 0, 0.68, 0), L(0.68, 0, 0, 1), L(0, 1, 0.68, 1)]] },

  // ---------------------------------------------------------------- Lowercase
  a: { width: 0.5, strokes: [[bowlBack()], [L(0.5, 0.5, 0.5, 1)]] },
  b: { width: 0.5, strokes: [[L(0, 0, 0, 1)], [A(R, 0.75, R, R, 180, -180)]] },
  c: { width: 0.5, strokes: [[A(R, 0.75, R, R, 45, 315)]] },
  d: { width: 0.5, strokes: [[bowlBack()], [L(0.5, 0, 0.5, 1)]] },
  e: { width: 0.5, strokes: [[L(0, 0.75, 0.5, 0.75), A(R, 0.75, R, R, 0, 315)]] },
  f: { width: 0.44, strokes: [[A(0.4, 0.2, 0.2, 0.2, 30, 180), L(0.2, 0.2, 0.2, 1)], [L(0, 0.5, 0.42, 0.5)]] },
  g: { width: 0.5, strokes: [[bowlBack()], [L(0.5, 0.5, 0.5, 1.15), A(R, 1.15, R, 0.2, 0, -180)]] },
  h: { width: 2 * ARCH, strokes: [[L(0, 0, 0, 1)], archDown(0)] },
  i: { width: 0.08, strokes: [[L(0.04, 0.5, 0.04, 1)], [D(0.04, 0.25)]] },
  j: { width: 0.42, strokes: [[L(0.42, 0.5, 0.42, 1.15), A(0.22, 1.15, 0.2, 0.2, 0, -180)], [D(0.42, 0.25)]] },
  k: { width: 0.46, strokes: [[L(0, 0, 0, 1)], [L(0.44, 0.5, 0, 0.78), L(0, 0.78, 0.46, 1)]] },
  l: { width: 0.08, strokes: [[L(0.04, 0, 0.04, 1)]] },
  m: { width: 0.84, strokes: [[L(0, 0.5, 0, 1)], archDown(0, 0.21), archDown(0.42, 0.21)] },
  n: { width: 2 * ARCH, strokes: [[L(0, 0.5, 0, 1)], archDown(0)] },
  o: { width: 0.5, strokes: [[A(R, 0.75, R, R, 60, 420)]] },
  p: { width: 0.5, strokes: [[L(0, 0.5, 0, 1.35)], [A(R, 0.75, R, R, 180, -180)]] },
  q: { width: 0.5, strokes: [[bowlBack()], [L(0.5, 0.5, 0.5, 1.35)]] },
  r: { width: 0.44, strokes: [[L(0, 0.5, 0, 1)], [A(ARCH, 0.5 + ARCH, ARCH, ARCH, 180, 30)]] },
  s: { width: 0.42, strokes: [[A(0.21, 0.625, 0.19, 0.125, 30, 270), A(0.21, 0.875, 0.21, 0.125, 90, -150)]] },
  t: { width: 0.44, strokes: [[L(0.22, 0.18, 0.22, 1)], [L(0, 0.5, 0.44, 0.5)]] },
  u: { width: 2 * ARCH, strokes: [[L(0, 0.5, 0, 0.76), A(ARCH, 0.76, ARCH, ARCH, 180, 360)], [L(2 * ARCH, 0.5, 2 * ARCH, 1)]] },
  v: { width: 0.5, strokes: [[L(0, 0.5, 0.25, 1), L(0.25, 1, 0.5, 0.5)]] },
  w: { width: 0.76, strokes: [[L(0, 0.5, 0.19, 1), L(0.19, 1, 0.38, 0.5), L(0.38, 0.5, 0.57, 1), L(0.57, 1, 0.76, 0.5)]] },
  x: { width: 0.5, strokes: [[L(0, 0.5, 0.5, 1)], [L(0.5, 0.5, 0, 1)]] },
  y: { width: 0.54, strokes: [[L(0, 0.5, 0.27, 1)], [L(0.54, 0.5, 0.07, 1.35)]] },
  z: { width: 0.5, strokes: [[L(0, 0.5, 0.5, 0.5), L(0.5, 0.5, 0, 1), L(0, 1, 0.5, 1)]] },

  // ---------------------------------------------------------------- Numbers
  '0': { width: 0.6, strokes: [[A(0.3, 0.5, 0.3, 0.5, 60, 420)]] },
  '1': { width: 0.08, strokes: [[L(0.04, 0, 0.04, 1)]] },
  '2': { width: 0.6, strokes: [[A(0.3, 0.28, 0.28, 0.28, 160, -35), L(0.53, 0.44, 0, 1), L(0, 1, 0.6, 1)]] },
  '3': { width: 0.56, strokes: [[A(0.26, 0.25, 0.27, 0.25, 150, -90), A(0.26, 0.75, 0.3, 0.25, 90, -150)]] },
  '4': { width: 0.62, strokes: [[L(0, 0, 0, 0.62), L(0, 0.62, 0.62, 0.62)], [L(0.46, 0, 0.46, 1)]] },
  '5': { width: 0.6, strokes: [[L(0.04, 0, 0.04, 0.5), A(0.3, 0.7, 0.3, 0.3, 140, -150)], [L(0.04, 0, 0.58, 0)]] },
  '6': { width: 0.58, strokes: [[A(0.3, 0.72, 0.28, 0.72, 75, 180), A(0.3, 0.72, 0.28, 0.28, 180, 540)]] },
  '7': { width: 0.6, strokes: [[L(0, 0, 0.6, 0), L(0.6, 0, 0.18, 1)]] },
  '8': {
    width: 0.6,
    strokes: [[A(0.3, 0.25, 0.24, 0.25, 30, 270), A(0.3, 0.75, 0.3, 0.25, 90, -270), A(0.3, 0.25, 0.24, 0.25, 270, 390)]],
  },
  '9': { width: 0.58, strokes: [[A(0.29, 0.29, 0.29, 0.29, 30, 390)], [L(0.58, 0.29, 0.58, 1)]] },

  // ---------------------------------------------------------------- Punctuation
  '.': { width: 0.06, strokes: [[D(0.03, 1)]] },
  ',': { width: 0.1, strokes: [[L(0.08, 0.94, 0.02, 1.12)]] },
  '!': { width: 0.06, strokes: [[L(0.03, 0, 0.03, 0.68)], [D(0.03, 1)]] },
  '?': { width: 0.5, strokes: [[A(0.25, 0.22, 0.24, 0.22, 160, -90), L(0.25, 0.44, 0.25, 0.68)], [D(0.25, 1)]] },
  "'": { width: 0.06, strokes: [[L(0.03, 0, 0.03, 0.2)]] },
  '-': { width: 0.36, strokes: [[L(0, 0.68, 0.36, 0.68)]] },
};

/** Width of a word space, in line units. */
export const SPACE_WIDTH = 0.75;

export const DESCENDER_LETTERS = new Set(['g', 'j', 'p', 'q', 'y']);

// ---------------------------------------------------------------------------
// Placing a letter on the page
// ---------------------------------------------------------------------------

type P = [number, number];

function segPoint(seg: StrokeSeg, t: number): P {
  if (seg[0] === 'L') return [seg[1] + (seg[3] - seg[1]) * t, seg[2] + (seg[4] - seg[2]) * t];
  if (seg[0] === 'A') {
    const a = ((seg[5] + (seg[6] - seg[5]) * t) * Math.PI) / 180;
    return [seg[1] + seg[3] * Math.cos(a), seg[2] - seg[4] * Math.sin(a)];
  }
  return [seg[1], seg[2]];
}

export interface PlacedLetter {
  /** One SVG path per stroke, for the solid model letter. Single dots come back in `dots`. */
  paths: string[];
  dots: P[];
  /** Grey trace dots for every stroke. */
  traceDots: TraceDot[];
  /** Where the child starts: the beginning of the first stroke. */
  start: P;
}

/**
 * Place a letter with its left edge at x and the top line at y, `h` = top line to baseline.
 */
export function placeLetter(ch: string, x: number, y: number, h: number, dotGap: number): PlacedLetter | null {
  const glyph = LETTER_STROKES[ch];
  if (!glyph) return null;
  const map = ([u, v]: P): P => [x + u * h, y + v * h];

  const paths: string[] = [];
  const dots: P[] = [];
  const traceDots: TraceDot[] = [];

  for (const stroke of glyph.strokes) {
    if (stroke.length === 1 && stroke[0][0] === 'D') {
      const p = map([stroke[0][1], stroke[0][2]]);
      dots.push(p);
      traceDots.push({ x: p[0], y: p[1] });
      continue;
    }
    // Model path: fine polyline through each segment.
    let d = '';
    const pieces: Piece[] = [];
    stroke.forEach((seg) => {
      if (seg[0] === 'D') return;
      const steps = seg[0] === 'L' ? 1 : 32;
      for (let i = 0; i <= steps; i++) {
        const [px, py] = map(segPoint(seg, i / steps));
        d += `${d ? ' L' : 'M'} ${px.toFixed(2)} ${py.toFixed(2)}`;
      }
      if (seg[0] === 'L') {
        pieces.push(line(map([seg[1], seg[2]]), map([seg[3], seg[4]])));
      } else {
        const [, cx, cy, rx, ry, a0, a1] = seg;
        const c = map([cx, cy]);
        pieces.push(arc(c[0], c[1], rx * h, ry * h, a0, a1));
      }
    });
    paths.push(d);
    // Join pieces that flow smoothly into each other (a line running into a curve),
    // so dots only restart at real corners and stay evenly spaced along each run.
    traceDots.push(...placeDots(mergeSmoothRuns(pieces), dotGap));
  }

  // Where strokes meet or cross (the top of A, the crossbar of H, the stick of a),
  // two dots can land almost on top of each other. Keep the first one.
  const minApart = dotGap * 0.6;
  const kept: TraceDot[] = [];
  for (const dot of traceDots) {
    if (!kept.some((k) => Math.hypot(k.x - dot.x, k.y - dot.y) < minApart)) kept.push(dot);
  }
  traceDots.length = 0;
  traceDots.push(...kept);

  const first = glyph.strokes[0][0];
  const start = map(segPoint(first, 0));
  return { paths, dots, traceDots, start };
}

/** Tangent direction at the start (t = 0) or end (t = 1) of a piece. */
function tangent(piece: Piece, atEnd: boolean): number {
  const e = 0.002;
  const [x0, y0] = piece.at(atEnd ? 1 - e : 0);
  const [x1, y1] = piece.at(atEnd ? 1 : e);
  return Math.atan2(y1 - y0, x1 - x0);
}

function pieceLength(piece: Piece): number {
  let len = 0;
  let prev = piece.at(0);
  for (let i = 1; i <= 48; i++) {
    const p = piece.at(i / 48);
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return len;
}

/** Combine pieces into runs, breaking only at corners (direction changes over ~25 degrees). */
function mergeSmoothRuns(pieces: Piece[]): Piece[] {
  const runs: Piece[][] = [];
  for (const piece of pieces) {
    const run = runs[runs.length - 1];
    if (run) {
      let turn = Math.abs(tangent(piece, false) - tangent(run[run.length - 1], true));
      if (turn > Math.PI) turn = Math.PI * 2 - turn;
      if (turn < (25 * Math.PI) / 180) {
        run.push(piece);
        continue;
      }
    }
    runs.push([piece]);
  }
  return runs.map((run) => {
    if (run.length === 1) return run[0];
    const lens = run.map(pieceLength);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    return {
      at: (t: number) => {
        let want = t * total;
        for (let i = 0; i < run.length; i++) {
          if (want <= lens[i] || i === run.length - 1) return run[i].at(Math.min(1, want / (lens[i] || 1)));
          want -= lens[i];
        }
        return run[run.length - 1].at(1);
      },
    };
  });
}

/** Width of a run of letters in line units, with `gap` between letters. Spaces use SPACE_WIDTH. */
export function lettersWidth(text: string, gap: number): number {
  return layoutText(text, gap).width;
}

/** Left edge (in line units) of each drawable character, plus the total width. */
export function layoutText(text: string, gap: number): { items: { ch: string; x: number }[]; width: number } {
  const items: { ch: string; x: number }[] = [];
  let x = 0;
  let prevDrawn = false;
  for (const ch of text) {
    if (ch === ' ') {
      x += SPACE_WIDTH;
      prevDrawn = false;
      continue;
    }
    const g = LETTER_STROKES[ch];
    if (!g) continue;
    if (prevDrawn) x += gap;
    items.push({ ch, x });
    x += g.width;
    prevDrawn = true;
  }
  return { items, width: x };
}
