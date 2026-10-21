/**
 * @license
 * Sunshine Brigade Worksheet Builder - Beginning Sounds
 * Skill: hearing the first sound in a word (phonological awareness), then linking it to a letter.
 * Letters mode: say the picture's name, circle the letter it starts with.
 * Pictures mode (no letters, for younger children): circle the picture that starts the same way.
 * Only single-consonant and short-vowel starts are used; blends like "st" are left out.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { Picture, PICTURES } from './pictures';
import { createRandom, blockSeed } from '../utils/seededRandom';

const LETTER_SETS: Record<string, string[]> = {
  'b-d-m-s': ['b', 'd', 'm', 's'],
  'c-f-h-l': ['c', 'f', 'h', 'l'],
  'p-v-w-n': ['p', 'v', 'w', 'n', 'm'],
  vowels: ['a', 'e'],
  mixed: ['b', 'c', 'd', 'f', 'h', 'l', 'm', 's', 'w', 'p', 'a', 'e'],
};
// Letters that sound alike to young ears: never offer both as choices
const CONFUSABLE: Record<string, string> = { c: 'k', k: 'c' };
const DISTRACTOR_POOL = ['b', 'c', 'd', 'f', 'h', 'l', 'm', 'n', 'p', 's', 't', 'w'];

function picturesStartingWith(sound: string): string[] {
  return Object.entries(PICTURES)
    .filter(([, p]) => p.sound === sound)
    .map(([name]) => name);
}

export const BeginningSoundsRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const s = instance.settings;
  const mode: 'letters' | 'pictures' = s.mode === 'pictures' ? 'pictures' : 'letters';
  const maxRows = size === 'quarter' ? 3 : size === 'half' ? 3 : 6;
  const rowCount = Math.min(maxRows, Math.max(1, Number(s.rows) || 3));
  const letters = (LETTER_SETS[s.letterSet] || LETTER_SETS.mixed).filter((l) => picturesStartingWith(l).length > 0);
  const rand = createRandom(blockSeed(instance.instanceId, s));

  // Pick a different sound for each row where possible
  const sounds = rand.shuffle(letters);
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const sound = sounds[i % sounds.length];
    const options = picturesStartingWith(sound);
    const target = rand.pick(options);
    if (mode === 'letters') {
      const distractors = rand
        .shuffle(DISTRACTOR_POOL.filter((l) => l !== sound && l !== CONFUSABLE[sound]))
        .slice(0, 2);
      return { target, sound, choices: rand.shuffle([sound, ...distractors]) };
    }
    // Pictures mode: one picture with the same first sound, two that start differently
    const match = rand.pick(options.filter((n) => n !== target).length ? options.filter((n) => n !== target) : options);
    const others = rand
      .shuffle(
        Object.entries(PICTURES)
          .filter(([, p]) => p.sound && p.sound !== sound && p.sound !== CONFUSABLE[sound])
          .map(([name]) => name)
      )
      .slice(0, 2);
    return { target, sound, choices: rand.shuffle([match, ...others]) };
  });

  const paddingX = size === 'quarter' ? 16 : 30;
  const paddingY = size === 'quarter' ? 26 : 32;
  const top = paddingY + 6;
  const rowH = (height - top - paddingY + 14) / rowCount;
  const picSize = Math.min(rowH * 0.72, size === 'quarter' ? 52 : 70);
  const choiceR = Math.min(rowH * 0.32, size === 'quarter' ? 20 : 26);
  const choicesLeft = paddingX + picSize + (size === 'quarter' ? 18 : 40);
  const choicesWidth = width - paddingX - choicesLeft;
  const choiceStep = choicesWidth / 3;

  return (
    <g className="beginning-sounds-block">
      <Instruction
        x={paddingX}
        y={paddingY - 6}
        cue="talk"
        size={size}
        text={
          mode === 'letters'
            ? size === 'quarter'
              ? 'Circle the first sound.'
              : 'Say the name. Circle the sound it starts with.'
            : size === 'quarter'
              ? 'Which one starts the same?'
              : 'Say the names. Circle the one that starts the same way.'
        }
      />
      {rows.map((row, i) => {
        const cy = top + rowH * (i + 0.5);
        return (
          <g key={i}>
            <Picture name={row.target} cx={paddingX + picSize / 2} cy={cy} size={picSize} />
            {/* Arrow from the picture to its choices */}
            <path
              d={`M ${paddingX + picSize + 6} ${cy} L ${choicesLeft - 10} ${cy} M ${choicesLeft - 16} ${cy - 5} L ${choicesLeft - 10} ${cy} L ${choicesLeft - 16} ${cy + 5}`}
              fill="none"
              stroke="#B6B2A6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {row.choices.map((choice, j) => {
              const cx = choicesLeft + choiceStep * (j + 0.5);
              return mode === 'letters' ? (
                <text
                  key={j}
                  x={cx}
                  y={cy + choiceR * 0.38}
                  textAnchor="middle"
                  fill="#2D2200"
                  fontSize={Math.max(20, choiceR * 1.15)}
                  fontWeight="700"
                  fontFamily="Nunito, sans-serif"
                >
                  {choice}
                </text>
              ) : (
                <Picture key={j} name={choice} cx={cx} cy={cy} size={Math.min(picSize * 0.85, choiceStep * 0.8)} />
              );
            })}
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

export const BeginningSoundsBlockDefinition: BlockDefinition = {
  id: 'beginning-sounds',
  displayName: 'Beginning sounds',
  description: 'Say the picture name and circle the sound it starts with. Picture-only mode for younger children.',
  category: 'letters',
  skillTags: ['phonics', 'first sounds', 'listening'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'mode',
      label: 'Choices',
      type: 'select',
      options: [
        { label: 'Letters', value: 'letters' },
        { label: 'Pictures only (easier, no letters)', value: 'pictures' },
      ],
    },
    {
      key: 'letterSet',
      label: 'Sounds to practise',
      type: 'select',
      options: [
        { label: 'Mixed', value: 'mixed' },
        { label: 'b, d, m, s', value: 'b-d-m-s' },
        { label: 'c, f, h, l', value: 'c-f-h-l' },
        { label: 'm, n, p, v, w', value: 'p-v-w-n' },
        { label: 'Short a and e', value: 'vowels' },
      ],
    },
    { key: 'rows', label: 'Number of pictures', type: 'number', min: 1, max: 6, step: 1, helperText: 'Quarter and half spaces show up to 3.' },
    { key: 'variant', label: 'Mix it up', type: 'number', min: 1, max: 20, step: 1, helperText: 'Change this to get different pictures.' },
  ],
  defaultSettings: { mode: 'letters', letterSet: 'mixed', rows: 3, variant: 1 },
  render: (props) => <BeginningSoundsRenderer {...props} />,
};
