/**
 * @license
 * Sunshine Brigade Worksheet Builder - Trace shape engine
 *
 * Shared by Line tracing and Trace the path.
 *
 * Every shape is described as a chain of pieces (straight sides, sine humps, arches,
 * loops) joined at key points: corners, peaks and valleys. Dots are then placed along
 * each piece by arc length, so:
 *   - a dot always lands on every key point,
 *   - dots are evenly spaced within each piece (no odd short gap at the end),
 *   - spacing adapts to the size of the shape.
 *
 * Every shape fits the same band (`half` above and below the row's centre line), so
 * mixed rows match in height and sit evenly apart. A complexity level changes how many
 * bumps, points, steps or loops fit across the line.
 */

export type LineStyle = 'straight' | 'wave' | 'zigzag' | 'loops' | 'castle';

/** 0 = Gentle, 1 = Medium, 2 = Tricky. */
export type TraceLevel = 0 | 1 | 2;
export type TraceComplexity = 'gentle' | 'medium' | 'tricky' | 'ramp';

export const COMPLEXITY_OPTIONS = [
  { label: 'Gentle (fewer, wider bumps)', value: 'gentle' },
  { label: 'Medium', value: 'medium' },
  { label: 'Tricky (more, tighter bumps)', value: 'tricky' },
  { label: 'Gets harder down the page', value: 'ramp' },
];

/** The level for one row. "Gets harder" steps from Gentle on the first row to Tricky on the last. */
export function levelForRow(complexity: string | undefined, row: number, rowCount: number): TraceLevel {
  switch (complexity) {
    case 'gentle':
      return 0;
    case 'tricky':
      return 2;
    case 'ramp':
      return rowCount <= 1 ? 1 : (Math.round((row * 2) / (rowCount - 1)) as TraceLevel);
    default:
      return 1;
  }
}

/** Half the band height for a given row spacing. */
export function traceBandHalf(rowSpacing: number): number {
  return Math.max(8, Math.min(rowSpacing * 0.27, 26));
}

export interface TraceDot {
  x: number;
  y: number;
}

export interface TraceShape {
  dots: TraceDot[];
  /** Dot radius, scaled to the band. */
  r: number;
  /** Where the start dot and finish marker sit (loops and arches start on the band's bottom edge). */
  startY: number;
  endY: number;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

type Pt = [number, number];

interface Piece {
  at: (t: number) => Pt;
  /** Force an even number of gaps, so a dot also lands on the piece's midpoint (a peak). */
  even?: boolean;
}

const line = (a: Pt, b: Pt, even = false): Piece => ({
  at: (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
  even,
});

/** Half a sine wave from (x0, y) to (x1, y), bulging up (dir -1) or down (dir 1). */
const hump = (x0: number, x1: number, y: number, amp: number, dir: 1 | -1): Piece => ({
  at: (t) => [x0 + (x1 - x0) * t, y + dir * amp * Math.sin(Math.PI * t)],
  even: true,
});

const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt): Piece => ({
  at: (t) => {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  },
  even: true,
});

/**
 * One loop of a prolate cycloid: the classic joined "llll" pre-writing loop.
 * Runs bottom to bottom; `c` sets the forward travel, `b` the loop size (b > c makes a loop).
 */
const loop = (x0: number, y: number, c: number, b: number): Piece => ({
  at: (t) => {
    const s = Math.PI + t * Math.PI * 2;
    return [x0 + c * (s - Math.PI) - b * Math.sin(s), y - b * Math.cos(s)];
  },
});

function placeDots(pieces: Piece[], target: number): TraceDot[] {
  const dots: TraceDot[] = [];
  const SAMPLES = 96;
  for (const piece of pieces) {
    const pts: Pt[] = [];
    const cum: number[] = [0];
    for (let i = 0; i <= SAMPLES; i++) {
      pts.push(piece.at(i / SAMPLES));
      if (i > 0) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const L = cum[SAMPLES];
    if (L < 0.5) continue;
    let n = Math.max(1, Math.round(L / target));
    if (piece.even) n = Math.max(2, n % 2 === 0 ? n : n + (L / n > target ? 1 : -1));
    let j = 0;
    for (let k = 0; k < n; k++) {
      const want = (k * L) / n;
      while (j < SAMPLES - 1 && cum[j + 1] < want) j++;
      const span = cum[j + 1] - cum[j] || 1;
      const f = (want - cum[j]) / span;
      dots.push({
        x: pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f,
        y: pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f,
      });
    }
  }
  const last = pieces[pieces.length - 1]?.at(1);
  if (last) dots.push({ x: last[0], y: last[1] });
  return dots;
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

const pick = <T,>(level: TraceLevel, values: [T, T, T]) => values[level];

/** Build the dots for one trace row that fits inside y - half .. y + half. */
export function buildTraceShape(
  style: LineStyle,
  startX: number,
  endX: number,
  y: number,
  half: number,
  level: TraceLevel = 1
): TraceShape {
  const W = endX - startX;
  const target = Math.max(9, Math.min(6 + half * 0.4, 16));
  const r = half < 12 ? 2 : 2.5;
  const flat = (pieces: Piece[], gap = target): TraceShape => ({
    dots: placeDots(pieces, gap),
    r,
    startY: y,
    endY: y,
  });

  switch (style) {
    case 'wave': {
      const peaks = pick(level, [2, 3, 5]);
      const amp = half * pick(level, [0.75, 1, 1]);
      const humps = peaks * 2;
      const w = W / humps;
      const pieces: Piece[] = [];
      for (let i = 0; i < humps; i++) pieces.push(hump(startX + i * w, startX + (i + 1) * w, y, amp, i % 2 === 0 ? -1 : 1));
      return flat(pieces);
    }

    case 'zigzag': {
      // Centre, up to a point, down to a point ... back to centre.
      // Keep every level pointy: the pitch never gets much wider than the band is tall.
      const amp = half;
      const pitch0 = half * 2 * pick(level, [2.1, 1.5, 1.0]);
      const points = Math.max(pick(level, [4, 6, 9]), Math.round(W / pitch0));
      const pitch = W / points;
      const pieces: Piece[] = [];
      let x = startX;
      let cy = y;
      for (let i = 0; i < points; i++) {
        const ny = i % 2 === 0 ? y - amp : y + amp;
        const dx = i === 0 ? pitch / 2 : pitch;
        pieces.push(line([x, cy], [x + dx, ny], i > 0));
        x += dx;
        cy = ny;
      }
      pieces.push(line([x, cy], [endX, y]));
      return flat(pieces, target * 0.8);
    }

    case 'castle': {
      // Square steps centred on the line: up, along the top, down, along the bottom.
      const cycles = pick(level, [3, 5, 8]);
      const amp = half * pick(level, [0.75, 1, 1]);
      const lead = Math.min(W * 0.06, 24);
      const step = (W - lead * 2) / (cycles * 2);
      const pieces: Piece[] = [line([startX, y], [startX + lead, y])];
      let x = startX + lead;
      pieces.push(line([x, y], [x, y - amp]));
      for (let i = 0; i < cycles; i++) {
        pieces.push(line([x, y - amp], [x + step, y - amp]));
        x += step;
        pieces.push(line([x, y - amp], [x, y + amp], true));
        pieces.push(line([x, y + amp], [x + step, y + amp]));
        x += step;
        pieces.push(line([x, y + amp], [x, i === cycles - 1 ? y : y - amp], i < cycles - 1));
      }
      pieces.push(line([x, y], [endX, y]));
      return flat(pieces, target * 0.7);
    }

    case 'loops': {
      const base = y + half;
      if (level === 0) {
        // Gentle: rounded arches standing on the bottom of the band.
        const n = 4;
        const w = W / n;
        const ctrl = base - (half * 2 * 4) / 3;
        const pieces: Piece[] = [];
        for (let i = 0; i < n; i++) {
          const x0 = startX + i * w;
          pieces.push(cubic([x0, base], [x0 + w * 0.1, ctrl], [x0 + w * 0.9, ctrl], [x0 + w, base]));
        }
        return { dots: placeDots(pieces, target), r, startY: base, endY: base };
      }
      // Medium and Tricky: real joined loops. The loop size to travel ratio (b / c) sets
      // how round they are; Tricky packs in more, tighter loops.
      const b = half;
      const ratio = level === 1 ? 2.1 : 2.6;
      const n = Math.max(level === 1 ? 4 : 6, Math.round(W / ((Math.PI * 2 * b) / ratio)));
      const c = W / (Math.PI * 2 * n);
      const pieces: Piece[] = [];
      for (let i = 0; i < n; i++) pieces.push(loop(startX + i * c * Math.PI * 2, y, c, b));
      // Closer dots so the curl of each loop reads clearly.
      return { dots: placeDots(pieces, Math.max(5, half * 0.36)), r: Math.min(r, Math.max(1.6, half * 0.12)), startY: base, endY: base };
    }

    case 'straight':
    default:
      return flat([line([startX, y], [endX, y])]);
  }
}
