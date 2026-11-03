/**
 * @license
 * Sunshine Brigade Worksheet Builder - HandwrittenText
 * Draws text in Sunshine Print (blocks/letterStrokes.ts), either as a solid model to
 * copy or as grey dots to trace with a black start dot on each letter.
 *
 * Positioning matches HandwritingGuideLines: `y` is the top line and `h` the distance
 * from the top line to the baseline.
 */

import React from 'react';
import { INK_STYLE } from '../config/appConfig';
import { layoutText, placeLetter } from '../blocks/letterStrokes';

/** Gap between letters in a word, in line units. */
export const LETTER_GAP = 0.22;

export interface HandwrittenTextProps {
  text: string;
  /** Left edge, or centre when `align` is "middle". */
  x: number;
  /** Top line. */
  y: number;
  /** Top line to baseline. */
  h: number;
  variant: 'solid' | 'trace';
  align?: 'start' | 'middle';
  gap?: number;
  /** Show the black start dot on each traced letter (default true). */
  startDots?: boolean;
}

export function handwrittenWidth(text: string, h: number, gap = LETTER_GAP): number {
  return layoutText(text, gap).width * h;
}

/** Shared sizes, so every block draws Sunshine Print the same way. */
export function handwritingSizes(h: number) {
  return {
    dotGap: Math.max(4.5, h * 0.12),
    dotR: Math.max(1.5, h * 0.045),
    stroke: Math.max(2.5, h * 0.09),
    startR: Math.max(3, h * 0.075),
  };
}

export const HandwrittenText: React.FC<HandwrittenTextProps> = ({
  text,
  x,
  y,
  h,
  variant,
  align = 'start',
  gap = LETTER_GAP,
  startDots = true,
}) => {
  const { items, width } = layoutText(text, gap);
  const left = align === 'middle' ? x - (width * h) / 2 : x;
  const sz = handwritingSizes(h);

  return (
    <g className={`handwritten-text handwritten-${variant}`}>
      {items.map(({ ch, x: ux }, i) => {
        const p = placeLetter(ch, left + ux * h, y, h, sz.dotGap);
        if (!p) return null;
        if (variant === 'solid') {
          return (
            <g key={i} fill="none" stroke={INK_STYLE.ink} strokeWidth={sz.stroke} strokeLinecap="round" strokeLinejoin="round">
              {p.paths.map((d, k) => (
                <path key={k} d={d} />
              ))}
              {p.dots.map(([dx, dy], k) => (
                <circle key={`d${k}`} cx={dx} cy={dy} r={sz.stroke * 0.6} fill={INK_STYLE.ink} stroke="none" />
              ))}
            </g>
          );
        }
        return (
          <g key={i}>
            <g fill={INK_STYLE.traceDot}>
              {p.traceDots.map((d, k) => (
                <circle key={k} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={sz.dotR} />
              ))}
            </g>
            {startDots && <circle cx={p.start[0]} cy={p.start[1]} r={sz.startR} fill={INK_STYLE.ink} />}
          </g>
        );
      })}
    </g>
  );
};
