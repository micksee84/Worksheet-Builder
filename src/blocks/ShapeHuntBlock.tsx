/**
 * @license
 * Sunshine Brigade Worksheet Builder - Shape Hunt
 * Skill: recognising and naming shapes when they are turned and mixed with others.
 * A scatter of shapes. The child finds and colours every shape that matches the one in the key,
 * then counts them. Easier: few shapes, three kinds. Stretch: a busy page with five kinds.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { createRandom, blockSeed } from '../utils/seededRandom';

type HuntShape = 'circle' | 'triangle' | 'square' | 'star' | 'heart';

const SHAPE_NAMES: Record<HuntShape, string> = {
  circle: 'circle',
  triangle: 'triangle',
  square: 'square',
  star: 'star',
  heart: 'heart',
};

function shapePath(shape: HuntShape, cx: number, cy: number, r: number, rot: number): React.ReactNode {
  const common = { fill: '#FFFFFF', stroke: '#2D2200', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  const t = `rotate(${rot} ${cx} ${cy})`;
  switch (shape) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={r} {...common} />;
    case 'square':
      return <rect x={cx - r * 0.86} y={cy - r * 0.86} width={r * 1.72} height={r * 1.72} rx={r * 0.12} {...common} transform={t} />;
    case 'triangle':
      return <path d={`M ${cx} ${cy - r} L ${cx + r * 0.95} ${cy + r * 0.7} L ${cx - r * 0.95} ${cy + r * 0.7} Z`} {...common} transform={t} />;
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r * 0.46;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        pts.push(`${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...common} transform={t} />;
    }
    case 'heart':
      return (
        <path
          d={`M ${cx} ${cy + r * 0.85} C ${cx - r * 1.3} ${cy + r * 0.1}, ${cx - r * 1.1} ${cy - r * 0.95}, ${cx} ${cy - r * 0.35} C ${cx + r * 1.1} ${cy - r * 0.95}, ${cx + r * 1.3} ${cy + r * 0.1}, ${cx} ${cy + r * 0.85} Z`}
          {...common}
          transform={t}
        />
      );
  }
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
  const areaTop = sp.contentTop;
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

  const fontSize = size === 'quarter' ? 12 : 14;
  const instruction = size === 'quarter' ? `Colour every ${SHAPE_NAMES[target]}.` : `Find every ${SHAPE_NAMES[target]} and colour it in.`;
  const keyX = paddingX + fontSize + 12 + instruction.length * fontSize * 0.5 + 12;

  return (
    <g className="shape-hunt-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="crayon" size={size} text={instruction} />
      {/* The key: what to look for */}
      {shapePath(target, keyX, sp.instructionY - fontSize * 0.35, fontSize * 0.7, 0)}

      {placed.map((p, i) => (
        <g key={i}>{shapePath(p.shape, p.cx, p.cy, p.r, p.rot)}</g>
      ))}

      {/* Count them */}
      <line x1={paddingX} y1={areaBottom + 4} x2={width - paddingX} y2={areaBottom + 4} stroke="#B6B2A6" strokeWidth="1.5" />
      <g transform={`translate(${paddingX} ${areaBottom + countRowH / 2 + 6})`}>
        <text x="0" y="5" fill="#2D2200" fontSize={fontSize} fontWeight="700" fontFamily="Nunito, sans-serif">
          How many did you find?
        </text>
        <rect
          x={fontSize * 0.5 * 23 + 10}
          y={-countRowH * 0.36}
          width={countRowH * 0.8}
          height={countRowH * 0.72}
          rx="12"
          ry="12"
          fill="#FFFFFF"
          stroke="#2D2200"
          strokeWidth="2"
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
