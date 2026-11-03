/**
 * @license
 * Sunshine Brigade Worksheet Builder - Dotted trace line
 * Draws the dots from traceShapes.ts as real circles, so they print identically
 * on screen, in the browser print dialog and in the vector PDF.
 */

import React from 'react';
import { INK_STYLE } from '../config/appConfig';
import { TraceDot } from './traceShapes';

export const TraceDots: React.FC<{ dots: TraceDot[]; r: number }> = ({ dots, r }) => (
  <g className="trace-dots" fill={INK_STYLE.trace}>
    {dots.map((d, i) => (
      <circle key={i} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={r} />
    ))}
  </g>
);
