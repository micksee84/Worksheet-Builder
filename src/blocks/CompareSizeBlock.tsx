/**
 * @license
 * Sunshine Brigade Worksheet Builder - Big and Small
 * Skill: comparing size, height and length (early measurement words).
 * Each row shows two or three of the same thing in different sizes. The child circles
 * the biggest, smallest, tallest or longest one, and learns the words along the way.
 * Easier: 2 things with a big difference. Stretch: 3 things that are closer in size.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { createRandom, blockSeed } from '../utils/seededRandom';

const PICTURE_POOL = ['apple', 'fish', 'ball', 'house', 'cat', 'star', 'heart', 'flower', 'pig', 'egg'];

const QUESTIONS: Record<string, { text: string; short: string }> = {
  biggest: { text: 'Circle the biggest one in each row.', short: 'Circle the biggest.' },
  smallest: { text: 'Circle the smallest one in each row.', short: 'Circle the smallest.' },
  tallest: { text: 'Circle the tallest tower in each row.', short: 'Circle the tallest.' },
  longest: { text: 'Circle the longest crayon in each row.', short: 'Circle the longest.' },
};

/** A tower of stacked blocks, standing on the baseline */
function Tower({ cx, baseY, blocks, unit }: { cx: number; baseY: number; blocks: number; unit: number }) {
  return (
    <g>
      {Array.from({ length: blocks }).map((_, i) => (
        <rect
          key={i}
          x={cx - unit / 2}
          y={baseY - unit * (i + 1)}
          width={unit}
          height={unit}
          rx="3"
          ry="3"
          fill="#FFFFFF"
          stroke="#2D2200"
          strokeWidth="2"
        />
      ))}
    </g>
  );
}

/** A crayon lying on its side, left-aligned so lengths are easy to compare */
function Crayon({ x, cy, length, thickness }: { x: number; cy: number; length: number; thickness: number }) {
  const tip = thickness * 1.1;
  const body = Math.max(thickness, length - tip);
  return (
    <g>
      <rect x={x} y={cy - thickness / 2} width={body} height={thickness} rx="4" ry="4" fill="#FFFFFF" stroke="#2D2200" strokeWidth="2" />
      <path d={`M ${x + body} ${cy - thickness / 2} L ${x + body + tip} ${cy} L ${x + body} ${cy + thickness / 2} Z`} fill="#FFFFFF" stroke="#2D2200" strokeWidth="2" strokeLinejoin="round" />
      <line x1={x + thickness * 0.8} y1={cy - thickness / 2} x2={x + thickness * 0.8} y2={cy + thickness / 2} stroke="#2D2200" strokeWidth="1.5" />
      <line x1={x + body - thickness * 0.8} y1={cy - thickness / 2} x2={x + body - thickness * 0.8} y2={cy + thickness / 2} stroke="#2D2200" strokeWidth="1.5" />
    </g>
  );
}

export const CompareSizeRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const question: string = QUESTIONS[s.question] ? s.question : 'biggest';
  const itemCount = Number(s.items) === 2 ? 2 : 3;
  const maxRows = size === 'full' ? 4 : 2;
  const rowCount = Math.min(maxRows, Math.max(1, Number(s.rows) || 2));
  const rand = createRandom(blockSeed(instance.instanceId, s));
  // Sizes as a share of the biggest. Two items: a clear difference. Three: closer together.
  const scales = itemCount === 2 ? [1, 0.5] : [1, 0.72, 0.46];

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / rowCount;
  const usableW = width - paddingX * 2;
  const colW = usableW / itemCount;
  const maxItem = Math.min(colW * 0.86, rowH * 0.84);

  const pictures = rand.shuffle(PICTURE_POOL);

  return (
    <g className="compare-size-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="circle"
        size={size}
        text={size === 'quarter' ? QUESTIONS[question].short : QUESTIONS[question].text}
      />
      {Array.from({ length: rowCount }).map((_, i) => {
        const rowTop = top + rowH * i;
        const cy = rowTop + rowH / 2;
        const order = rand.shuffle(scales);
        return (
          <g key={i}>
            {order.map((scale, j) => {
              const cx = paddingX + colW * (j + 0.5);
              if (question === 'tallest') {
                const unit = Math.min(colW * 0.4, (rowH * 0.84) / 5, 26);
                const blocks = Math.max(1, Math.round(scale * 5));
                return <Tower key={j} cx={cx} baseY={rowTop + rowH * 0.92} blocks={blocks} unit={unit} />;
              }
              if (question === 'longest') {
                // Crayons stack vertically within the row, all starting at the left edge
                const laneH = (rowH * 0.86) / itemCount;
                const thickness = Math.min(laneH * 0.55, 18);
                return (
                  <Crayon
                    key={j}
                    x={paddingX + 8}
                    cy={rowTop + rowH * 0.07 + laneH * (j + 0.5)}
                    length={(usableW - 16) * scale}
                    thickness={thickness}
                  />
                );
              }
              // Biggest or smallest: the same picture at each size, sitting on a shared baseline
              const sz = maxItem * scale;
              return <Picture key={j} name={pictures[i % pictures.length]} cx={cx} cy={rowTop + rowH * 0.94 - sz / 2} size={sz} />;
            })}
            {i < rowCount - 1 && (
              <line x1={paddingX} y1={rowTop + rowH} x2={width - paddingX} y2={rowTop + rowH} stroke="#B6B2A6" strokeWidth="1.5" />
            )}
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const CompareSizeBlockDefinition: BlockDefinition = {
  id: 'compare-size',
  displayName: 'Big and small',
  description: 'Compare things by size, height or length. Circle the biggest, smallest, tallest or longest.',
  category: 'numbers',
  skillTags: ['measurement', 'comparing', 'maths words'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'question',
      label: 'Find the',
      type: 'select',
      options: [
        { label: 'Biggest', value: 'biggest' },
        { label: 'Smallest', value: 'smallest' },
        { label: 'Tallest', value: 'tallest' },
        { label: 'Longest', value: 'longest' },
      ],
    },
    {
      key: 'items',
      label: 'Things in each row',
      type: 'select',
      options: [
        { label: '2 (easier)', value: 2 },
        { label: '3 (stretch)', value: 3 },
      ],
    },
    { key: 'rows', label: 'Number of rows', type: 'number', min: 1, max: 4, step: 1, helperText: 'Quarter and half spaces show up to 2.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures.' },
  ],
  defaultSettings: { question: 'biggest', items: 3, rows: 2, variant: 1 },
  render: (props) => <CompareSizeRenderer {...props} />,
};
