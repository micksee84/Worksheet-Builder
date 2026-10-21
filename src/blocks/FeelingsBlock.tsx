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
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';

type Feeling = 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'calm';

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
function Face({ feeling, cx, cy, size }: { feeling: Feeling; cx: number; cy: number; size: number }) {
  const k = size / 100;
  const w = Math.max(1.5, Math.min(3, size * 0.035)) / k;
  const ink = '#2D2200';
  const line = { fill: 'none', stroke: ink, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const eyeDots = (
    <>
      <circle cx="36" cy="42" r="5" fill={ink} />
      <circle cx="64" cy="42" r="5" fill={ink} />
    </>
  );
  const wideEyes = (
    <>
      <circle cx="36" cy="42" r="9" fill="#FFFFFF" stroke={ink} strokeWidth={w * 0.8} />
      <circle cx="64" cy="42" r="9" fill="#FFFFFF" stroke={ink} strokeWidth={w * 0.8} />
      <circle cx="36" cy="43" r="4" fill={ink} />
      <circle cx="64" cy="43" r="4" fill={ink} />
    </>
  );
  let features: React.ReactNode;
  switch (feeling) {
    case 'happy':
      features = (
        <>
          {eyeDots}
          <path d="M30 60 Q50 80 70 60" {...line} />
        </>
      );
      break;
    case 'sad':
      features = (
        <>
          {eyeDots}
          <path d="M26 34 L40 28 M74 34 L60 28" {...line} />
          <path d="M32 74 Q50 58 68 74" {...line} />
          <path d="M66 50 Q62 58 66 62 Q70 58 66 50 Z" fill="#FFFFFF" stroke={ink} strokeWidth={w * 0.7} />
        </>
      );
      break;
    case 'angry':
      features = (
        <>
          {eyeDots}
          <path d="M26 28 L42 36 M74 28 L58 36" {...line} />
          <path d="M34 70 Q50 62 66 70" {...line} />
        </>
      );
      break;
    case 'scared':
      features = (
        <>
          {wideEyes}
          <path d="M26 26 Q34 20 44 26 M56 26 Q66 20 74 26" {...line} />
          <path d="M32 70 Q38 64 44 70 Q50 76 56 70 Q62 64 68 70" {...line} />
        </>
      );
      break;
    case 'surprised':
      features = (
        <>
          {wideEyes}
          <path d="M26 24 Q36 16 46 24 M54 24 Q64 16 74 24" {...line} />
          <ellipse cx="50" cy="70" rx="8" ry="10" fill="#FFFFFF" stroke={ink} strokeWidth={w} />
        </>
      );
      break;
    case 'calm':
      features = (
        <>
          <path d="M28 44 Q36 50 44 44 M56 44 Q64 50 72 44" {...line} />
          <path d="M38 64 Q50 72 62 64" {...line} />
        </>
      );
      break;
  }
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`}>
      <circle cx="50" cy="50" r="44" fill="#FFFFFF" stroke={ink} strokeWidth={w} />
      {features}
    </g>
  );
}

export const FeelingsRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const requested = [3, 4, 6].includes(Number(s.count)) ? Number(s.count) : 4;
  const count = size === 'quarter' ? Math.min(requested, 4) : requested;
  const feelings = SETS[count] || SETS[4];
  const showDraw = s.showDraw !== false;
  const showWords = s.showWords !== false;

  const paddingX = size === 'quarter' ? 14 : 30;
  const paddingY = size === 'quarter' ? 26 : 32;
  const top = paddingY + 8;
  const usableW = width - paddingX * 2;
  const usableH = height - top - paddingY + 12;
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
        y={paddingY - 6}
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
