/**
 * @license
 * Sunshine Brigade Worksheet Builder - Mini Maze
 * Skill: planning ahead, problem solving and pencil control.
 * A simple maze with wide lanes for small hands. The child helps a character find the way
 * from the start to its goal. Every maze has exactly one path through.
 * Easier: 4 lanes across. Core: 6. Stretch: 8.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { createRandom, blockSeed, SeededRandom } from '../utils/seededRandom';

const PAIRS: Record<string, [string, string]> = {
  'bee-flower': ['bee', 'flower'],
  'bird-nest': ['bird', 'nest'],
  'dog-bone': ['dog', 'bone'],
  'cat-house': ['cat', 'house'],
};

interface MazeWalls {
  /** top[r][c]: wall on the top edge of cell (r, c). r runs 0..rows (rows = bottom edge) */
  top: boolean[][];
  /** left[r][c]: wall on the left edge of cell (r, c). c runs 0..cols (cols = right edge) */
  left: boolean[][];
}

/** Carves a perfect maze (one path between any two cells) with a depth-first search. */
function buildMaze(cols: number, rows: number, rand: SeededRandom): MazeWalls {
  const top = Array.from({ length: rows + 1 }, () => Array(cols).fill(true));
  const left = Array.from({ length: rows }, () => Array(cols + 1).fill(true));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const options: [number, number, 'up' | 'down' | 'left' | 'right'][] = [];
    if (r > 0 && !visited[r - 1][c]) options.push([r - 1, c, 'up']);
    if (r < rows - 1 && !visited[r + 1][c]) options.push([r + 1, c, 'down']);
    if (c > 0 && !visited[r][c - 1]) options.push([r, c - 1, 'left']);
    if (c < cols - 1 && !visited[r][c + 1]) options.push([r, c + 1, 'right']);
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nr, nc, dir] = rand.pick(options);
    if (dir === 'up') top[r][c] = false;
    if (dir === 'down') top[r + 1][c] = false;
    if (dir === 'left') left[r][c] = false;
    if (dir === 'right') left[r][c + 1] = false;
    visited[nr][nc] = true;
    stack.push([nr, nc]);
  }

  // Way in on the top-left, way out on the bottom-right
  left[0][0] = false;
  left[rows - 1][cols] = false;
  return { top, left };
}

export const MazeRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const lanes = Math.min(10, Math.max(3, Number(s.lanes) || 5));
  const pair = PAIRS[s.pair] || PAIRS['bee-flower'];
  const rand = createRandom(blockSeed(instance.instanceId, s));

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const areaTop = sp.contentTop;
  const areaH = sp.contentBottom - areaTop;
  const picSize = size === 'quarter' ? 34 : 50;
  const areaW = width - paddingX * 2 - picSize * 2 - 12;

  // Fit the maze to the space: `lanes` across, as many rows as keep the cells square
  const cols = lanes;
  const cell = Math.min(areaW / cols, areaH / 3);
  const rows = Math.max(3, Math.min(Math.floor(areaH / cell), Math.round(lanes * 1.4)));
  const mazeW = cell * cols;
  const mazeH = cell * rows;
  const x0 = paddingX + picSize + 6 + (areaW - mazeW) / 2;
  const y0 = areaTop + (areaH - mazeH) / 2;
  const walls = buildMaze(cols, rows, rand);

  const segments: string[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (walls.top[r][c]) segments.push(`M ${x0 + c * cell} ${y0 + r * cell} L ${x0 + (c + 1) * cell} ${y0 + r * cell}`);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (walls.left[r][c]) segments.push(`M ${x0 + c * cell} ${y0 + r * cell} L ${x0 + c * cell} ${y0 + (r + 1) * cell}`);
    }
  }

  const startY = y0 + cell / 2;
  const endY = y0 + mazeH - cell / 2;

  return (
    <g className="maze-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="pencil"
        size={size}
        text={size === 'quarter' ? 'Find the way through.' : `Help the ${pair[0]} find the way to the ${pair[1]}.`}
      />
      <path d={segments.join(' ')} fill="none" stroke="#2D2200" strokeWidth={Math.max(2.25, Math.min(4, cell * 0.08))} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x0 + cell * 0.3} cy={startY} r="4.5" fill="#2D2200" />
      <Picture name={pair[0]} cx={x0 - picSize / 2 - 4} cy={startY} size={picSize} />
      <Picture name={pair[1]} cx={x0 + mazeW + picSize / 2 + 4} cy={endY} size={picSize} />
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const MazeBlockDefinition: BlockDefinition = {
  id: 'maze',
  displayName: 'Mini maze',
  description: 'A simple maze with wide lanes. Help the character find the way to its goal.',
  category: 'thinking',
  skillTags: ['problem solving', 'planning', 'pencil control'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'lanes',
      label: 'Maze size',
      type: 'select',
      options: [
        { label: 'Small (easier)', value: 4 },
        { label: 'Medium', value: 6 },
        { label: 'Big (stretch)', value: 8 },
      ],
    },
    {
      key: 'pair',
      label: 'Who goes where',
      type: 'select',
      options: [
        { label: 'Bee to flower', value: 'bee-flower' },
        { label: 'Bird to nest', value: 'bird-nest' },
        { label: 'Dog to bone', value: 'dog-bone' },
        { label: 'Cat to house', value: 'cat-house' },
      ],
    },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get a new maze.' },
  ],
  defaultSettings: { lanes: 4, pair: 'bee-flower', variant: 1 },
  render: (props) => <MazeRenderer {...props} />,
};
