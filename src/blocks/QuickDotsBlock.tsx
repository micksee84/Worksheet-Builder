/**
 * @license
 * Sunshine Brigade Worksheet Builder - Quick Dots
 * Skill: subitizing, seeing "how many" at a glance without counting one by one.
 * Each row shows a card of dots and three numbers. The child looks, then circles the number.
 * Easier: 1 to 4 in dice patterns. Stretch: 1 to 6 scattered, so the pattern can't be memorised.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { createRandom, blockSeed, SeededRandom } from '../utils/seededRandom';

// Dot positions on a 0..1 card, like a dice face
const DICE: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
  6: [[0.3, 0.22], [0.7, 0.22], [0.3, 0.5], [0.7, 0.5], [0.3, 0.78], [0.7, 0.78]],
};

function scatteredDots(count: number, rand: SeededRandom): [number, number][] {
  const dots: [number, number][] = [];
  let attempts = 0;
  while (dots.length < count && attempts < 400) {
    attempts++;
    const p: [number, number] = [0.2 + rand.next() * 0.6, 0.2 + rand.next() * 0.6];
    if (dots.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) > 0.24)) dots.push(p);
  }
  return dots.length === count ? dots : DICE[count];
}

export const QuickDotsRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const max = s.range === '1-6' ? 6 : 4;
  const scatter = s.layout === 'scatter';
  const maxRows = size === 'full' ? 6 : 3;
  const rowCount = Math.min(maxRows, Math.max(1, Number(s.rows) || 3));
  const rand = createRandom(blockSeed(instance.instanceId, s));

  const numbers = Array.from({ length: max }, (_, i) => i + 1);
  let pool = rand.shuffle(numbers);
  const rows = Array.from({ length: rowCount }, () => {
    if (pool.length === 0) pool = rand.shuffle(numbers);
    const answer = pool.pop() as number;
    const others = rand.shuffle(numbers.filter((n) => n !== answer)).slice(0, 2);
    return {
      answer,
      dots: scatter ? scatteredDots(answer, rand) : DICE[answer],
      choices: rand.shuffle([answer, ...others]),
    };
  });

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / rowCount;
  const card = Math.min(rowH * 0.8, size === 'quarter' ? 64 : 84);
  const choiceR = Math.min(rowH * 0.3, size === 'quarter' ? 18 : 24);
  const choicesLeft = paddingX + card + (size === 'quarter' ? 16 : 40);
  const choiceStep = (width - paddingX - choicesLeft) / 3;

  return (
    <g className="quick-dots-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="eye"
        size={size}
        text={size === 'quarter' ? 'How many? Circle it.' : 'Look quickly. How many dots? Circle the number.'}
      />
      {rows.map((row, i) => {
        const cy = top + rowH * (i + 0.5);
        const cardX = paddingX;
        const cardY = cy - card / 2;
        return (
          <g key={i}>
            <rect x={cardX} y={cardY} width={card} height={card} rx="12" ry="12" fill="#FFFFFF" stroke="#2D2200" strokeWidth="2.25" />
            {row.dots.map(([dx, dy], j) => (
              <circle key={j} cx={cardX + dx * card} cy={cardY + dy * card} r={card * 0.085} fill="#2D2200" />
            ))}
            {row.choices.map((n, j) => {
              const cx = choicesLeft + choiceStep * (j + 0.5);
              return (
                <text
                  key={j}
                  x={cx}
                  y={cy + choiceR * 0.42}
                  textAnchor="middle"
                  fill="#2D2200"
                  fontSize={Math.max(20, choiceR * 1.2)}
                  fontWeight="800"
                  fontFamily="Nunito, sans-serif"
                >
                  {n}
                </text>
              );
            })}
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const QuickDotsBlockDefinition: BlockDefinition = {
  id: 'quick-dots',
  displayName: 'Quick dots',
  description: 'Dot cards to recognise at a glance. Circle how many, without counting each one.',
  category: 'numbers',
  skillTags: ['subitizing', 'number sense', 'counting'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'range',
      label: 'Numbers',
      type: 'select',
      options: [
        { label: '1 to 4 (easier)', value: '1-4' },
        { label: '1 to 6', value: '1-6' },
      ],
    },
    {
      key: 'layout',
      label: 'Dot pattern',
      type: 'select',
      options: [
        { label: 'Dice patterns (easier)', value: 'dice' },
        { label: 'Scattered (stretch)', value: 'scatter' },
      ],
    },
    { key: 'rows', label: 'Number of cards', type: 'number', min: 1, max: 6, step: 1, helperText: 'Quarter and half spaces show up to 3.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different numbers.' },
  ],
  defaultSettings: { range: '1-4', layout: 'dice', rows: 3, variant: 1 },
  render: (props) => <QuickDotsRenderer {...props} />,
};
