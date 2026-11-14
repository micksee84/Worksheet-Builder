/**
 * @license
 * Sunshine Brigade Worksheet Builder - How Do I Feel?
 * Skill: naming feelings (emotional literacy), the first step to managing them.
 * A row of faces showing different feelings. The child circles how they feel today,
 * then draws why in the bubble. A grown-up reads the feeling words out loud.
 * Easier: 3 feelings. Stretch: 6.
 *
 * Two face styles: round emoji faces (17 feelings) or children's faces (6 children,
 * 9 feelings), one child for the whole row or a mix.
 */

import React from 'react';
import { HandArtBox } from './handArt';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';

export type Feeling =
  | 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'calm'
  | 'bored' | 'confused' | 'excited' | 'grumpy' | 'loving' | 'proud'
  | 'shy' | 'silly' | 'tired' | 'worried' | 'yucky';

/** Round emoji faces: all 17 feelings. Keys stay 3, 4, 6 so older worksheets keep their set. */
const EMOJI_SETS: Record<string, Feeling[]> = {
  '3': ['happy', 'sad', 'angry'],
  '4': ['happy', 'sad', 'angry', 'scared'],
  '6': ['happy', 'sad', 'angry', 'scared', 'surprised', 'calm'],
  more: ['excited', 'worried', 'shy', 'tired', 'silly', 'yucky'],
  more2: ['loving', 'proud', 'bored', 'confused', 'grumpy', 'happy'],
};

/** Children's faces come in 9 feelings (no sad, scared or surprised yet). */
const KID_SETS: Record<string, Feeling[]> = {
  '3': ['happy', 'angry', 'calm'],
  '4': ['happy', 'angry', 'calm', 'excited'],
  '6': ['happy', 'angry', 'calm', 'excited', 'proud', 'loving'],
  more: ['bored', 'confused', 'grumpy', 'excited', 'calm', 'happy'],
};

/** The six children: Penny, Ralph, Alice, Sam, Julia and Caleb (art ids describe the drawing). */
export const CHILDREN = ['girl-puffs', 'boy-afro', 'girl-bob', 'boy-sidepart', 'girl-hijab', 'boy-curly'] as const;
type Child = (typeof CHILDREN)[number];

/** The art id for one face. A mix gives each face the next child along. */
function faceId(feeling: Feeling, style: string, child: string, index: number): string {
  if (style !== 'kids') return 'feeling-' + feeling;
  const who: Child = (CHILDREN as readonly string[]).includes(child) ? (child as Child) : CHILDREN[index % CHILDREN.length];
  return `kid-${who}-${feeling}`;
}

/** One feeling face, drawn in a 100 x 100 box. */
export function Face({ id, cx, cy, size }: { id: string; cx: number; cy: number; size: number }) {
  // Krea feelings faces (feelingFaces.ts)
  return <HandArtBox id={id} cx={cx} cy={cy} size={size} />;
}

export const FeelingsRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const style = s.faces === 'kids' ? 'kids' : 'emoji';
  const sets = style === 'kids' ? KID_SETS : EMOJI_SETS;
  const key = style === 'kids' ? String(s.kidSet ?? '4') : String(s.count ?? '4');
  const all = sets[key] || sets['4'];
  // Quarter spaces show up to 4
  const feelings = size === 'quarter' ? all.slice(0, 4) : all;
  const count = feelings.length;
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
            <Face id={faceId(feeling, style, String(s.child ?? 'mix'), i)} cx={cx} cy={cy} size={faceSize} />
            {showWords && (
              <text x={cx} y={cy + faceSize / 2 + 15} textAnchor="middle" fill="#2D2200" fontSize="12" fontWeight="700" fontFamily="Nunito, sans-serif">
                {feeling}
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
      key: 'faces',
      label: 'Faces',
      type: 'select',
      options: [
        { label: 'Emoji faces', value: 'emoji' },
        { label: "Children's faces", value: 'kids' },
      ],
    },
    {
      key: 'child',
      label: 'Child',
      type: 'select',
      showWhen: { key: 'faces', value: 'kids' },
      options: [
        { label: 'A mix of children', value: 'mix' },
        { label: 'Alice', value: 'girl-bob' },
        { label: 'Caleb', value: 'boy-curly' },
        { label: 'Julia', value: 'girl-hijab' },
        { label: 'Penny', value: 'girl-puffs' },
        { label: 'Ralph', value: 'boy-afro' },
        { label: 'Sam', value: 'boy-sidepart' },
      ],
    },
    {
      key: 'count',
      label: 'Feelings',
      type: 'select',
      showWhen: { key: 'faces', value: 'emoji' },
      options: [
        { label: '3: happy, sad, angry (easier)', value: 3 },
        { label: '4: adds scared', value: 4 },
        { label: '6: adds surprised and calm (stretch)', value: 6 },
        { label: '6 more: excited, worried, shy, tired, silly, yucky', value: 'more' },
        { label: '6 more: loving, proud, bored, confused, grumpy, happy', value: 'more2' },
      ],
      helperText: 'Quarter spaces show up to 4.',
    },
    {
      key: 'kidSet',
      label: 'Feelings',
      type: 'select',
      showWhen: { key: 'faces', value: 'kids' },
      options: [
        { label: '3: happy, angry, calm (easier)', value: 3 },
        { label: '4: adds excited', value: 4 },
        { label: '6: adds proud and loving (stretch)', value: 6 },
        { label: '6 more: bored, confused, grumpy, excited, calm, happy', value: 'more' },
      ],
      helperText: 'Quarter spaces show up to 4.',
    },
    { key: 'showWords', label: 'Show feeling words', type: 'boolean' },
    { key: 'showDraw', label: 'Add a bubble to draw why', type: 'boolean' },
  ],
  defaultSettings: { faces: 'emoji', child: 'mix', count: 4, kidSet: 4, showWords: true, showDraw: true },
  render: (props) => <FeelingsRenderer {...props} />,
};
