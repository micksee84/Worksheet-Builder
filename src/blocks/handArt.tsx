/**
 * @license
 * Sunshine Brigade Worksheet Builder - Hand-drawn art component (version 0.3)
 *
 * Draws one entry from HAND_ART in its own frame units (the caller places it with a
 * transform). Like the picture library, lines print as drawn, except that when they
 * would print thinner than the Ink Style minimum (1.5pt) every shape gets an even ink
 * stroke of the difference.
 */

import React from 'react';
import { HAND_ART } from './handArtData';

const INK = '#2D2200';
const PAPER = '#FFFFFF';

export const hasHandArt = (id: string) => id in HAND_ART;

interface HandArtProps {
  id: string;
  /** Thinnest line allowed, in the art's own units (1.5pt divided by the placement scale). */
  minLine: number;
  ink?: string;
  paper?: string;
}

export const HandArt: React.FC<HandArtProps> = ({ id, minLine, ink = INK, paper = PAPER }) => {
  const art = HAND_ART[id];
  if (!art) return null;
  const extra = Math.max(0, minLine - art.line);
  const stroke = extra > 0 ? { stroke: ink, strokeWidth: extra, strokeLinejoin: 'round' as const } : { stroke: 'none' };
  return (
    <g>
      <path d={art.p} fill={paper} fillRule="evenodd" {...stroke} />
      <path d={art.k} fill={ink} fillRule="evenodd" {...stroke} />
    </g>
  );
};

/** Places a drawing whose frame is a 100 x 100 box: centre (cx, cy), box side `size` page units. */
export const HandArtBox: React.FC<{ id: string; cx: number; cy: number; size: number; rotate?: number; ink?: string; paper?: string }> = ({
  id,
  cx,
  cy,
  size,
  rotate = 0,
  ink,
  paper,
}) => {
  const k = size / 100;
  const rot = rotate ? `rotate(${rotate} ${cx} ${cy}) ` : '';
  return (
    <g transform={`${rot}translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`}>
      <HandArt id={id} minLine={1.5 / k} ink={ink} paper={paper} />
    </g>
  );
};

/**
 * A crayon lying on its side, drawn from the three redrawn parts. The end cap and tip
 * keep their shape; a straight slice from the middle of the stretchy part (where its
 * lines are even) is stretched to fill the gap, with its ends tucked under the cap and
 * tip so the hand-drawn joins show, not stretched line ends.
 * Frame: body thickness 100, centred on y 0.
 */
const SLICE: [number, number] = [114, 140];
const TUCK = 6;

export const HandCrayon: React.FC<{ x: number; cy: number; length: number; thickness: number }> = ({ x, cy, length, thickness }) => {
  const cap = HAND_ART['compare-crayon.part1'];
  const tip = HAND_ART['compare-crayon.part3'];
  const left = cap.box[0];
  const natural = tip.box[2] - left;
  const capEnd = cap.box[2];
  const tipStart = tip.box[0];
  // Shortest it can go before the cap and tip would overlap
  const shortest = natural - (tipStart - capEnd) - TUCK;
  let k = thickness / 100;
  let want = length / k;
  if (want < shortest) {
    k = length / shortest;
    want = shortest;
  }
  const delta = want - natural; // how far the tip moves right
  const from = capEnd - TUCK;
  const to = tipStart + delta + TUCK;
  const sliceScale = (to - from) / (SLICE[1] - SLICE[0]);
  const minLine = 1.5 / k;
  const line = Math.max(cap.line, minLine);
  const clipId = 'sb-crayon-' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <g transform={`translate(${x - left * k} ${cy}) scale(${k})`}>
      <defs>
        <clipPath id={clipId}>
          <rect x={SLICE[0]} y={-80} width={SLICE[1] - SLICE[0]} height={160} />
        </clipPath>
      </defs>
      {/* White body behind the open outlines */}
      <rect x={left + line} y={-50 + line / 2} width={tipStart + delta - left} height={100 - line} fill="#FFFFFF" />
      <g transform={`translate(${from} 0) scale(${sliceScale} 1) translate(${-SLICE[0]} 0)`}>
        <g clipPath={`url(#${clipId})`}>
          <HandArt id="compare-crayon.part2" minLine={minLine} />
        </g>
      </g>
      <HandArt id="compare-crayon.part1" minLine={minLine} />
      <g transform={`translate(${delta} 0)`}>
        <HandArt id="compare-crayon.part3" minLine={minLine} />
      </g>
    </g>
  );
};
