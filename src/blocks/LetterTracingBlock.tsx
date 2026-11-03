/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 2: Letter Tracing
 * Features:
 * - A chosen letter in uppercase, lowercase, or both (e.g. "Aa")
 * - Shown solid once as a clear reference model, then grey dots to trace
 * - Letters are drawn from handwriting strokes (letterStrokes.ts), so the black start
 *   dot sits where a child begins that letter
 * - Complete 3-line preschool handwriting guidelines (top, dashed midline, baseline)
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { DESCENDER_LETTERS, lettersWidth } from './letterStrokes';
import { HandwrittenText } from '../components/HandwrittenText';

export const LetterTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const letter: string = (instance.settings.letter || 'A').toUpperCase().charAt(0) || 'A';
  const lowerLetter = letter.toLowerCase();
  const caseMode: 'both' | 'upper' | 'lower' = instance.settings.caseMode || 'both';

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;

  // Decide row count based on block size
  const defaultRows = size === 'full' ? 4 : 2;
  const rows = defaultRows;

  const usableHeight = sp.contentBottom - sp.contentTop;
  const rowSpacing = usableHeight / rows;
  const hasDescender = caseMode !== 'upper' && DESCENDER_LETTERS.has(lowerLetter);
  const rowText: string = caseMode === 'upper' ? letter : caseMode === 'lower' ? lowerLetter : `${letter}${lowerLetter}`;

  // Repeats across the line: one solid model, then copies to trace.
  const repeats = size === 'quarter' ? 3 : 5;
  const usableWidth = width - paddingX * 2;
  const colSpacing = usableWidth / repeats;

  // Letter height (top line to baseline). Sized from the widest letter in the alphabet
  // for this case mode, not the chosen letter, so every letter comes out the same size:
  // M is as tall as N, and "Ww" still never runs into the next copy.
  const LETTER_GAP = 0.3;
  const widestUnits = widestRowUnits(caseMode, LETTER_GAP);
  // Leave room for a descender line on every letter, so g is the same size as a.
  const fitHeight = rowSpacing / (caseMode === 'upper' ? 1.25 : 1.55);
  const h = Math.min(54, fitHeight, (colSpacing * 0.8) / widestUnits);

  const rowConfigs = Array.from({ length: rows }, (_, idx) => ({
    id: idx,
    // Centre each row's guide lines (and descender line, if any) in its share of the space
    y: sp.contentTop + idx * rowSpacing + (rowSpacing - h * (hasDescender ? 1.35 : 1)) / 2,
  }));

  return (
    <g className="letter-tracing-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="pencil" size={size} text={size === 'quarter' ? `Trace the letter ${letter}.` : `Trace the letter ${letter}. Start at the dot.`} />

      {rowConfigs.map((row) => (
        <g key={row.id}>
          {/* Handwriting guide lines behind letters */}
          <HandwritingGuideLines
            x={paddingX}
            y={row.y}
            width={usableWidth}
            lineHeight={h}
            showDescender={hasDescender}
          />

          {/* Repeat items along the line: one solid model, then copies to trace */}
          {Array.from({ length: repeats }).map((_, colIdx) => (
            <HandwrittenText
              key={colIdx}
              text={rowText}
              x={paddingX + colIdx * colSpacing + colSpacing * 0.5}
              y={row.y}
              h={h}
              gap={LETTER_GAP}
              align="middle"
              variant={colIdx === 0 ? 'solid' : 'trace'}
            />
          ))}
        </g>
      ))}

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
/** Width of the widest row text (e.g. "Ww") for a case mode, in line units. */
function widestRowUnits(caseMode: 'both' | 'upper' | 'lower', gap: number): number {
  return Math.max(
    ...ALPHABET.map((c) =>
      lettersWidth(caseMode === 'upper' ? c : caseMode === 'lower' ? c.toLowerCase() : c + c.toLowerCase(), gap)
    )
  );
}

export const LetterTracingBlockDefinition: BlockDefinition = {
  id: 'letter-tracing',
  displayName: 'Letter tracing',
  description: 'A solid letter to copy, then dotted letters to trace on handwriting lines.',
  category: 'letters',
  skillTags: ['alphabet', 'letter formation', 'phonics'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'letter',
      label: 'Letter (A-Z)',
      type: 'select',
      options: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => ({
        label: char,
        value: char,
      })),
      helperText: 'Choose which letter to practice.',
    },
    {
      key: 'caseMode',
      label: 'Letter Case',
      type: 'select',
      options: [
        { label: 'Both (Aa)', value: 'both' },
        { label: 'Uppercase Only (A)', value: 'upper' },
        { label: 'Lowercase Only (a)', value: 'lower' },
      ],
    },
  ],
  defaultSettings: {
    letter: 'A',
    caseMode: 'both',
  },
  render: (props) => <LetterTracingRenderer {...props} />,
};
