/**
 * @license
 * Sunshine Brigade Worksheet Builder - What Comes Next
 * Skill: spotting and continuing patterns, an early algebra idea.
 * Each row shows a repeating pattern (star, heart, star, heart) with empty boxes at the end.
 * The child says the pattern out loud, then draws what comes next.
 * Easier: AB. Core: AAB or ABB. Stretch: ABC.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { KidShape, ShapeType } from './svgShapes';
import { Picture } from './pictures';
import { createRandom, blockSeed } from '../utils/seededRandom';

const PATTERNS: Record<string, number[]> = {
  AB: [0, 1],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
  ABC: [0, 1, 2],
};
const SHAPES: ShapeType[] = ['stars', 'hearts', 'circles', 'flowers', 'balloons', 'apples'];
const PICTURE_SET = ['sun', 'moon', 'fish', 'leaf', 'ball', 'heart', 'egg', 'kite'];

export const PatternNextRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const patternKey: string = s.pattern === 'mixed' ? 'mixed' : PATTERNS[s.pattern] ? s.pattern : 'AB';
  const usePictures = s.theme === 'pictures';
  const maxRows = size === 'full' ? 5 : 3;
  const rowCount = Math.min(maxRows, Math.max(1, Number(s.rows) || 3));
  const rand = createRandom(blockSeed(instance.instanceId, s));

  const shown = size === 'quarter' ? 4 : 6;
  const blanks = 2;
  const cells = shown + blanks;

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const key = patternKey === 'mixed' ? ['AB', 'AAB', 'ABB', 'ABC'][i % 4] : patternKey;
    const unit = PATTERNS[key];
    const items = rand.shuffle(usePictures ? PICTURE_SET : SHAPES).slice(0, 3);
    return { key, sequence: Array.from({ length: shown }, (_, j) => items[unit[j % unit.length]]) };
  });

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / rowCount;
  const cellW = (width - paddingX * 2) / cells;
  const itemSize = Math.min(cellW * 0.78, rowH * 0.6, 54);

  return (
    <g className="pattern-next-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="pencil"
        size={size}
        text={size === 'quarter' ? 'What comes next? Draw it.' : 'Say the pattern out loud. Draw what comes next.'}
      />
      {rows.map((row, i) => {
        const cy = top + rowH * (i + 0.5);
        return (
          <g key={i}>
            {row.sequence.map((item, j) => {
              const cx = paddingX + cellW * (j + 0.5);
              return usePictures ? (
                <Picture key={j} name={item} cx={cx} cy={cy} size={itemSize} />
              ) : (
                <KidShape key={j} type={item as ShapeType} cx={cx} cy={cy} size={itemSize * 0.9} />
              );
            })}
            {Array.from({ length: blanks }).map((_, b) => {
              const cx = paddingX + cellW * (shown + b + 0.5);
              const box = Math.min(cellW * 0.9, rowH * 0.78, 64);
              return (
                <rect
                  key={`blank-${b}`}
                  x={cx - box / 2}
                  y={cy - box / 2}
                  width={box}
                  height={box}
                  rx="12"
                  ry="12"
                  fill="#FFFFFF"
                  stroke="#B6B2A6"
                  strokeWidth="2"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                />
              );
            })}
            {i < rows.length - 1 && (
              <line x1={paddingX} y1={top + rowH * (i + 1)} x2={width - paddingX} y2={top + rowH * (i + 1)} stroke="#B6B2A6" strokeWidth="1.5" />
            )}
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const PatternNextBlockDefinition: BlockDefinition = {
  id: 'pattern-next',
  displayName: 'What comes next',
  description: 'A repeating pattern with empty boxes at the end. Draw what comes next.',
  category: 'numbers',
  skillTags: ['patterns', 'early algebra', 'reasoning'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      options: [
        { label: 'AB (easier)', value: 'AB' },
        { label: 'AAB', value: 'AAB' },
        { label: 'ABB', value: 'ABB' },
        { label: 'ABC (stretch)', value: 'ABC' },
        { label: 'A different one each row', value: 'mixed' },
      ],
    },
    {
      key: 'theme',
      label: 'Use',
      type: 'select',
      options: [
        { label: 'Shapes', value: 'shapes' },
        { label: 'Pictures', value: 'pictures' },
      ],
    },
    { key: 'rows', label: 'Number of rows', type: 'number', min: 1, max: 5, step: 1, helperText: 'Quarter and half spaces show up to 3.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different shapes.' },
  ],
  defaultSettings: { pattern: 'AB', theme: 'shapes', rows: 3, variant: 1 },
  render: (props) => <PatternNextRenderer {...props} />,
};
