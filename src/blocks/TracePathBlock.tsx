/**
 * @license
 * Sunshine Brigade Worksheet Builder - Trace the Path
 * Skill: pencil control and hand-eye coordination (pre-writing).
 * The child follows a dashed path from a picture to its goal (bee to flower, dog to bone).
 * Easier: one straight path. Core: waves. Stretch: zigzags and loops.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { Picture } from './pictures';
import { generateLinePath, LineStyle } from './LineTracingBlock';

const PAIRS: Record<string, [string, string]> = {
  'bee-flower': ['bee', 'flower'],
  'bird-nest': ['bird', 'nest'],
  'dog-bone': ['dog', 'bone'],
  'cat-house': ['cat', 'house'],
  'boat-fish': ['fish', 'boat'],
};
const PAIR_ORDER = Object.keys(PAIRS);
const MIXED_STYLES: LineStyle[] = ['straight', 'wave', 'zigzag', 'loops'];

export const TracePathRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const maxPaths = size === 'quarter' ? 3 : size === 'half' ? 3 : 5;
  const pathCount = Math.min(maxPaths, Math.max(1, Number(s.pathCount) || 2));
  const pathStyle: string = s.pathStyle || 'wave';
  const pairKey: string = s.pair || 'bee-flower';

  const paddingX = size === 'quarter' ? 18 : 30;
  const paddingY = size === 'quarter' ? 26 : 32;
  const top = paddingY + 10;
  const rowH = (height - top - paddingY + 10) / pathCount;
  const picSize = Math.min(rowH * 0.62, size === 'quarter' ? 44 : 64);

  const rows = Array.from({ length: pathCount }, (_, i) => {
    const y = top + rowH * (i + 0.5);
    const pair = pairKey === 'mixed' ? PAIRS[PAIR_ORDER[i % PAIR_ORDER.length]] : PAIRS[pairKey] || PAIRS['bee-flower'];
    const style: LineStyle = pathStyle === 'mixed' ? MIXED_STYLES[i % MIXED_STYLES.length] : (pathStyle as LineStyle);
    const startX = paddingX + picSize + 12;
    const endX = width - paddingX - picSize - 12;
    const amplitude = Math.min(rowH * 0.24, 22);
    return { i, y, pair, path: generateLinePath(style, startX, endX, y, amplitude), startX };
  });

  return (
    <g className="trace-path-block">
      <Instruction
        x={paddingX}
        y={paddingY - 6}
        cue="pencil"
        size={size}
        text={size === 'quarter' ? 'Help them get home.' : 'Start at the dot. Follow the dashes to help them get home.'}
      />
      {rows.map((row) => (
        <g key={row.i}>
          <Picture name={row.pair[0]} cx={paddingX + picSize / 2} cy={row.y} size={picSize} />
          <Picture name={row.pair[1]} cx={width - paddingX - picSize / 2} cy={row.y} size={picSize} />
          <path
            d={row.path}
            fill="none"
            stroke="#B6B2A6"
            strokeWidth="4"
            strokeDasharray="12,12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={row.startX} cy={row.y} r="5" fill="#2D2200" />
        </g>
      ))}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const TracePathBlockDefinition: BlockDefinition = {
  id: 'trace-path',
  displayName: 'Trace the path',
  description: 'Follow a dashed path from a picture to its goal, like a bee to its flower.',
  category: 'pre-writing',
  skillTags: ['pencil control', 'hand-eye coordination', 'fine motor'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'pathStyle',
      label: 'Path shape',
      type: 'select',
      options: [
        { label: 'Straight (easier)', value: 'straight' },
        { label: 'Waves', value: 'wave' },
        { label: 'Zigzag', value: 'zigzag' },
        { label: 'Loops (stretch)', value: 'loops' },
        { label: 'Mixed', value: 'mixed' },
      ],
    },
    {
      key: 'pathCount',
      label: 'Number of paths',
      type: 'number',
      min: 1,
      max: 5,
      step: 1,
      helperText: 'Quarter and half spaces show up to 3.',
    },
    {
      key: 'pair',
      label: 'Who goes where',
      type: 'select',
      options: [
        { label: 'Bee to flower', value: 'bee-flower' },
        { label: 'Bird to nest', value: 'bird-nest' },
        { label: 'Dog to bone', value: 'dog-bone' },
        { label: 'Cat to house', value: 'cat-house' },
        { label: 'Fish to boat', value: 'boat-fish' },
        { label: 'A different one each row', value: 'mixed' },
      ],
    },
  ],
  defaultSettings: { pathStyle: 'wave', pathCount: 2, pair: 'bee-flower' },
  render: (props) => <TracePathRenderer {...props} />,
};
