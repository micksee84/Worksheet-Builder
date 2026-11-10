/**
 * @license
 * Sunshine Brigade Worksheet Builder - Shadow Match
 * Skill: visual discrimination (seeing shape and outline), the no-scissors cousin of
 * Cut and glue. Pictures on the left, their shadows mixed up on the right: draw a line
 * from each picture to its shadow. Look-alike shadows never share a block, so every
 * picture has exactly one match.
 * Easier: 2 pairs. Stretch: 5.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { pickDistinct, picturesIn, themeSetting } from './pictureLibrary';
import { createRandom, blockSeed } from '../utils/seededRandom';

export const ShadowMatchRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const maxPairs = size === 'full' ? 5 : 3;
  const pairCount = Math.min(maxPairs, Math.max(2, Number(s.pairs) || 3));
  const rand = createRandom(blockSeed(instance.instanceId, s));
  const left = pickDistinct(rand, picturesIn(s.pictureTheme), pairCount);
  let right = rand.shuffle(left);
  // Never leave a shadow straight across from its picture: that gives the answer away
  for (let tries = 0; tries < 6 && right.some((r, i) => left[i] === r); tries++) right = rand.shuffle(left);
  if (right.some((r, i) => left[i] === r)) right = [...right.slice(1), right[0]];

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / left.length;
  const picSize = Math.min(rowH * 0.8, size === 'quarter' ? 56 : 80);
  const leftX = paddingX + picSize / 2;
  const rightX = width - paddingX - picSize / 2;

  return (
    <g className="shadow-match-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="line"
        size={size}
        text={size === 'quarter' ? 'Match each shadow.' : 'Draw a line from each picture to its shadow.'}
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
            <Picture name={name} cx={rightX} cy={cy} size={picSize} mode="shadow" />
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const ShadowMatchBlockDefinition: BlockDefinition = {
  id: 'shadow-match',
  displayName: 'Shadow match',
  description: 'Pictures on one side, their shadows mixed up on the other. Draw a line to match each one. No scissors needed.',
  category: 'thinking',
  skillTags: ['visual skills', 'matching', 'hand-eye coordination'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    themeSetting(),
    { key: 'pairs', label: 'Number of pairs', type: 'number', min: 2, max: 5, step: 1, helperText: 'Quarter and half spaces show up to 3.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures.' },
  ],
  defaultSettings: { pictureTheme: 'mixed', pairs: 3, variant: 1 },
  render: (props) => <ShadowMatchRenderer {...props} />,
};
