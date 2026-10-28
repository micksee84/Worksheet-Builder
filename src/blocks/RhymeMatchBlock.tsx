/**
 * @license
 * Sunshine Brigade Worksheet Builder - Rhyme Match
 * Skill: hearing rhyme (phonological awareness), the step before reading.
 * Two columns of pictures. The child says each name out loud and draws a line
 * between the two that rhyme (cat and hat).
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { createRandom, blockSeed } from '../utils/seededRandom';

export const RHYME_PAIRS: [string, string][] = [
  ['cat', 'hat'],
  ['bee', 'tree'],
  ['moon', 'spoon'],
  ['car', 'star'],
  ['dog', 'log'],
  ['bug', 'mug'],
  ['cake', 'snake'],
  ['fish', 'dish'],
];

export const RhymeMatchRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const maxPairs = size === 'full' ? 5 : 3;
  const pairCount = Math.min(maxPairs, Math.max(2, Number(s.pairs) || 3));
  const rand = createRandom(blockSeed(instance.instanceId, s));
  const pairs = rand.shuffle(RHYME_PAIRS).slice(0, pairCount);
  const left = pairs.map((p) => p[0]);
  let right = rand.shuffle(pairs.map((p) => p[1]));
  // Never leave a pair lined up straight across: that gives the answer away
  for (let tries = 0; tries < 5 && right.some((r, i) => pairs[i][1] === r); tries++) {
    right = rand.shuffle(right);
  }

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / pairCount;
  const picSize = Math.min(rowH * 0.72, size === 'quarter' ? 54 : 74);
  const leftX = paddingX + picSize / 2;
  const rightX = width - paddingX - picSize / 2;

  return (
    <g className="rhyme-match-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="line"
        size={size}
        text={size === 'quarter' ? 'Match the rhymes.' : 'Say the names. Draw a line between the ones that rhyme.'}
      />
      {left.map((name, i) => {
        const cy = top + rowH * (i + 0.5);
        return (
          <g key={`l-${name}`}>
            <Picture name={name} cx={leftX} cy={cy} size={picSize} />
            <circle cx={leftX + picSize / 2 + 12} cy={cy} r="5" fill="#2D2200" />
          </g>
        );
      })}
      {right.map((name, i) => {
        const cy = top + rowH * (i + 0.5);
        return (
          <g key={`r-${name}`}>
            <circle cx={rightX - picSize / 2 - 12} cy={cy} r="5" fill="#2D2200" />
            <Picture name={name} cx={rightX} cy={cy} size={picSize} />
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const RhymeMatchBlockDefinition: BlockDefinition = {
  id: 'rhyme-match',
  displayName: 'Rhyme match',
  description: 'Two columns of pictures. Draw a line between the ones that rhyme, like cat and hat.',
  category: 'letters',
  skillTags: ['rhyming', 'listening', 'phonological awareness'],
  ageRange: '4–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    { key: 'pairs', label: 'Number of pairs', type: 'number', min: 2, max: 5, step: 1, helperText: 'Quarter and half spaces show up to 3.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different rhymes.' },
  ],
  defaultSettings: { pairs: 3, variant: 1 },
  render: (props) => <RhymeMatchRenderer {...props} />,
};
