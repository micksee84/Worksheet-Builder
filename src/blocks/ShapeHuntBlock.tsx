/**
 * @license
 * Sunshine Brigade Worksheet Builder - Shape Hunt
 * Skill: recognising and naming shapes when they are turned and mixed with others.
 * A scatter of shapes. The child finds and colours every shape that matches the one in the key,
 * then counts them. Easier: few shapes, three kinds. Stretch: a busy page with five kinds.
 */

import React from 'react';
import { HandArtBox } from './handArt';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { createRandom, blockSeed } from '../utils/seededRandom';

export type HuntShape = 'circle' | 'triangle' | 'square' | 'star' | 'heart';

const SHAPE_NAMES: Record<HuntShape, string> = {
  circle: 'circle',
  triangle: 'triangle',
  square: 'square',
  star: 'star',
  heart: 'heart',
};

export function shapePath(shape: HuntShape, cx: number, cy: number, r: number, _rot: number): React.ReactNode {
  // Krea shape hunt drawing (frame: r 50 around the centre)
  return <HandArtBox id={'shape-' + shape} cx={cx} cy={cy} size={r * 2} />;
}

export const ShapeHuntRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const target: HuntShape = (SHAPE_NAMES as Record<string, string>)[s.target] ? s.target : 'circle';
  const kinds: HuntShape[] = s.kinds === 'five' ? ['circle', 'triangle', 'square', 'star', 'heart'] : ['circle', 'triangle', 'square'];
  if (!kinds.includes(target)) kinds[kinds.length - 1] = target;
  const areaScale = size === 'full' ? 2 : size === 'half' ? 1 : 0.55;
  const baseCount = s.busy === 'lots' ? 16 : s.busy === 'few' ? 7 : 11;
  const total = Math.max(5, Math.round(baseCount * areaScale));
  const rand = createRandom(blockSeed(instance.instanceId, s));

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const countRowH = size === 'quarter' ? 34 : 44;
  // The key (what to look for): a bigger shape in a dashed box, centred on the instruction line.
  const keyFont = size === 'quarter' ? 12 : 14;
  const keyText = size === 'quarter' ? `Colour every ${SHAPE_NAMES[target]}.` : `Find every ${SHAPE_NAMES[target]} and colour it in.`;
  const keyBox = size === 'quarter' ? 30 : 40;
  const keyLeft = paddingX + keyFont + 12 + keyText.length * keyFont * 0.47 + 10;
  const keyCy = Math.max(sp.padX - 4 + keyBox / 2, sp.instructionY - keyFont * 0.35);
  const keyBottom = keyCy + keyBox / 2;
  const areaTop = Math.max(sp.contentTop, keyBottom + 8);
  const areaBottom = sp.contentBottom - countRowH;
  const areaLeft = paddingX;
  const areaRight = width - paddingX;
  const r = size === 'quarter' ? 15 : 20;

  // Aim for about a third of the shapes to be the target, at least 3
  const targetCount = Math.max(3, Math.round(total / 3));
  const kindsList: HuntShape[] = [
    ...Array.from({ length: targetCount }, () => target),
    ...Array.from({ length: total - targetCount }, () => rand.pick(kinds.filter((k) => k !== target))),
  ];

  const placed: { shape: HuntShape; cx: number; cy: number; r: number; rot: number }[] = [];
  for (const shape of rand.shuffle(kindsList)) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const sr = r * (0.8 + rand.next() * 0.45);
      const cx = areaLeft + sr + rand.next() * (areaRight - areaLeft - sr * 2);
      const cy = areaTop + sr + rand.next() * (areaBottom - areaTop - sr * 2);
      if (placed.every((p) => Math.hypot(p.cx - cx, p.cy - cy) > p.r + sr + 10)) {
        placed.push({ shape, cx, cy, r: sr, rot: shape === 'circle' ? 0 : rand.int(-35, 35) });
        break;
      }
    }
  }

  const fontSize = keyFont;
  const instruction = keyText;

  return (
    <g className="shape-hunt-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="crayon" size={size} text={instruction} />
      {/* The key: what to look for, bigger and in a dashed box so it stands out */}
      <rect
        x={keyLeft}
        y={keyCy - keyBox / 2}
        width={keyBox}
        height={keyBox}
        rx="8"
        ry="8"
        fill="#FFFFFF"
        stroke="#B6B2A6"
        strokeWidth="2"
        strokeDasharray="6,5"
      />
      {shapePath(target, keyLeft + keyBox / 2, keyCy, keyBox * 0.34, 0)}

      {placed.map((p, i) => (
        <g key={i}>{shapePath(p.shape, p.cx, p.cy, p.r, p.rot)}</g>
      ))}

      {/* Count them: a dashed line to write the number on */}
      <line x1={paddingX} y1={areaBottom + 4} x2={width - paddingX} y2={areaBottom + 4} stroke="#B6B2A6" strokeWidth="1.5" />
      <g transform={`translate(${paddingX} ${areaBottom + countRowH / 2 + 6})`}>
        <text x="0" y="5" fill="#2D2200" fontSize={fontSize} fontWeight="700" fontFamily="Nunito, sans-serif">
          How many did you find?
        </text>
        {/* A dashed line to write the number on */}
        <line
          x1={fontSize * 0.5 * 23 + 10}
          y1={6}
          x2={fontSize * 0.5 * 23 + 10 + fontSize * 5}
          y2={6}
          stroke="#B6B2A6"
          strokeWidth="2"
          strokeDasharray="8,6"
          strokeLinecap="round"
        />
      </g>
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const ShapeHuntBlockDefinition: BlockDefinition = {
  id: 'shape-hunt',
  displayName: 'Shape hunt',
  description: 'A scatter of shapes. Find and colour every one that matches the key, then count them.',
  category: 'numbers',
  skillTags: ['shapes', 'geometry', 'counting'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'target',
      label: 'Shape to find',
      type: 'select',
      options: [
        { label: 'Circle', value: 'circle' },
        { label: 'Triangle', value: 'triangle' },
        { label: 'Square', value: 'square' },
        { label: 'Star', value: 'star' },
        { label: 'Heart', value: 'heart' },
      ],
    },
    {
      key: 'kinds',
      label: 'Shapes on the page',
      type: 'select',
      options: [
        { label: '3 kinds (easier)', value: 'three' },
        { label: '5 kinds (stretch)', value: 'five' },
      ],
    },
    {
      key: 'busy',
      label: 'How busy',
      type: 'select',
      options: [
        { label: 'A few', value: 'few' },
        { label: 'Some', value: 'some' },
        { label: 'Lots', value: 'lots' },
      ],
    },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to move the shapes around.' },
  ],
  defaultSettings: { target: 'circle', kinds: 'three', busy: 'some', variant: 1 },
  render: (props) => <ShapeHuntRenderer {...props} />,
};
