/**
 * @license
 * Sunshine Brigade Worksheet Builder - Picture Library
 *
 * Artwork: hand-drawn by the Sunshine Brigade team ("Builder Icons" in Affinity) and
 * stored as vector shapes in pictureArt.ts. To change a picture, update it in Affinity
 * and re-export it under the same name; every block that uses it updates.
 *
 * Ink Style rules followed here:
 * - White fills with fat ink outlines, so children can colour every picture in.
 * - Only the page inks: Ink #2D2200 and Paper #FFFFFF (Trace #B6B2A6 for "shadow" mode).
 */

import React from 'react';
import { PICTURE_LINE, PICTURE_SHAPES } from './pictureArt';

const INK = '#2D2200';
const PAPER = '#FFFFFF';
const TRACE = '#B6B2A6';

/** Colours and stroke a drawing should use, in its own 100 x 100 units. */
interface ArtStyle {
  F: string; // fill (paper areas)
  S: string; // ink (outlines and solid details)
  W: number; // thinnest allowed line, in the drawing's 100-unit box
}

type Art = (c: ArtStyle) => React.ReactNode;

/**
 * Builds a drawing from its Affinity shapes. The drawn lines already have their own
 * weight (PICTURE_LINE); when the page needs a heavier line than that, every shape gets
 * an ink stroke of the difference, which thickens each line evenly on both sides
 * (paper shapes give up half the stroke inward, ink shapes gain half outward).
 */
function fromShapes(name: string): Art {
  const shapes = PICTURE_SHAPES[name];
  const own = PICTURE_LINE[name] ?? 2;
  return (c) => {
    const extra = Math.max(0, c.W - own);
    const stroke = extra > 0 ? { stroke: c.S, strokeWidth: extra, strokeLinejoin: 'round' as const } : { stroke: 'none' };
    return (
      <>
        {shapes.map(([role, d], i) => (
          <path key={i} d={d} fill={role === 'k' ? c.S : c.F} {...stroke} />
        ))}
      </>
    );
  };
}

export const PICTURE_ART: Record<string, Art> = Object.fromEntries(
  Object.keys(PICTURE_SHAPES).map((name) => [name, fromShapes(name)])
);

/** Name, label and first sound for each picture (used by the sound and rhyme blocks).
 *  An empty sound keeps a picture out of Beginning sounds (long vowels and blends confuse early phonics). */
export const PICTURES: Record<string, { label: string; sound: string }> = {
  apple: { label: 'apple', sound: 'a' },
  ball: { label: 'ball', sound: 'b' },
  bee: { label: 'bee', sound: 'b' },
  bird: { label: 'bird', sound: 'b' },
  boat: { label: 'boat', sound: 'b' },
  bone: { label: 'bone', sound: 'b' },
  bug: { label: 'bug', sound: 'b' },
  butterfly: { label: 'butterfly', sound: 'b' },
  cake: { label: 'cake', sound: 'c' },
  car: { label: 'car', sound: 'c' },
  cat: { label: 'cat', sound: 'c' },
  cloud: { label: 'cloud', sound: '' }, // "cl" blend
  crab: { label: 'crab', sound: '' }, // "cr" blend
  dish: { label: 'dish', sound: 'd' },
  dog: { label: 'dog', sound: 'd' },
  egg: { label: 'egg', sound: 'e' },
  fire: { label: 'fire', sound: 'f' },
  fish: { label: 'fish', sound: 'f' },
  flower: { label: 'flower', sound: '' }, // "fl" blend
  hat: { label: 'hat', sound: 'h' },
  heart: { label: 'heart', sound: 'h' },
  house: { label: 'house', sound: 'h' },
  icecream: { label: 'ice cream', sound: '' }, // long vowel: left out of beginning sounds
  kite: { label: 'kite', sound: 'k' },
  leaf: { label: 'leaf', sound: 'l' },
  log: { label: 'log', sound: 'l' },
  mitten: { label: 'mitten', sound: 'm' },
  moon: { label: 'moon', sound: 'm' },
  mug: { label: 'mug', sound: 'm' },
  nest: { label: 'nest', sound: 'n' },
  owl: { label: 'owl', sound: '' }, // vowel blend: left out of beginning sounds
  pig: { label: 'pig', sound: 'p' },
  plane: { label: 'plane', sound: '' }, // "pl" blend
  snake: { label: 'snake', sound: '' }, // "sn" blend
  snowflake: { label: 'snowflake', sound: '' }, // "sn" blend
  snowman: { label: 'snowman', sound: '' }, // "sn" blend
  spoon: { label: 'spoon', sound: '' }, // "sp" blend
  star: { label: 'star', sound: '' }, // "st" blend
  sun: { label: 'sun', sound: 's' },
  tree: { label: 'tree', sound: '' }, // "tr" blend
  van: { label: 'van', sound: 'v' },
  waves: { label: 'waves', sound: 'w' },
  web: { label: 'web', sound: 'w' },
  whale: { label: 'whale', sound: 'w' },
};

export type PictureName = keyof typeof PICTURES;
export const PICTURE_NAMES = Object.keys(PICTURES) as PictureName[];

interface PictureProps {
  name: string;
  /** Centre of the picture in the parent's units */
  cx: number;
  cy: number;
  /** Width and height of the square the picture fits in */
  size: number;
  /** "line": white fill to colour in. "shadow": solid Trace colour silhouette (cut and glue targets). */
  mode?: 'line' | 'shadow';
  /** Mirror left to right */
  flip?: boolean;
}

/** Thinnest line a picture may print with (the Ink Style minimum). */
const MIN_LINE_PT = 1.5;

/**
 * Draws one picture from the library. Lines print as drawn, except that at small sizes
 * they are thickened evenly so none drops below the 1.5pt Ink Style minimum (a heavier
 * target clogs the detailed drawings, like the nest and the dish).
 */
export const Picture: React.FC<PictureProps> = ({ name, cx, cy, size, mode = 'line', flip = false }) => {
  const art = PICTURE_ART[name];
  if (!art) return null;
  const scale = size / 100;
  const minLine = MIN_LINE_PT / scale;
  const style: ArtStyle =
    mode === 'shadow'
      ? { F: TRACE, S: TRACE, W: minLine }
      : { F: PAPER, S: INK, W: minLine };
  const flipTransform = flip ? ' translate(100 0) scale(-1 1)' : '';
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})${flipTransform}`}>
      {art(style)}
    </g>
  );
};
