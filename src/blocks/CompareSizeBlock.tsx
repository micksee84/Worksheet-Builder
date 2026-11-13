/**
 * @license
 * Sunshine Brigade Worksheet Builder - Big and Small
 * Skill: comparing size, height and length (early measurement words).
 * Each row shows two or three of the same thing in different sizes. The child circles
 * the biggest, smallest, tallest or longest one, and learns the words along the way.
 * Easier: 2 things with a big difference. Stretch: 3 things that are closer in size.
 */

import React from 'react';
import { HandArt, HandCrayon } from './handArt';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { pickDistinct, picturesIn, themeSetting } from './pictureLibrary';
import { createRandom, blockSeed } from '../utils/seededRandom';


const NO_SIZE = ['sun', 'moon', 'star', 'cloud', 'rain-cloud', 'rainbow', 'waves', 'puddle', 'fire', 'web', 'bubbles'];

const QUESTIONS: Record<string, { text: string; short: string }> = {
  biggest: { text: 'Circle the biggest one in each row.', short: 'Circle the biggest.' },
  smallest: { text: 'Circle the smallest one in each row.', short: 'Circle the smallest.' },
  tallest: { text: 'Circle the tallest tower in each row.', short: 'Circle the tallest.' },
  longest: { text: 'Circle the longest crayon in each row.', short: 'Circle the longest.' },
  'real-biggest': { text: 'Which is biggest in real life? Circle it.', short: 'Biggest in real life?' },
  'real-smallest': { text: 'Which is smallest in real life? Circle it.', short: 'Smallest in real life?' },
};

/** A tower of stacked blocks, standing on the baseline (version 0.3: hand-drawn block) */
function Tower({ cx, baseY, blocks, unit }: { cx: number; baseY: number; blocks: number; unit: number }) {
  const k = unit / 100;
  return (
    <g>
      {Array.from({ length: blocks }).map((_, i) => (
        <g key={i} transform={`translate(${cx - unit / 2} ${baseY - unit * (i + 1)}) scale(${k})`}>
          <HandArt id="compare-block" minLine={1.5 / k} />
        </g>
      ))}
    </g>
  );
}

/** A crayon lying on its side, left-aligned so lengths are easy to compare */
const Crayon = HandCrayon;

export const CompareSizeRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const question: string = QUESTIONS[s.question] ? s.question : 'biggest';
  const itemCount = Number(s.items) === 2 ? 2 : 3;
  // Up to 2 rows in a quarter or half space; a full space shows twice as many
  const rowCount = Math.min(2, Math.max(1, Number(s.rows) || 2)) * (size === 'full' ? 2 : 1);
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

  const pictures = pickDistinct(rand, picturesIn(s.pictureTheme), rowCount);
  const realLife = question.startsWith('real-');
  // Real life: same size on the page, very different sizes in the world (tiny, middling, huge)
  const realRows = Array.from({ length: realLife ? rowCount : 0 }, () => {
    // Sky things (sun, clouds, stars...) have no size a child can picture, so they sit this one out
    const sizeable = (n: string) => !NO_SIZE.includes(n);
    const pool = (filter: (z: number) => boolean) => {
      const inTheme = picturesIn(s.pictureTheme, (t, n) => filter(t.z) && sizeable(n));
      return inTheme.length ? inTheme : picturesIn('mixed', (t, n) => filter(t.z) && sizeable(n));
    };
    const buckets = itemCount === 2 ? [pool((z) => z <= 2), pool((z) => z >= 4)] : [pool((z) => z <= 2), pool((z) => z === 3), pool((z) => z === 5)];
    return rand.shuffle(buckets.map((b) => rand.pick(b)));
  });

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
        if (realLife) {
          const sz = Math.min(maxItem * 0.8, 84);
          return (
            <g key={i}>
              {realRows[i].map((name, j) => (
                <Picture key={j} name={name} cx={paddingX + colW * (j + 0.5)} cy={rowTop + rowH * 0.94 - sz / 2} size={sz} ground />
              ))}
              {i < rowCount - 1 && (
                <line x1={paddingX} y1={rowTop + rowH} x2={width - paddingX} y2={rowTop + rowH} stroke="#B6B2A6" strokeWidth="1.5" />
              )}
            </g>
          );
        }
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
              return <Picture key={j} name={pictures[i % pictures.length]} cx={cx} cy={rowTop + rowH * 0.94 - sz / 2} size={sz} ground />;
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
        { label: 'Biggest in real life (thinking)', value: 'real-biggest' },
        { label: 'Smallest in real life (thinking)', value: 'real-smallest' },
      ],
    },
    { ...themeSetting(), helperText: 'For biggest, smallest and real life.' },
    {
      key: 'items',
      label: 'Things in each row',
      type: 'select',
      options: [
        { label: '2 (easier)', value: 2 },
        { label: '3 (stretch)', value: 3 },
      ],
    },
    { key: 'rows', label: 'Number of rows', type: 'number', min: 1, max: 2, step: 1, helperText: 'Full spaces show twice as many.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures.' },
  ],
  defaultSettings: { question: 'biggest', items: 3, rows: 2, pictureTheme: 'mixed', variant: 1 },
  render: (props) => <CompareSizeRenderer {...props} />,
};
