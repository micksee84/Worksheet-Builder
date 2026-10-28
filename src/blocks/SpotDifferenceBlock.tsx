/**
 * @license
 * Sunshine Brigade Worksheet Builder - Spot the Difference
 * Skill: careful looking, attention and visual memory.
 * Two pictures that look the same, with a few changes in the second one: something missing,
 * something swapped, or something a different size. The child circles each change and
 * colours in a star for every one found.
 * Easier: 2 changes. Core: 3. Stretch: 5.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { KidShape } from './svgShapes';
import { createRandom, blockSeed } from '../utils/seededRandom';

const SCENES: Record<string, string[]> = {
  garden: ['flower', 'bee', 'butterfly', 'tree', 'bug', 'leaf', 'sun', 'bird', 'nest'],
  sea: ['fish', 'whale', 'crab', 'boat', 'waves', 'sun', 'cloud', 'bird', 'star'],
  night: ['moon', 'star', 'owl', 'house', 'tree', 'cloud', 'cat', 'heart', 'kite'],
};

interface SceneItem {
  name: string;
  x: number; // 0..1 inside the panel
  y: number;
  size: number; // share of panel width
}

type Change = 'missing' | 'swapped' | 'resized';

export const SpotDifferenceRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const differences = [2, 3, 5].includes(Number(s.differences)) ? Number(s.differences) : 3;
  const pool = SCENES[s.scene] || SCENES.garden;
  const rand = createRandom(blockSeed(instance.instanceId, s));

  // Lay items out on a loose 3 x 3 grid with a little wobble, so nothing overlaps
  const itemCount = Math.max(differences + 3, 7);
  const cellsAll = rand.shuffle(Array.from({ length: 9 }, (_, i) => i)).slice(0, itemCount);
  const names = rand.shuffle(pool);
  const items: SceneItem[] = cellsAll.map((cell, i) => ({
    name: names[i % names.length],
    x: ((cell % 3) + 0.5 + (rand.next() - 0.5) * 0.22) / 3,
    y: (Math.floor(cell / 3) + 0.5 + (rand.next() - 0.5) * 0.22) / 3,
    size: 0.25 + rand.next() * 0.05,
  }));

  // Choose which items change in the second picture, and how
  const changed = new Map<number, Change>();
  const order = rand.shuffle(items.map((_, i) => i)).slice(0, differences);
  const kinds: Change[] = ['missing', 'swapped', 'resized'];
  order.forEach((idx, k) => changed.set(idx, kinds[k % kinds.length]));
  const swaps = new Map<number, string>();
  const swapFor = (name: string) => {
    const used = new Set([...items.map((it) => it.name), ...swaps.values()]);
    const fresh = pool.filter((n) => !used.has(n));
    // Fall back to any other picture in the scene if every one is already on the page
    return fresh.length ? rand.pick(fresh) : rand.pick(pool.filter((n) => n !== name));
  };
  changed.forEach((kind, idx) => {
    if (kind === 'swapped') swaps.set(idx, swapFor(items[idx].name));
  });

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const tallyH = size === 'quarter' ? 30 : 40;
  const areaTop = sp.contentTop;
  const areaH = sp.contentBottom - areaTop - tallyH;
  const areaW = width - paddingX * 2;
  // Side by side when there is room, otherwise one above the other
  const sideBySide = areaW / 2 >= areaH * 0.8;
  const gap = 14;
  const panelW = sideBySide ? (areaW - gap) / 2 : areaW;
  const panelH = sideBySide ? areaH : (areaH - gap) / 2;
  const panels = [
    { x: paddingX, y: areaTop },
    sideBySide ? { x: paddingX + panelW + gap, y: areaTop } : { x: paddingX, y: areaTop + panelH + gap },
  ];
  const unit = Math.min(panelW, panelH);

  const drawPanel = (panelIndex: number) => {
    const p = panels[panelIndex];
    return (
      <g key={panelIndex}>
        <rect x={p.x} y={p.y} width={panelW} height={panelH} rx="12" ry="12" fill="#FFFFFF" stroke="#2D2200" strokeWidth="2.25" />
        {items.map((item, i) => {
          const change = panelIndex === 1 ? changed.get(i) : undefined;
          if (change === 'missing') return null;
          const name = change === 'swapped' ? (swaps.get(i) as string) : item.name;
          const sz = unit * item.size * (change === 'resized' ? 0.55 : 1);
          return <Picture key={i} name={name} cx={p.x + item.x * panelW} cy={p.y + item.y * panelH} size={sz} />;
        })}
      </g>
    );
  };

  const starSize = Math.min(tallyH * 0.7, 26);
  return (
    <g className="spot-difference-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="eye"
        size={size}
        text={size === 'quarter' ? `Find ${differences} changes.` : `Find ${differences} things that are different. Circle them.`}
      />
      {drawPanel(0)}
      {drawPanel(1)}
      {/* Colour a star for each difference found */}
      {Array.from({ length: differences }).map((_, i) => (
        <KidShape key={i} type="stars" cx={paddingX + starSize / 2 + i * (starSize + 8)} cy={sp.contentBottom - tallyH / 2} size={starSize} />
      ))}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const SpotDifferenceBlockDefinition: BlockDefinition = {
  id: 'spot-difference',
  displayName: 'Spot the difference',
  description: 'Two pictures with a few small changes. Circle each change and colour a star for it.',
  category: 'thinking',
  skillTags: ['attention', 'visual memory', 'looking closely'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'differences',
      label: 'Number of changes',
      type: 'select',
      options: [
        { label: '2 (easier)', value: 2 },
        { label: '3', value: 3 },
        { label: '5 (stretch)', value: 5 },
      ],
    },
    {
      key: 'scene',
      label: 'Scene',
      type: 'select',
      options: [
        { label: 'In the garden', value: 'garden' },
        { label: 'By the sea', value: 'sea' },
        { label: 'At night', value: 'night' },
      ],
    },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get a new picture.' },
  ],
  defaultSettings: { differences: 3, scene: 'garden', variant: 1 },
  render: (props) => <SpotDifferenceRenderer {...props} />,
};
