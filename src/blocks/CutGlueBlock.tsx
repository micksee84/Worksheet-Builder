/**
 * @license
 * Sunshine Brigade Worksheet Builder - Cut and Glue
 * Skill: scissor control and hand strength, plus visual matching.
 * The child cuts out each picture along the dashed lines, then glues it on its shadow.
 * Easier: 2 pieces, straight cuts. Stretch: 4 pieces, wavy cuts.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { createRandom, blockSeed } from '../utils/seededRandom';

const SETS: Record<string, string[]> = {
  // Pictures in each set have clearly different outlines, so every shadow has one match
  animals: ['cat', 'fish', 'bird', 'whale', 'snake', 'crab'],
  garden: ['flower', 'leaf', 'bee', 'butterfly', 'bug', 'tree'],
  home: ['house', 'mug', 'hat', 'spoon', 'cake', 'ball'],
};

/** A rounded square outline, with straight or gently wavy sides, as a path. */
function cutOutline(x: number, y: number, w: number, h: number, wavy: boolean): string {
  const r = 12;
  if (!wavy) {
    return `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
  }
  const waves = 3;
  const a = Math.min(w, h) * 0.06;
  let d = `M ${x} ${y}`;
  const side = (x1: number, y1: number, x2: number, y2: number, nx: number, ny: number) => {
    for (let i = 0; i < waves; i++) {
      const tm = (i + 0.5) / waves;
      const t1 = (i + 1) / waves;
      const sign = i % 2 === 0 ? 1 : -1;
      const mx = x1 + (x2 - x1) * tm + nx * a * sign;
      const my = y1 + (y2 - y1) * tm + ny * a * sign;
      d += ` Q ${mx} ${my} ${x1 + (x2 - x1) * t1} ${y1 + (y2 - y1) * t1}`;
    }
  };
  side(x, y, x + w, y, 0, -1);
  side(x + w, y, x + w, y + h, 1, 0);
  side(x + w, y + h, x, y + h, 0, 1);
  side(x, y + h, x, y, -1, 0);
  return `${d} Z`;
}

export const CutGlueRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const maxPieces = size === 'quarter' ? 3 : 4;
  const pieces = Math.min(maxPieces, Math.max(2, Number(s.pieces) || 3));
  const wavy = s.cutStyle === 'wavy';
  const set = SETS[s.pictureSet] || SETS.animals;
  const rand = createRandom(blockSeed(instance.instanceId, s));
  const chosen = rand.shuffle(set).slice(0, pieces);
  const glueOrder = rand.shuffle(chosen);
  // Make sure the shadows are not in the same order as the pieces
  if (glueOrder.every((p, i) => p === chosen[i])) glueOrder.push(glueOrder.shift() as string);

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const usableW = width - paddingX * 2;
  const gap = size === 'quarter' ? 10 : 16;
  const areaTop = sp.contentTop;
  const areaH = sp.contentBottom - areaTop;
  const box = Math.min((usableW - gap * (pieces - 1)) / pieces, (areaH - 28) / 2);
  const rowW = box * pieces + gap * (pieces - 1);
  const startX = paddingX + (usableW - rowW) / 2;
  const cutY = areaTop + 4;
  const glueY = cutY + box + 28;

  return (
    <g className="cut-glue-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="scissors"
        size={size}
        text={size === 'quarter' ? 'Cut and glue on the shadow.' : 'Cut out each picture. Glue it on its shadow.'}
      />

      {/* Pieces to cut out */}
      {chosen.map((name, i) => {
        const x = startX + i * (box + gap);
        return (
          <g key={`cut-${name}`}>
            <path d={cutOutline(x, cutY, box, box, wavy)} fill="#FFFFFF" stroke="#2D2200" strokeWidth="1.5" strokeDasharray="7,5" strokeLinecap="round" />
            <Picture name={name} cx={x + box / 2} cy={cutY + box / 2} size={box * 0.72} />
          </g>
        );
      })}

      {/* Divider between the cut row and the glue row */}
      <line x1={paddingX} y1={cutY + box + 14} x2={width - paddingX} y2={cutY + box + 14} stroke="#B6B2A6" strokeWidth="1.5" strokeLinecap="round" />

      {/* Shadows to glue onto */}
      {glueOrder.map((name, i) => {
        const x = startX + i * (box + gap);
        return (
          <g key={`glue-${name}`}>
            <rect x={x} y={glueY} width={box} height={box} rx="12" ry="12" fill="#FFFFFF" stroke="#2D2200" strokeWidth="2.25" />
            <Picture name={name} cx={x + box / 2} cy={glueY + box / 2} size={box * 0.72} mode="shadow" />
          </g>
        );
      })}

      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const CutGlueBlockDefinition: BlockDefinition = {
  id: 'cut-glue',
  displayName: 'Cut and glue',
  description: 'Cut out pictures along dashed lines and glue each one on its matching shadow.',
  category: 'pre-writing',
  skillTags: ['scissor skills', 'fine motor', 'visual matching'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'pieces',
      label: 'Number of pictures',
      type: 'number',
      min: 2,
      max: 4,
      step: 1,
      helperText: 'Quarter spaces show up to 3.',
    },
    {
      key: 'cutStyle',
      label: 'Cutting lines',
      type: 'select',
      options: [
        { label: 'Straight (easier)', value: 'straight' },
        { label: 'Wavy (stretch)', value: 'wavy' },
      ],
    },
    {
      key: 'pictureSet',
      label: 'Pictures',
      type: 'select',
      options: [
        { label: 'Animals', value: 'animals' },
        { label: 'In the garden', value: 'garden' },
        { label: 'At home', value: 'home' },
      ],
    },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures in a new order.' },
  ],
  defaultSettings: { pieces: 3, cutStyle: 'straight', pictureSet: 'animals', variant: 1 },
  render: (props) => <CutGlueRenderer {...props} />,
};
