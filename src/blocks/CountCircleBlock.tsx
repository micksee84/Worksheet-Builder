/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 5: Count and Circle
 * Features:
 * - N simple objects (1–10) rendered in clean black outlines for counting
 * - Three large circular numeral choices below for the child to circle the correct answer
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { KidShape, ShapeType } from './svgShapes';
import { CharacterCorner } from '../components/CharacterCorner';
import { createRandom, blockSeed } from '../utils/seededRandom';
import { Instruction } from '../components/Instruction';
import { blockSpacing, HALF_SPACE } from '../utils/spacing';

export const CountCircleRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const count = Math.min(10, Math.max(1, Number(instance.settings.count) || 4));
  const shape: ShapeType = instance.settings.shape || 'apples';

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;

  // Three numbers to choose from: the answer plus its neighbours, in a shuffled order
  // (seeded, so the preview and the print match). Never always in the middle.
  let choices: number[];
  if (count <= 2) choices = [1, 2, 3];
  else if (count >= 9) choices = [8, 9, 10];
  else choices = [count - 1, count, count + 1];
  choices = createRandom(blockSeed(instance.instanceId, instance.settings)).shuffle(choices);

  // Object display area
  const bottomChoicesHeight = size === 'quarter' ? 56 : 72;
  const objectsAreaHeight = sp.contentBottom - sp.contentTop - bottomChoicesHeight - HALF_SPACE;
  const usableWidth = width - paddingX * 2;

  // Grid layout for objects:
  const cols = count <= 3 ? count : count <= 6 ? 3 : 5;
  const rows = Math.ceil(count / cols);
  const cellW = usableWidth / cols;
  const cellH = objectsAreaHeight / rows;
  const itemSize = Math.min(size === 'quarter' ? 32 : 46, Math.min(cellW * 0.75, cellH * 0.75));

  const items = Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = paddingX + (col + 0.5) * cellW;
    const cy = sp.contentTop + (row + 0.5) * cellH;
    return { id: i, cx, cy };
  });

  // Choices row at bottom
  const choicesY = sp.contentBottom - bottomChoicesHeight / 2;
  const choiceRadius = size === 'quarter' ? 18 : 24;
  const choiceSpacing = usableWidth / (choices.length + 1);

  return (
    <g className="count-circle-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="finger" size={size} text={size === 'quarter' ? 'Count. Circle the number.' : 'Count them with your finger. Circle the number.'} />

      {/* Objects to count */}
      <g className="objects-grid">
        {items.map((item) => (
          <KidShape key={item.id} type={shape} cx={item.cx} cy={item.cy} size={itemSize} />
        ))}
      </g>

      {/* Divider line before choices */}
      <line
        x1={paddingX + 10}
        y1={sp.contentBottom - bottomChoicesHeight}
        x2={width - paddingX - 10}
        y2={sp.contentBottom - bottomChoicesHeight}
        stroke="#B6B2A6"
        strokeWidth="1.5"
        strokeDasharray="4,4"
      />

      {/* Choices to circle */}
      <g className="choices-row">
        {choices.map((numChoice, idx) => {
          const cx = paddingX + (idx + 1) * choiceSpacing;
          const cy = choicesY;

          return (
            <g key={idx} className="choice-target">
              {/* Target circle */}
              <circle
                cx={cx}
                cy={cy}
                r={choiceRadius}
                fill="#FFFFFF"
                stroke="#2D2200"
                strokeWidth="2.5"
              />
              {/* Numeral */}
              <text
                x={cx}
                y={cy + (size === 'quarter' ? 6 : 8)}
                textAnchor="middle"
                fill="#2D2200"
                fontSize={size === 'quarter' ? '20' : '26'}
                fontWeight="800"
                fontFamily="Nunito, sans-serif"
              >
                {numChoice}
              </text>
            </g>
          );
        })}
      </g>

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const CountCircleBlockDefinition: BlockDefinition = {
  id: 'count-circle',
  displayName: 'Count and circle',
  description: 'Count N simple objects and circle the matching numeral among three choices.',
  category: 'numbers',
  skillTags: ['counting', 'quantity recognition', 'number discrimination'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'count',
      label: 'How many to count (1 to 10)',
      type: 'number',
      min: 1,
      max: 10,
      step: 1,
      helperText: 'How many objects to display for the child to count.',
    },
    {
      key: 'shape',
      label: 'Things to count',
      type: 'select',
      options: [
        { label: 'Apples', value: 'apples' },
        { label: 'Stars', value: 'stars' },
        { label: 'Hearts', value: 'hearts' },
        { label: 'Balloons', value: 'balloons' },
        { label: 'Flowers', value: 'flowers' },
      ],
    },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to move the right answer.' },
  ],
  defaultSettings: {
    count: 4,
    shape: 'apples',
    variant: 1,
  },
  render: (props) => <CountCircleRenderer {...props} />,
};
