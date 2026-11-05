/**
 * @license
 * Sunshine Brigade Worksheet Builder - Bubble letters
 *
 * Draws a Sunshine Print letter or number as a fat "bubble" outline for a child to
 * trace inside, built from the same strokes as every other letter in the builder
 * (blocks/letterStrokes.ts). Nothing here is hand drawn: each stroke's centre line
 * becomes
 *   - the bubble: the stroke drawn thick in Ink, then a little thinner in Paper on top,
 *     so overlapping strokes (the top of A, the stick of a) merge into one outline,
 *   - a dashed guide down the middle, in the direction the pencil moves,
 *   - an arrowhead where the stroke ends,
 *   - a numbered circle where the stroke starts (1, 2, 3 in writing order).
 * When two strokes start at the same spot (A, B, E) the later number slides along its
 * own stroke until it is clear of the others, so circles never sit on top of each other.
 *
 * Positioning matches HandwrittenText: `x` is the letter's left edge (the stroke centre
 * line, not the outside of the bubble), `y` the top line, `h` top line to baseline.
 * Use bubblePad() to leave room for the outline around it.
 */

import React from 'react';
import { INK_STYLE } from '../config/appConfig';
import { strokeTracks } from '../blocks/letterStrokes';

type P = [number, number];

export type BubbleWeight = 'slim' | 'regular' | 'chunky';
export type BubbleHelpers = 'numbers' | 'arrows' | 'dots';

/** Bubble width as a share of the letter height. */
const WEIGHT: Record<BubbleWeight, number> = { slim: 0.15, regular: 0.2, chunky: 0.25 };

export interface BubbleOptions {
  weight?: BubbleWeight;
  /** Stroke numbers and arrows, arrows only, or just a start dot on each stroke. */
  helpers?: BubbleHelpers;
  /** Dashes and arrows in Ink, or a step lighter so the child's line stands out. */
  guide?: 'ink' | 'grey';
  /** Mark where each stroke starts (number or dot). Off on small practice letters. */
  startMarks?: boolean;
}

/** Shared sizes, so every bubble letter on a page is drawn the same way. */
export function bubbleSizes(h: number, weight: BubbleWeight = 'regular') {
  const W = h * WEIGHT[weight];
  const outline = Math.min(3, Math.max(INK_STYLE.minLineWidth, h * 0.012));
  return {
    W,
    outline,
    dashW: Math.max(INK_STYLE.minLineWidth, h * 0.011),
    dash: h * 0.035,
    gap: h * 0.028,
    arrow: Math.max(5, h * 0.05),
    numberR: Math.max(6, h * 0.034),
    startR: Math.max(3, h * 0.022),
  };
}

/** How far the outline reaches past the stroke centre lines, on every side. */
export function bubblePad(h: number, weight: BubbleWeight = 'regular'): number {
  const s = bubbleSizes(h, weight);
  return s.W / 2 + s.outline;
}

/** Numbers stay readable only on big letters; smaller ones fall back to arrows. */
export const MIN_NUMBERED_HEIGHT = 80;

interface Track {
  pts: P[];
  /** Running length at each point. */
  len: number[];
  total: number;
  dot: boolean;
}

function toTrack(pts: P[], dot: boolean): Track {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1], dot };
}

function pointAt(t: Track, s: number): P {
  if (s <= 0) return t.pts[0];
  if (s >= t.total) return t.pts[t.pts.length - 1];
  let i = 1;
  while (i < t.len.length - 1 && t.len[i] < s) i++;
  const k = (s - t.len[i - 1]) / (t.len[i] - t.len[i - 1] || 1);
  const a = t.pts[i - 1];
  const b = t.pts[i];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

function subPath(t: Track, a: number, b: number): string {
  if (b <= a) return '';
  const pts: P[] = [pointAt(t, a)];
  t.len.forEach((l, i) => {
    if (l > a && l < b) pts.push(t.pts[i]);
  });
  pts.push(pointAt(t, b));
  return pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
}

const fullPath = (t: Track) => subPath(t, 0, t.total);

export interface BubbleLetterProps extends BubbleOptions {
  ch: string;
  x: number;
  y: number;
  h: number;
}

export const BubbleLetter: React.FC<BubbleLetterProps> = ({ ch, x, y, h, weight = 'regular', helpers = 'numbers', guide = 'ink', startMarks = true }) => {
  const raw = strokeTracks(ch);
  if (!raw) return null;
  const map = ([u, v]: P): P => [x + u * h, y + v * h];
  const tracks = raw.map((s) => (s.kind === 'dot' ? toTrack([map(s.p)], true) : toTrack(s.pts.map(map), false)));

  const sz = bubbleSizes(h, weight);
  const ink = INK_STYLE.ink;
  const paper = INK_STYLE.paper;
  const guideColour = guide === 'ink' ? ink : INK_STYLE.traceDot;
  const showNumbers = startMarks && helpers === 'numbers' && h >= MIN_NUMBERED_HEIGHT;
  const showArrows = helpers !== 'dots';
  const r = sz.numberR;

  // Number circles: start of each stroke, slid along it if another circle or an arrow tip is in the way.
  const ends = tracks.map((t) => t.pts[t.pts.length - 1]);
  const placed: P[] = [];
  const starts = tracks.map((t, i) => {
    let s = 0;
    if (showNumbers && !t.dot) {
      const blockers = () => placed.concat(showArrows ? ends.filter((_, j) => j !== i && !tracks[j].dot) : []);
      const clash = (p: P) => blockers().some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < r * 2.4);
      while (clash(pointAt(t, s)) && s < t.total / 2) s += r * 0.4;
    }
    const p = pointAt(t, s);
    if (showNumbers) placed.push(p);
    return { s, p };
  });

  return (
    <g className="bubble-letter" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* The bubble: thick Ink under thinner Paper, so every stroke merges into one outline */}
      {tracks.map((t, i) =>
        t.dot ? (
          <circle key={`o${i}`} cx={t.pts[0][0]} cy={t.pts[0][1]} r={sz.W / 2 + sz.outline} fill={ink} stroke="none" />
        ) : (
          <path key={`o${i}`} d={fullPath(t)} stroke={ink} strokeWidth={sz.W + sz.outline * 2} />
        )
      )}
      {tracks.map((t, i) =>
        t.dot ? (
          <circle key={`f${i}`} cx={t.pts[0][0]} cy={t.pts[0][1]} r={sz.W / 2} fill={paper} stroke="none" />
        ) : (
          <path key={`f${i}`} d={fullPath(t)} stroke={paper} strokeWidth={sz.W} />
        )
      )}

      {/* Guides: dashes along the centre line, an arrow at the end */}
      {tracks.map((t, i) => {
        if (t.dot) return null;
        const from = starts[i].s + (showNumbers ? r * 1.35 : startMarks ? sz.startR * 2 : 0);
        const to = t.total - (showArrows ? sz.arrow * 0.85 : 0);
        const end = t.pts[t.pts.length - 1];
        const back = pointAt(t, t.total - sz.arrow);
        let vx = end[0] - back[0];
        let vy = end[1] - back[1];
        const n = Math.hypot(vx, vy) || 1;
        vx /= n;
        vy /= n;
        const bx = end[0] - vx * sz.arrow;
        const by = end[1] - vy * sz.arrow;
        const half = sz.arrow * 0.55;
        return (
          <g key={`g${i}`}>
            <path d={subPath(t, from, to)} stroke={guideColour} strokeWidth={sz.dashW} strokeDasharray={`${sz.dash.toFixed(2)} ${sz.gap.toFixed(2)}`} />
            {showArrows && (
              <path
                d={`M ${end[0].toFixed(2)} ${end[1].toFixed(2)} L ${(bx - vy * half).toFixed(2)} ${(by + vx * half).toFixed(2)} L ${(bx + vy * half).toFixed(2)} ${(by - vx * half).toFixed(2)} Z`}
                fill={guideColour}
                stroke="none"
              />
            )}
          </g>
        );
      })}

      {/* Where to start: numbered circles, or a plain start dot */}
      {startMarks && starts.map(({ p }, i) =>
        showNumbers ? (
          <g key={`n${i}`}>
            <circle cx={p[0]} cy={p[1]} r={r} fill={paper} stroke={ink} strokeWidth={INK_STYLE.minLineWidth} />
            <text
              x={p[0]}
              y={p[1] + r * 0.47}
              textAnchor="middle"
              fill={ink}
              fontSize={r * 1.35}
              fontWeight="800"
              fontFamily="Nunito, sans-serif"
            >
              {i + 1}
            </text>
          </g>
        ) : (
          <circle key={`n${i}`} cx={p[0]} cy={p[1]} r={sz.startR} fill={ink} stroke="none" />
        )
      )}
    </g>
  );
};
