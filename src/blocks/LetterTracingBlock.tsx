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
import { DESCENDER_LETTERS, lettersWidth, placeLetter } from './letterStrokes';
import { INK_STYLE } from '../config/appConfig';

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

  // Letter height (top line to baseline). Fits the row height and the column width,
  // so "W w" never runs into the next copy.
  const LETTER_GAP = 0.3;
  const textUnits = lettersWidth(rowText, LETTER_GAP);
  const fitHeight = rowSpacing / (hasDescender ? 1.55 : 1.25);
  const h = Math.min(54, fitHeight, (colSpacing * 0.7) / Math.max(textUnits, 0.5));

  // Dot and stroke sizes scale with the letter.
  const dotGap = Math.max(4.5, h * 0.12);
  const dotR = Math.max(1.5, h * 0.045);
  const modelStroke = Math.max(2.5, h * 0.09);
  const startR = Math.max(3, h * 0.075);

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

          {/* Repeat items along the line */}
          {Array.from({ length: repeats }).map((_, colIdx) => {
            const isModel = colIdx === 0;
            const centreX = paddingX + colIdx * colSpacing + colSpacing * 0.5;
            let x = centreX - (textUnits * h) / 2;
            const placed = rowText.split('').map((ch) => {
              const p = placeLetter(ch, x, row.y, h, dotGap);
              x += (lettersWidthOne(ch) + LETTER_GAP) * h;
              return p;
            });

            return (
              <g key={colIdx}>
                {placed.map((p, i) =>
                  !p ? null : isModel ? (
                    // Solid reference letter, drawn from the same strokes
                    <g key={i} fill="none" stroke={INK_STYLE.ink} strokeWidth={modelStroke} strokeLinecap="round" strokeLinejoin="round">
                      {p.paths.map((d, k) => (
                        <path key={k} d={d} />
                      ))}
                      {p.dots.map(([dx, dy], k) => (
                        <circle key={`d${k}`} cx={dx} cy={dy} r={modelStroke * 0.6} fill={INK_STYLE.ink} stroke="none" />
                      ))}
                    </g>
                  ) : (
                    // Letter to trace: grey dots, black dot where the pencil starts
                    <g key={i}>
                      <g fill={INK_STYLE.trace}>
                        {p.traceDots.map((d, k) => (
                          <circle key={k} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={dotR} />
                        ))}
                      </g>
                      <circle cx={p.start[0]} cy={p.start[1]} r={startR} fill={INK_STYLE.ink} />
                    </g>
                  )
                )}
              </g>
            );
          })}
        </g>
      ))}

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

const lettersWidthOne = (ch: string) => lettersWidth(ch, 0);

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
