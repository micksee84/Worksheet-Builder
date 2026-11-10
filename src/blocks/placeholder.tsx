/**
 * @license
 * Sunshine Brigade Worksheet Builder - Art placeholder
 *
 * Stands in for any drawing that hasn't been redrawn on the Small (Spot) template yet.
 * It draws that template's grid in the light Trace colour, in the same 100 x 100 frame
 * as the finished art (1200 px artboard / 12):
 *   live area 8.33..91.67, circle keyline r 41.67, square 12.5..87.5,
 *   tall box x 16.67..83.33, wide box y 16.67..83.33, centre lines at 50,
 *   ground line on the bottom of the live area.
 * A small label names the missing drawing so it's easy to spot on a page.
 */

import React from 'react';

const GRID = '#B6B2A6';
const GROUND = '#8F8A7C';
const LABEL = '#6E6A5E';

const L = 100 / 12; // live-area margin (100 px)
const LO = 100 - L;

interface PlaceholderProps {
  /** Name shown in the middle (left off when the placeholder prints very small) */
  label?: string;
  /** Line weight in the frame's own units */
  line: number;
}

/** The template grid in a 100 x 100 frame. */
export const ArtPlaceholder: React.FC<PlaceholderProps> = ({ label, line }) => {
  const w = Math.max(0.6, line);
  const tiny = line > 2.4; // printed under about 30pt: just the outline, circle and cross
  const g = { fill: 'none', stroke: GRID, strokeWidth: w };
  return (
    <g className="art-placeholder">
      <rect x={L} y={L} width={LO - L} height={LO - L} fill="#FFFFFF" stroke={GRID} strokeWidth={w} />
      <circle cx={50} cy={50} r={50 - L} {...g} />
      <line x1={50} y1={L} x2={50} y2={LO} {...g} />
      <line x1={L} y1={50} x2={LO} y2={50} {...g} />
      {!tiny && (
        <>
          <rect x={12.5} y={12.5} width={75} height={75} {...g} />
          <rect x={200 / 12} y={L} width={800 / 12} height={LO - L} {...g} />
          <rect x={L} y={200 / 12} width={LO - L} height={800 / 12} {...g} />
        </>
      )}
      <line x1={L} y1={LO} x2={LO} y2={LO} stroke={GROUND} strokeWidth={w * 1.6} />
      {label && !tiny && (
        <text
          x={50}
          y={50 + 4}
          textAnchor="middle"
          fontFamily="Nunito, sans-serif"
          fontWeight={700}
          fontSize={label.length > 9 ? 9 : 11}
          fill={LABEL}
          stroke="#FFFFFF"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {label}
        </text>
      )}
    </g>
  );
};

/** A placeholder stretched to any box (for art that doesn't sit in a square, like the crayon). */
export const BoxPlaceholder: React.FC<{ x: number; y: number; width: number; height: number; label?: string }> = ({
  x,
  y,
  width,
  height,
  label,
}) => {
  const g = { fill: 'none', stroke: GRID, strokeWidth: 0.75 };
  return (
    <g className="art-placeholder">
      <rect x={x} y={y} width={width} height={height} {...g} fill="#FFFFFF" />
      <line x1={x} y1={y + height / 2} x2={x + width} y2={y + height / 2} {...g} />
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} {...g} />
      {label && height >= 12 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 3}
          textAnchor="middle"
          fontFamily="Nunito, sans-serif"
          fontWeight={700}
          fontSize={Math.min(9, height * 0.45)}
          fill={LABEL}
          stroke="#FFFFFF"
          strokeWidth={2.5}
          paintOrder="stroke"
        >
          {label}
        </text>
      )}
    </g>
  );
};
