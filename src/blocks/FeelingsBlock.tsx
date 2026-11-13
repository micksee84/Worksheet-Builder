/**
 * @license
 * Sunshine Brigade Worksheet Builder - How Do I Feel?
 * Skill: naming feelings (emotional literacy), the first step to managing them.
 * A row of faces showing different feelings. The child circles how they feel today,
 * then draws why in the bubble. A grown-up reads the feeling words out loud.
 * Easier: 3 feelings. Stretch: 6.
 *
 * PLACEHOLDER ART: simple faces drawn by Claude. Swap in the Sunshine Brigade characters'
 * feeling poses when they are ready.
 */

import React from 'react';
import { HandArtBox } from './handArt';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';

export type Feeling = 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'calm';

const SETS: Record<number, Feeling[]> = {
  3: ['happy', 'sad', 'angry'],
  4: ['happy', 'sad', 'angry', 'scared'],
  6: ['happy', 'sad', 'angry', 'scared', 'surprised', 'calm'],
};

const LABELS: Record<Feeling, string> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  scared: 'scared',
  surprised: 'surprised',
  calm: 'calm',
};

/** One feeling face, drawn in a 100 x 100 box. */
export function Face({ feeling, cx, cy, size }: { feeling: Feeling; cx: number; cy: number; size: number }) {
  // Krea feelings face (handArtShapes.ts)
  return <HandArtBox id={'feeling-' + feeling} cx={cx} cy={cy} size={size} />;
}

export const FeelingsRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const requested = [3, 4, 6].includes(Number(s.count)) ? Number(s.count) : 4;
  const count = size === 'quarter' ? Math.min(requested, 4) : requested;
  const feelings = SETS[count] || SETS[4];
  const showDraw = s.showDraw !== false;
  const showWords = s.showWords !== false;

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const usableW = width - paddingX * 2;
  const usableH = sp.contentBottom - top;
  const perRow = size === 'quarter' && count === 4 ? 2 : count;
  const faceRows = Math.ceil(count / perRow);
  const facesH = showDraw ? usableH * (faceRows > 1 ? 0.62 : 0.42) : usableH;
  const colW = usableW / perRow;
  const labelH = showWords ? 18 : 0;
  const faceSize = Math.min(colW * 0.78, facesH / faceRows - labelH - 8, 96);

  const drawTop = top + facesH + 8;
  const drawH = top + usableH - drawTop;

  return (
    <g className="feelings-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="circle"
        size={size}
        text={size === 'quarter' ? 'How do you feel today?' : 'How do you feel today? Circle a face.'}
      />
      {feelings.map((feeling, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const cx = paddingX + colW * (col + 0.5);
        const cellTop = top + (facesH / faceRows) * row;
        const cy = cellTop + (facesH / faceRows - labelH) / 2;
        return (
          <g key={feeling}>
            <Face feeling={feeling} cx={cx} cy={cy} size={faceSize} />
            {showWords && (
              <text x={cx} y={cy + faceSize / 2 + 15} textAnchor="middle" fill="#2D2200" fontSize="12" fontWeight="700" fontFamily="Nunito, sans-serif">
                {LABELS[feeling]}
              </text>
            )}
          </g>
        );
      })}
      {showDraw && drawH > 40 && (
        <g>
          {/* Speech bubble to draw why */}
          <path
            d={`M ${paddingX + 12} ${drawTop + 14}
                L ${width - paddingX - 12} ${drawTop + 14}
                Q ${width - paddingX} ${drawTop + 14} ${width - paddingX} ${drawTop + 26}
                L ${width - paddingX} ${drawTop + drawH - 12}
                Q ${width - paddingX} ${drawTop + drawH} ${width - paddingX - 12} ${drawTop + drawH}
                L ${paddingX + 12} ${drawTop + drawH}
                Q ${paddingX} ${drawTop + drawH} ${paddingX} ${drawTop + drawH - 12}
                L ${paddingX} ${drawTop + 26}
                Q ${paddingX} ${drawTop + 14} ${paddingX + 12} ${drawTop + 14}
                L ${paddingX + 30} ${drawTop + 14} L ${paddingX + 22} ${drawTop} L ${paddingX + 46} ${drawTop + 14} Z`}
            fill="#FFFFFF"
            stroke="#2D2200"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />
          <text x={paddingX + 16} y={drawTop + 34} fill="#B6B2A6" fontSize="12" fontWeight="700" fontFamily="Nunito, sans-serif">
            Draw why
          </text>
        </g>
      )}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const FeelingsBlockDefinition: BlockDefinition = {
  id: 'feelings',
  displayName: 'How do I feel?',
  description: 'Feeling faces to circle, plus a bubble to draw why. Big feelings are easier with a name.',
  category: 'feelings',
  skillTags: ['feelings', 'emotional literacy', 'talking'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'count',
      label: 'Number of feelings',
      type: 'select',
      options: [
        { label: '3: happy, sad, angry (easier)', value: 3 },
        { label: '4: adds scared', value: 4 },
        { label: '6: adds surprised and calm (stretch)', value: 6 },
      ],
      helperText: 'Quarter spaces show up to 4.',
    },
    { key: 'showWords', label: 'Show feeling words', type: 'boolean' },
    { key: 'showDraw', label: 'Add a bubble to draw why', type: 'boolean' },
  ],
  defaultSettings: { count: 4, showWords: true, showDraw: true },
  render: (props) => <FeelingsRenderer {...props} />,
};
