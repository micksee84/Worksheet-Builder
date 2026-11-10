/**
 * @license
 * Sunshine Brigade Worksheet Builder - Instruction line with picture cue
 *
 * Every block starts with one short instruction for the grown-up, plus a small picture
 * cue (pencil, crayon, scissors...) so a child who can't read yet still knows what to do.
 * The cues are hand-drawn (version 0.3) in a 100 x 100 box, like the picture library;
 * the older code drawings below stay as a fallback.
 */

import React from 'react';
import { HandArt } from '../blocks/handArt';

const INK = '#2D2200';
const PAPER = '#FFFFFF';

export type CueName = 'pencil' | 'crayon' | 'scissors' | 'glue' | 'eye' | 'finger' | 'talk' | 'circle' | 'line';


interface InstructionProps {
  x: number;
  /** Baseline of the instruction text */
  y: number;
  text: string;
  cue: CueName;
  size: 'full' | 'half' | 'quarter';
  /** Room available for icon and text. Long text (like a custom prompt) shrinks to fit, never under 10pt. */
  maxWidth?: number;
}

/** A small picture cue followed by one short instruction sentence. */
export const Instruction: React.FC<InstructionProps> = ({ x, y, text, cue, size, maxWidth }) => {
  const baseSize = size === 'quarter' ? 12 : 14;
  const iconSize = baseSize + 6;
  // Nunito Bold averages about 0.52em per character
  const fontSize = maxWidth
    ? Math.max(10, Math.min(baseSize, (maxWidth - iconSize - 6) / (text.length * 0.52)))
    : baseSize;
  const scale = iconSize / 100;
  const stroke = 1.5 / scale; // 1.5pt outline on the page
  return (
    <g className="block-instruction">
      <g transform={`translate(${x} ${y - baseSize + 1 - (iconSize - baseSize) / 2}) scale(${scale})`}>
        <HandArt id={'cue-' + cue} minLine={stroke} />
      </g>
      <text
        x={x + iconSize + 6}
        y={y}
        fill={INK}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="Nunito, sans-serif"
      >
        {text}
      </text>
    </g>
  );
};
