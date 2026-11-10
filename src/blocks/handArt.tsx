/**
 * @license
 * Sunshine Brigade Worksheet Builder - Builder art awaiting redraw (version 0.4)
 *
 * The counting shapes, instruction cues, feelings faces, shape hunt shapes, tower block,
 * crayon and finish star are being redrawn on the Small (Spot) template. Until each one
 * arrives, it prints as the template-grid placeholder in the frame the art will use:
 *   count-*   KidShape at size 100, centre 50,50
 *   cue-*     the instruction cue's 100 x 100 box
 *   feeling-* Face at size 100, centre 50,50
 *   shape-*   shapePath at r 50, centre 50,50
 *   compare-block   one block, 0..100 square
 *   compare-crayon  a crayon of any length (HandCrayon)
 *   finish-star     Line tracing's finish star, its 13-unit box just right of (0, 0)
 * To bring a redraw in, add its traced shapes here under the same id.
 */

import React from 'react';
import { ArtPlaceholder, BoxPlaceholder } from './placeholder';

/** Every id that has a slot for builder art (all awaiting their redraw). */
const ART_IDS = new Set([
  'count-apple', 'count-balloon', 'count-circle', 'count-flower', 'count-heart', 'count-star',
  'cue-circle', 'cue-crayon', 'cue-eye', 'cue-finger', 'cue-glue', 'cue-line', 'cue-pencil', 'cue-scissors', 'cue-talk',
  'feeling-angry', 'feeling-calm', 'feeling-happy', 'feeling-sad', 'feeling-scared', 'feeling-surprised',
  'shape-circle', 'shape-heart', 'shape-square', 'shape-star', 'shape-triangle',
  'compare-block', 'finish-star',
]);

export const hasHandArt = (id: string) => ART_IDS.has(id);

/** "count-apple" → "apple", "compare-block" → "block" */
const labelFor = (id: string) => id.slice(id.indexOf('-') + 1);

interface HandArtProps {
  id: string;
  /** Thinnest line allowed, in the art's own units (1.5pt divided by the placement scale). */
  minLine: number;
  ink?: string;
  paper?: string;
}

export const HandArt: React.FC<HandArtProps> = ({ id, minLine }) => {
  if (id === 'finish-star') {
    // 13-unit box where the star sits, at the end of the line
    return (
      <g transform="translate(3.5 -6.5) scale(0.13)">
        <ArtPlaceholder line={0.75 / 0.13} />
      </g>
    );
  }
  return <ArtPlaceholder label={labelFor(id)} line={minLine / 2} />;
};

/** Places a drawing whose frame is a 100 x 100 box: centre (cx, cy), box side `size` page units. */
export const HandArtBox: React.FC<{ id: string; cx: number; cy: number; size: number; rotate?: number; ink?: string; paper?: string }> = ({
  id,
  cx,
  cy,
  size,
}) => {
  const k = size / 100;
  // Placeholders stay upright so their labels read
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`}>
      <HandArt id={id} minLine={1.5 / k} />
    </g>
  );
};

/** A crayon lying on its side: a placeholder box of its length and thickness. */
export const HandCrayon: React.FC<{ x: number; cy: number; length: number; thickness: number }> = ({ x, cy, length, thickness }) => (
  <BoxPlaceholder x={x} y={cy - thickness / 2} width={length} height={thickness} label="crayon" />
);
