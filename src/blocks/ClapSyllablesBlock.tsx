/**
 * @license
 * Sunshine Brigade Worksheet Builder - Clap the Syllables
 * Skill: hearing the beats in a word (phonological awareness), a step towards reading.
 * Each row has a picture and three boxes. The child says the word, claps the beats,
 * then colours one box for each clap: cat (1), rab-bit (2), el-e-phant (3).
 * Only words with one clear way to say them are used (no "flow-er" or "flower").
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { Picture } from './pictures';
import { labelOf, picturesIn, themeSetting } from './pictureLibrary';
import { createRandom, blockSeed } from '../utils/seededRandom';

export const ClapSyllablesRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  // Up to 3 in a quarter or half space; a full space shows twice as many
  const rowCount = Math.min(3, Math.max(1, Number(s.rows) || 3)) * (size === 'full' ? 2 : 1);
  const rand = createRandom(blockSeed(instance.instanceId, s));

  // Mix 1, 2 and 3 beats so the answer is never the same all the way down
  const byBeats = (n: number) => {
    const inTheme = picturesIn(s.pictureTheme, (t) => t.s === n);
    return rand.shuffle(inTheme.length ? inTheme : picturesIn('mixed', (t) => t.s === n));
  };
  const queues = [byBeats(1), byBeats(2), byBeats(3)];
  const beatsOrder = rand.shuffle(Array.from({ length: rowCount }, (_, i) => (i % 3) + 1));
  const rows = beatsOrder.map((beats) => queues[beats - 1].shift() as string).filter(Boolean);

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;
  const top = sp.contentTop;
  const rowH = (sp.contentBottom - top) / rows.length;
  const picSize = Math.min(rowH * 0.8, size === 'quarter' ? 56 : 80);
  const showWords = s.showWords !== false;
  const boxesLeft = paddingX + picSize + (size === 'quarter' ? 22 : 40);
  const boxGap = size === 'quarter' ? 8 : 14;
  const box = Math.min(rowH * 0.56, (width - paddingX - boxesLeft - boxGap * 2) / 3, 64);

  return (
    <g className="clap-syllables-block">
      <Instruction
        x={paddingX}
        y={sp.instructionY}
        cue="talk"
        size={size}
        text={size === 'quarter' ? 'Clap it. Colour a box per clap.' : 'Say the word and clap it. Colour one box for each clap.'}
      />
      {rows.map((name, i) => {
        const cy = top + rowH * (i + 0.5);
        const picCy = showWords ? cy - 6 : cy;
        return (
          <g key={name}>
            <Picture name={name} cx={paddingX + picSize / 2} cy={picCy} size={picSize} />
            {showWords && (
              <text
                x={paddingX + picSize / 2}
                y={picCy + picSize / 2 + 12}
                textAnchor="middle"
                fill="#2D2200"
                fontSize={size === 'quarter' ? 11 : 13}
                fontWeight="700"
                fontFamily="Nunito, sans-serif"
              >
                {labelOf(name)}
              </text>
            )}
            {[0, 1, 2].map((b) => (
              <rect
                key={b}
                x={boxesLeft + b * (box + boxGap)}
                y={cy - box / 2}
                width={box}
                height={box}
                rx={Math.min(12, box * 0.25)}
                fill="#FFFFFF"
                stroke="#2D2200"
                strokeWidth="2.25"
              />
            ))}
            {i < rows.length - 1 && (
              <line x1={paddingX} y1={top + rowH * (i + 1)} x2={width - paddingX} y2={top + rowH * (i + 1)} stroke="#B6B2A6" strokeWidth="1.5" />
            )}
          </g>
        );
      })}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const ClapSyllablesBlockDefinition: BlockDefinition = {
  id: 'clap-syllables',
  displayName: 'Clap the syllables',
  description: 'Say each picture, clap the beats and colour one box per clap: cat (1), rab-bit (2), el-e-phant (3).',
  category: 'letters',
  skillTags: ['syllables', 'listening', 'phonological awareness'],
  ageRange: '4–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    themeSetting(),
    { key: 'rows', label: 'Number of pictures', type: 'number', min: 1, max: 3, step: 1, helperText: 'Full spaces show twice as many.' },
    { key: 'showWords', label: 'Show the word under each picture', type: 'boolean' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures.' },
  ],
  defaultSettings: { pictureTheme: 'mixed', rows: 3, showWords: true, variant: 1 },
  render: (props) => <ClapSyllablesRenderer {...props} />,
};
