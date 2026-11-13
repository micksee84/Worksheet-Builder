/**
 * @license
 * Sunshine Brigade Worksheet Builder - Reusable Kid-Friendly Colouring Shapes
 * Crisp black line work (with white fill) perfect for 3-5 year olds to count and colour.
 */

import React from 'react';
import { HandArtBox } from './handArt';
import { Picture } from './pictures';
import { picturesIn, THEMES } from './pictureLibrary';
import { createRandom } from '../utils/seededRandom';

/** Counting art slots (100-unit frame), drawn from the Krea set. */
const HAND_ID: Record<string, string> = {
  stars: 'count-star',
  apples: 'count-apple',
  hearts: 'count-heart',
  circles: 'count-circle',
  balloons: 'count-balloon',
  flowers: 'count-flower',
};

export type ShapeType = 'stars' | 'apples' | 'hearts' | 'circles' | 'balloons' | 'flowers';

interface RenderShapeProps {
  type: ShapeType;
  cx: number;
  cy: number;
  size: number;
}

export const KidShape: React.FC<RenderShapeProps> = ({ type, cx, cy, size }) => (
  // Krea counting shapes (handArtShapes.ts)
  <HandArtBox id={HAND_ID[type]} cx={cx} cy={cy} size={size} />
);

/** Counting options for pictures from the library: "theme:farm" counts one farm picture */
export const COUNT_PICTURE_OPTIONS = THEMES.map((t) => ({ label: `A picture: ${t.label.toLowerCase()}`, value: `theme:${t.value}` }));

/**
 * Something to count: a counting shape, or (for "theme:<name>") one picture from that theme,
 * picked by the block's seed so it stays put until the settings change.
 */
export const CountThing: React.FC<{ thing: string; seed: string; cx: number; cy: number; size: number }> = ({ thing, seed, cx, cy, size }) => {
  if (thing.startsWith('theme:')) {
    // Small, countable things: no barns, buses or mountains
    const name = createRandom(seed).pick(picturesIn(thing.slice(6), (t) => t.z <= 4 && t.k !== 'farm'));
    return <Picture name={name} cx={cx} cy={cy} size={size} />;
  }
  return <KidShape type={thing as ShapeType} cx={cx} cy={cy} size={size} />;
};
