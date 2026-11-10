/**
 * @license
 * Sunshine Brigade Worksheet Builder - Odd One Out
 * Skill: classifying and reasoning out loud ("these are all fruit, but that's a car").
 * Each row shows four pictures: three that belong together and one that doesn't.
 * The child circles the odd one out, and a grown-up asks "why?".
 * Easier: groups that look nothing alike (fruit and a car). Tricky: close groups
 * (fruit and vegetables, farm and wild animals, things that fly and things that swim).
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { pickDistinct, picturesIn } from './pictureLibrary';
import { PictureTag } from './pictureTags';
import { createRandom, blockSeed } from '../utils/seededRandom';

type Filter = (t: PictureTag, name: string) => boolean;

/** Groups of things that belong together */
const GROUPS: Record<string, Filter> = {
  fruit: (t) => t.k === 'fruit',
  veg: (t) => t.k === 'veg',
  treats: (t) => t.k === 'food',
  farm: (t) => t.t === 'farm' && t.k === 'animal',
  wild: (t, n) => t.t === 'wild' && n !== 'spider' && n !== 'snake',
  sea: (t) => t.t === 'ocean' && t.k === 'animal',
  flies: (t) => t.m === 'air' && t.k === 'animal',
  vehicles: (t) => t.k === 'vehicle',
  clothes: (t) => t.k === 'clothes',
  toys: (t) => t.k === 'toy',
  home: (t) => t.k === 'home',
};

/** Groups far enough apart to be obvious */
const EASY: [string, string][] = [
  ['fruit', 'vehicles'], ['vehicles', 'fruit'], ['farm', 'clothes'], ['clothes', 'farm'], ['sea', 'toys'], ['toys', 'sea'],
  ['home', 'wild'], ['wild', 'home'], ['veg', 'vehicles'], ['treats', 'clothes'], ['flies', 'home'], ['clothes', 'veg'],
];
/** Close groups: the child has to think about what the three share */
const TRICKY: [string, string][] = [
  ['fruit', 'veg'], ['veg', 'fruit'], ['farm', 'wild'], ['wild', 'farm'], ['sea', 'flies'], ['flies', 'sea'],
  ['sea', 'farm'], ['treats', 'veg'], ['toys', 'home'], ['home', 'clothes'], ['clothes', 'toys'], ['wild', 'sea'],
];

export const OddOneOutRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const maxRows = size === 'full' ? 4 : 2;
  const rowCount = Math.min(maxRows, Math.max(1, Number(s.rows) || 2));
  const rand = createRandom(blockSeed(instance.instanceId, s));
  const pairs = rand.shuffle(s.level === 'tricky' ? TRICKY : EASY);

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const [same, odd] = pairs[i % pairs.length];
    const three = pickDistinct(rand, picturesIn('mixed', GROUPS[same]), 3);
    const [stranger] = pickDistinct(rand, picturesIn('mixed', (t, n) => GROUPS[odd](t, n) && !GROUPS[same](t, n)), 1, three);
    return rand.shuffle([...three, stranger].filter(Boolean));
  });

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / rowCount;
  const colW = (width - paddingX * 2) / 4;
  const picSize = Math.min(colW * 0.78, rowH * 0.82, 96);

  return (
    <g className="odd-one-out-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="circle"
        size={size}
        text={size === 'quarter' ? "Circle the odd one out." : "Circle the one that doesn't belong. Can you say why?"}
      />
      {rows.map((row, i) => {
        const cy = top + rowH * (i + 0.5);
        return (
          <g key={i}>
            {row.map((name, j) => (
              <Picture key={name} name={name} cx={paddingX + colW * (j + 0.5)} cy={cy} size={picSize} />
            ))}
            {i < rowCount - 1 && (
              <line x1={paddingX} y1={top + rowH * (i + 1)} x2={width - paddingX} y2={top + rowH * (i + 1)} stroke="#B6B2A6" strokeWidth="1.5" />
            )}
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const OddOneOutBlockDefinition: BlockDefinition = {
  id: 'odd-one-out',
  displayName: 'Odd one out',
  description: "Four pictures in a row: three belong together and one doesn't. Circle it, then say why.",
  category: 'thinking',
  skillTags: ['sorting', 'reasoning', 'talking'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'level',
      label: 'How tricky',
      type: 'select',
      options: [
        { label: 'Easy (looks different)', value: 'easy' },
        { label: 'Tricky (think about it)', value: 'tricky' },
      ],
    },
    { key: 'rows', label: 'Number of rows', type: 'number', min: 1, max: 4, step: 1, helperText: 'Quarter and half spaces show up to 2.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures.' },
  ],
  defaultSettings: { level: 'easy', rows: 2, variant: 1 },
  render: (props) => <OddOneOutRenderer {...props} />,
};
