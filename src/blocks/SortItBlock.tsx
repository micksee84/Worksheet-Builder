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
import { Picture } from './pictures';
import { createRandom, blockSeed } from '../utils/seededRandom';

interface SortTheme {
  groups: [{ label: string; picture: string; items: string[] }, { label: string; picture: string; items: string[] }];
}

const THEMES: Record<string, SortTheme> = {
  'sky-sea': {
    groups: [
      { label: 'sky', picture: 'cloud', items: ['bird', 'plane', 'kite', 'bee', 'butterfly'] },
      { label: 'sea', picture: 'waves', items: ['fish', 'whale', 'crab', 'boat'] },
    ],
  },
  'hot-cold': {
    groups: [
      { label: 'hot', picture: 'sun', items: ['fire', 'mug'] },
      { label: 'cold', picture: 'snowflake', items: ['snowman', 'icecream', 'mitten'] },
    ],
  },
  'day-night': {
    groups: [
      { label: 'day', picture: 'sun', items: ['butterfly', 'bee', 'bird', 'flower'] },
      { label: 'night', picture: 'moon', items: ['owl', 'star'] },
    ],
  },
};

export const SortItRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const theme = THEMES[s.theme] || THEMES['sky-sea'];
  const rand = createRandom(blockSeed(instance.instanceId, s));
  const maxItems = size === 'quarter' ? 4 : 8;
  const wanted = Math.min(maxItems, Math.max(2, Number(s.items) || 4));

  // Take pictures from both groups in turn so neither side is empty
  const a = rand.shuffle(theme.groups[0].items);
  const b = rand.shuffle(theme.groups[1].items);
  const picked: string[] = [];
  while (picked.length < wanted && (a.length || b.length)) {
    if (a.length) picked.push(a.shift() as string);
    if (picked.length < wanted && b.length) picked.push(b.shift() as string);
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
  const groupW = (usableW - groupGap) / 2;
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
            <Picture name={group.picture} cx={x + groupW / 2} cy={groupsTop + groupH * 0.46} size={headerPic} />
            <text
              x={x + groupW / 2}
              y={groupsTop + groupH * 0.46 + headerPic / 2 + 22}
              textAnchor="middle"
              fill="#2D2200"
              fontSize={size === 'quarter' ? 16 : 20}
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
      options: [
        { label: 'Sky or sea', value: 'sky-sea' },
        { label: 'Hot or cold', value: 'hot-cold' },
        { label: 'Day or night', value: 'day-night' },
      ],
    },
    { key: 'items', label: 'Number of pictures', type: 'number', min: 2, max: 8, step: 1, helperText: 'Quarter spaces show up to 4. Some themes have fewer pictures.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to shuffle the pictures.' },
  ],
  defaultSettings: { theme: 'sky-sea', items: 4, variant: 1 },
  render: (props) => <SortItRenderer {...props} />,
};
