/**
 * @license
 * Sunshine Brigade Worksheet Builder - Builder art (version 0.5)
 *
 * The counting shapes, instruction cues, feelings faces, shape hunt shapes, tower block,
 * crayon and finish star, drawn from the Krea reference set (shapes in handArtShapes.ts).
 * Each drawing sits in a 100 x 100 box, centred on 50,50:
 *   count-*   KidShape at size 100, centre 50,50
 *   cue-*     the instruction cue's 100 x 100 box
 *   feeling-* Face at size 100, centre 50,50 (feelingFaces.ts)
 *   kid-*     a child's feelings face, same box (feelingFaces.ts)
 *   shape-*   shapePath at r 50, centre 50,50
 *   compare-block   one block, 0..100 square
 *   compare-crayon  a crayon of any length (HandCrayon stretches the plain middle)
 *   finish-star     Line tracing's finish star, its 13-unit box just right of (0, 0)
 * An id without a drawing prints as the template-grid placeholder.
 */

import React, { useId } from 'react';
import { ArtPlaceholder, BoxPlaceholder } from './placeholder';
import { HAND_LINE, HAND_SHAPES as BUILDER_SHAPES } from './handArtShapes';
import { FACE_SHAPES } from './feelingFaces';

/** Builder art plus the feelings faces (feeling-* emoji, kid-<child>-<feeling> children). */
const HAND_SHAPES = { ...BUILDER_SHAPES, ...FACE_SHAPES };

const INK = '#2D2200';
const PAPER = '#FFFFFF';

export const hasHandArt = (id: string) => id in HAND_SHAPES;

/** "count-apple" → "apple", "compare-block" → "block" */
const labelFor = (id: string) => id.slice(id.indexOf('-') + 1);

interface HandArtProps {
  id: string;
  /** Thinnest line allowed, in the art's own units (1.5pt divided by the placement scale). */
  minLine: number;
  ink?: string;
  paper?: string;
}

/** The drawing's two shapes; an ink stroke thickens every line when the page needs more weight. */
const Shapes: React.FC<{ id: string; minLine: number; ink: string; paper: string }> = ({ id, minLine, ink, paper }) => {
  const { p, k } = HAND_SHAPES[id];
  const extra = Math.max(0, minLine - HAND_LINE);
  const stroke = extra > 0 ? { stroke: ink, strokeWidth: extra, strokeLinejoin: 'round' as const } : { stroke: 'none' };
  return (
    <>
      <path d={p} fill={paper} fillRule="evenodd" {...stroke} />
      <path d={k} fill={ink} fillRule="evenodd" {...stroke} />
    </>
  );
};

export const HandArt: React.FC<HandArtProps> = ({ id, minLine, ink = INK, paper = PAPER }) => {
  if (id === 'finish-star') {
    // 13-unit box where the star sits, at the end of the line
    return (
      <g transform="translate(3.5 -6.5) scale(0.13)">
        {hasHandArt(id) ? <Shapes id={id} minLine={Math.max(minLine, 0.75) / 0.13} ink={ink} paper={paper} /> : <ArtPlaceholder line={0.75 / 0.13} />}
      </g>
    );
  }
  if (!hasHandArt(id)) return <ArtPlaceholder label={labelFor(id)} line={minLine / 2} />;
  return <Shapes id={id} minLine={minLine} ink={ink} paper={paper} />;
};

/** Places a drawing whose frame is a 100 x 100 box: centre (cx, cy), box side `size` page units. */
export const HandArtBox: React.FC<{ id: string; cx: number; cy: number; size: number; rotate?: number; ink?: string; paper?: string }> = ({
  id,
  cx,
  cy,
  size,
  rotate,
  ink,
  paper,
}) => {
  const k = size / 100;
  // Placeholders stay upright so their labels read
  const turn = rotate && hasHandArt(id) ? ` rotate(${rotate} 50 50)` : '';
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})${turn}`}>
      <HandArt id={id} minLine={1.5 / k} ink={ink} paper={paper} />
    </g>
  );
};

// The crayon drawing in its box: body from x 0.5 to 99.5, 18 units tall, centred on y 50.
const CRAYON_X0 = 0.5;
const CRAYON_X1 = 99.5;
const CRAYON_H = 18;
const MID0 = 45; // plain stretch of body, no bands
const MID1 = 55;

/**
 * A crayon lying on its side, `length` long and `thickness` thick, starting at x.
 * The end cap and tip keep their shape; only the plain middle of the body stretches,
 * so every crayon in a row has the same thickness however long it is.
 */
export const HandCrayon: React.FC<{ x: number; cy: number; length: number; thickness: number }> = ({ x, cy, length, thickness }) => {
  const uid = useId().replace(/:/g, '');
  if (!hasHandArt('compare-crayon')) {
    return <BoxPlaceholder x={x} y={cy - thickness / 2} width={length} height={thickness} label="crayon" />;
  }
  let k = thickness / CRAYON_H;
  const fixed = (MID0 - CRAYON_X0 + CRAYON_X1 - MID1) * k;
  if (length < fixed + 2 * k) {
    // Too short to stretch: the whole drawing, scaled to the length
    k = length / (CRAYON_X1 - CRAYON_X0);
    return (
      <g transform={`translate(${x - CRAYON_X0 * k} ${cy - 50 * k}) scale(${k})`}>
        <Shapes id="compare-crayon" minLine={1.5 / k} ink={INK} paper={PAPER} />
      </g>
    );
  }
  const sx = (length - fixed) / ((MID1 - MID0) * k); // extra horizontal stretch for the middle
  const art = <Shapes id="compare-crayon" minLine={1.5 / k} ink={INK} paper={PAPER} />;
  const top = cy - 50 * k;
  const o = 0.15; // overlap so the pieces meet without a seam
  return (
    <g>
      <defs>
        <clipPath id={`${uid}l`}><rect x={-10} y={0} width={MID0 + o + 10} height={100} /></clipPath>
        <clipPath id={`${uid}m`}><rect x={MID0} y={0} width={MID1 - MID0} height={100} /></clipPath>
        <clipPath id={`${uid}r`}><rect x={MID1 - o} y={0} width={60} height={100} /></clipPath>
      </defs>
      <g transform={`translate(${x - CRAYON_X0 * k} ${top}) scale(${k})`}>
        <g clipPath={`url(#${uid}l)`}>{art}</g>
      </g>
      <g transform={`translate(${x + (MID0 - CRAYON_X0) * k - MID0 * k * sx} ${top}) scale(${k * sx} ${k})`}>
        <g clipPath={`url(#${uid}m)`}>{art}</g>
      </g>
      <g transform={`translate(${x + length - CRAYON_X1 * k} ${top}) scale(${k})`}>
        <g clipPath={`url(#${uid}r)`}>{art}</g>
      </g>
    </g>
  );
};
