/**
 * @license
 * Sunshine Brigade Worksheet Builder - Instruction line with picture cue
 *
 * Every block starts with one short instruction for the grown-up, plus a small picture
 * cue (pencil, crayon, scissors...) so a child who can't read yet still knows what to do.
 * The cues are placeholder ink drawings in a 100 x 100 box, like the picture library.
 */

import React from 'react';

const INK = '#2D2200';
const PAPER = '#FFFFFF';

export type CueName = 'pencil' | 'crayon' | 'scissors' | 'glue' | 'eye' | 'finger' | 'talk' | 'circle' | 'line';

const CUE_ART: Record<CueName, (w: number) => React.ReactNode> = {
  // Trace or write
  pencil: (w) => (
    <g transform="rotate(-45 50 50)">
      <rect x="40" y="6" width="20" height="62" rx="3" fill={PAPER} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d="M40 68 L50 94 L60 68 Z" fill={PAPER} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d="M46 84 L50 94 L54 84 Z" fill={INK} />
      <path d="M40 18 L60 18" stroke={INK} strokeWidth={w} />
    </g>
  ),
  // Colour in
  crayon: (w) => (
    <g transform="rotate(-45 50 50)">
      <path d="M40 30 L50 6 L60 30 Z" fill={PAPER} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <rect x="38" y="30" width="24" height="62" rx="4" fill={PAPER} stroke={INK} strokeWidth={w} />
      <path d="M38 44 L62 44 M38 78 L62 78" stroke={INK} strokeWidth={w} />
    </g>
  ),
  // Cut
  scissors: (w) => (
    <g>
      <circle cx="24" cy="72" r="14" fill={PAPER} stroke={INK} strokeWidth={w} />
      <circle cx="24" cy="28" r="14" fill={PAPER} stroke={INK} strokeWidth={w} />
      <path d="M36 64 L92 22 M36 36 L92 78" stroke={INK} strokeWidth={w} strokeLinecap="round" />
    </g>
  ),
  // Glue
  glue: (w) => (
    <g>
      <path d="M44 6 L56 6 L58 22 L42 22 Z" fill={PAPER} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <rect x="26" y="22" width="48" height="70" rx="10" fill={PAPER} stroke={INK} strokeWidth={w} />
      <path d="M36 48 L64 48 M36 62 L56 62" stroke={INK} strokeWidth={w * 0.8} strokeLinecap="round" />
    </g>
  ),
  // Look carefully
  eye: (w) => (
    <g>
      <path d="M6 50 Q50 6 94 50 Q50 94 6 50 Z" fill={PAPER} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <circle cx="50" cy="50" r="16" fill={PAPER} stroke={INK} strokeWidth={w} />
      <circle cx="50" cy="50" r="8" fill={INK} />
    </g>
  ),
  // Count with your finger
  finger: (w) => (
    <g>
      <path
        d="M40 90 L40 50 L40 14 Q40 6 48 6 Q56 6 56 14 L56 44 Q66 40 72 48 Q82 46 84 56 L84 74 Q84 90 66 90 Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth={w}
        strokeLinejoin="round"
      />
      <path d="M56 44 L56 56 M72 48 L72 58" stroke={INK} strokeWidth={w * 0.8} strokeLinecap="round" />
    </g>
  ),
  // Say it out loud / talk about it
  talk: (w) => (
    <g>
      <path d="M14 18 L86 18 Q94 18 94 26 L94 62 Q94 70 86 70 L42 70 L22 88 L26 70 L14 70 Q6 70 6 62 L6 26 Q6 18 14 18 Z" fill={PAPER} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <circle cx="32" cy="44" r="5" fill={INK} />
      <circle cx="50" cy="44" r="5" fill={INK} />
      <circle cx="68" cy="44" r="5" fill={INK} />
    </g>
  ),
  // Circle the answer
  circle: (w) => (
    <g>
      <path d="M78 26 C66 8 22 10 12 40 C4 68 34 92 62 86 C86 80 94 52 84 34" fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" />
    </g>
  ),
  // Draw a line to match
  line: (w) => (
    <g>
      <circle cx="16" cy="30" r="10" fill={INK} />
      <circle cx="84" cy="70" r="10" fill={INK} />
      <path d="M26 34 Q50 50 74 66" fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeDasharray="10 8" />
    </g>
  ),
};

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
        {CUE_ART[cue](stroke)}
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
