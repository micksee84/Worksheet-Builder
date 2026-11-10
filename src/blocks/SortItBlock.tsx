/**
 * @license
 * Sunshine Brigade Worksheet Builder - Sort It Out
 * Skill: sorting and classifying, and talking about the world (science and reasoning).
 * Pictures across the top, two groups below (sky or sea, hot or cold, day or night).
 * The child draws a line from each picture to the group it belongs in.
 * Easier: 4 pictures. Stretch: 8.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture, hasPictureArt } from './pictures';
import { picturesIn } from './pictureLibrary';
import { createRandom, blockSeed } from '../utils/seededRandom';

interface SortGroup {
  label: string;
  /** Header pictures, first drawn one wins (placeholders are skipped) */
  picture: string[];
  items: string[];
}

interface SortTheme {
  label: string;
  groups: SortGroup[];
}

const LAND = picturesIn('mixed', (t, n) => t.m === 'land' && !['tractor'].includes(n));

const THEMES: Record<string, SortTheme> = {
  'sky-sea': {
    label: 'Sky or sea',
    groups: [
      { label: 'sky', picture: ['cloud'], items: ['bird', 'plane', 'kite', 'bee', 'butterfly', 'helicopter', 'jet', 'balloon', 'parrot', 'bat', 'owl', 'rocket'] },
      { label: 'sea', picture: ['waves'], items: ['fish', 'whale', 'crab', 'boat', 'dolphin', 'octopus', 'jellyfish', 'shark', 'starfish', 'turtle', 'seal', 'shell'] },
    ],
  },
  'land-sea-sky': {
    label: 'Land, sea or sky (3 groups)',
    groups: [
      { label: 'land', picture: ['mountain'], items: LAND },
      { label: 'sea', picture: ['waves'], items: picturesIn('mixed', (t) => t.m === 'water') },
      { label: 'sky', picture: ['cloud'], items: picturesIn('mixed', (t) => t.m === 'air') },
    ],
  },
  'farm-wild': {
    label: 'Farm or wild',
    groups: [
      { label: 'farm', picture: ['barn'], items: picturesIn('farm', (t) => t.k === 'animal').concat('tractor') },
      { label: 'wild', picture: ['lion'], items: picturesIn('wild', (t, n) => n !== 'lion' && n !== 'spider' && n !== 'snake') },
    ],
  },
  'fruit-veg': {
    label: 'Fruit or vegetable',
    groups: [
      { label: 'fruit', picture: ['apple'], items: picturesIn('food', (t, n) => t.k === 'fruit' && n !== 'apple') },
      { label: 'vegetable', picture: ['carrot'], items: picturesIn('food', (t, n) => t.k === 'veg' && n !== 'carrot') },
    ],
  },
  'eat-play': {
    label: 'Eat or play',
    groups: [
      { label: 'eat', picture: ['fork'], items: picturesIn('food') },
      { label: 'play', picture: ['ball'], items: picturesIn('toys', (t, n) => !['ball', 'tent', 'slide', 'swing', 'sandcastle', 'net'].includes(n)) },
    ],
  },
  'inside-outside': {
    label: 'Inside or outside',
    groups: [
      { label: 'inside', picture: ['house'], items: ['bed', 'bathtub', 'chair', 'lamp', 'table', 'clock', 'toothbrush', 'quilt', 'book'] },
      { label: 'outside', picture: ['tree'], items: ['swing', 'slide', 'tent', 'sandcastle', 'puddle', 'kite', 'rainbow', 'mountain', 'tractor'] },
    ],
  },
  'hot-cold': {
    label: 'Hot day or cold day',
    groups: [
      { label: 'hot day', picture: ['sun'], items: ['swimsuit', 'sunglasses', 'ice-cream', 'sandcastle', 'sand-pail', 'fan', 'fire'] },
      { label: 'cold day', picture: ['snowflake', 'polar-bear'], items: ['coat', 'boots', 'snowman', 'mitten', 'mug'] },
    ],
  },
  'day-night': {
    label: 'Day or night',
    groups: [
      { label: 'day', picture: ['sun'], items: ['butterfly', 'bee', 'bird', 'flower', 'sunflower', 'rainbow', 'sunglasses'] },
      { label: 'night', picture: ['moon'], items: ['owl', 'star', 'bat', 'bed', 'lamp'] },
    ],
  },
};

const headerOf = (g: SortGroup) => g.picture.find(hasPictureArt) ?? g.picture[0];

export const SortItRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const theme = THEMES[s.theme] || THEMES['sky-sea'];
  const rand = createRandom(blockSeed(instance.instanceId, s));
  const maxItems = size === 'quarter' ? 4 : 8;
  const wanted = Math.min(maxItems, Math.max(2, Number(s.items) || 4));

  // Take drawn pictures from each group in turn so no group is empty
  const headers = theme.groups.map(headerOf);
  const queues = theme.groups.map((g) => rand.shuffle(g.items.filter((n) => hasPictureArt(n) && !headers.includes(n))));
  const picked: string[] = [];
  while (picked.length < wanted && queues.some((q) => q.length)) {
    for (const q of queues) {
      while (q.length && picked.includes(q[0])) q.shift();
      if (q.length && picked.length < wanted) picked.push(q.shift() as string);
    }
  }
  const items = rand.shuffle(picked);

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const usableW = width - paddingX * 2;
  const usableH = sp.contentBottom - top;
  const perRow = items.length > 4 && size !== 'full' ? Math.ceil(items.length / 2) : items.length;
  const itemRows = Math.ceil(items.length / perRow);
  const itemsH = usableH * 0.5;
  const colW = usableW / perRow;
  const picSize = Math.min(colW * 0.7, itemsH / itemRows - 18, 72);

  const groupsTop = top + itemsH + 16;
  const groupH = top + usableH - groupsTop;
  const groupGap = 16;
  const groupCount = theme.groups.length;
  const groupW = (usableW - groupGap * (groupCount - 1)) / groupCount;
  const headerPic = Math.min(groupH * 0.45, 56);

  return (
    <g className="sort-it-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="line"
        size={size}
        text={size === 'quarter' ? 'Where does it go?' : 'Draw a line from each picture to where it belongs.'}
      />
      {items.map((name, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const cx = paddingX + colW * (col + 0.5);
        const cy = top + (itemsH / itemRows) * (row + 0.5) - 6;
        return (
          <g key={name}>
            <Picture name={name} cx={cx} cy={cy} size={picSize} />
            <circle cx={cx} cy={cy + picSize / 2 + 9} r="4.5" fill="#2D2200" />
          </g>
        );
      })}
      {theme.groups.map((group, g) => {
        const x = paddingX + g * (groupW + groupGap);
        return (
          <g key={group.label}>
            <rect x={x} y={groupsTop} width={groupW} height={groupH} rx="20" ry="20" fill="#FFFFFF" stroke="#2D2200" strokeWidth="2.25" />
            <circle cx={x + groupW / 2} cy={groupsTop} r="4.5" fill="#2D2200" />
            <Picture name={headerOf(group)} cx={x + groupW / 2} cy={groupsTop + groupH * 0.46} size={headerPic} />
            <text
              x={x + groupW / 2}
              y={groupsTop + groupH * 0.46 + headerPic / 2 + 22}
              textAnchor="middle"
              fill="#2D2200"
              fontSize={size === 'quarter' || groupCount > 2 ? 16 : 20}
              fontWeight="800"
              fontFamily="Nunito, sans-serif"
            >
              {group.label}
            </text>
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const SortItBlockDefinition: BlockDefinition = {
  id: 'sort-it',
  displayName: 'Sort it out',
  description: 'Sort pictures into two groups, like sky or sea, by drawing a line to where each belongs.',
  category: 'world',
  skillTags: ['sorting', 'science', 'reasoning'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'theme',
      label: 'Sort by',
      type: 'select',
      options: Object.entries(THEMES).map(([value, t]) => ({ label: t.label, value })),
    },
    { key: 'items', label: 'Number of pictures', type: 'number', min: 2, max: 8, step: 1, helperText: 'Quarter spaces show up to 4. Some themes have fewer pictures.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to shuffle the pictures.' },
  ],
  defaultSettings: { theme: 'sky-sea', items: 4, variant: 1 },
  render: (props) => <SortItRenderer {...props} />,
};
