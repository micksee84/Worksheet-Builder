/**
 * @license
 * Sunshine Brigade Worksheet Builder - Reusable Kid-Friendly Colouring Shapes
 * Crisp black line work (with white fill) perfect for 3-5 year olds to count and colour.
 */

import React from 'react';
import { HandArtBox } from './handArt';

/** Counting art slots (100-unit frame), awaiting their redraw. */
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
  // Awaiting redraw: template-grid placeholder
  <HandArtBox id={HAND_ID[type]} cx={cx} cy={cy} size={size} />
);
