/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 2: Letter Tracing
 * Features:
 * - A chosen letter in uppercase, lowercase, or both (e.g. "Aa")
 * - Shown solid once as a clear reference model, then dashed outlines to trace
 * - Complete 3-line preschool handwriting guidelines (top, dashed midline, baseline)
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';

export const LetterTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const letter = (instance.settings.letter || 'A').toUpperCase().charAt(0) || 'A';
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
  const guideLineHeight = Math.min(54, Math.max(34, rowSpacing * 0.7));

  // Determine what each row displays
  // If 'both': Row 1 can be uppercase, Row 2 lowercase, etc.
  const rowConfigs = Array.from({ length: rows }, (_, idx) => {
    let textToDisplay = '';
    if (caseMode === 'upper') {
      textToDisplay = letter;
    } else if (caseMode === 'lower') {
      textToDisplay = lowerLetter;
    } else {
      // Both: Alternate or display "A a"
      textToDisplay = idx % 2 === 0 ? `${letter} ${lowerLetter}` : `${letter} ${lowerLetter}`;
    }
    return {
      id: idx,
      // Centre each row's guide lines (and descender line, if any) in its share of the space
      y: sp.contentTop + idx * rowSpacing + (rowSpacing - guideLineHeight * (['g', 'j', 'p', 'q', 'y'].includes(lowerLetter) ? 1.35 : 1)) / 2,
      text: textToDisplay,
    };
  });

  // Calculate items per row (repeats to trace across the line)
  const repeats = size === 'quarter' ? 3 : 5;
  const usableWidth = width - paddingX * 2;
  const colSpacing = usableWidth / repeats;

  // Fit the letters to their column so "G g" never runs into the next copy.
  // Nunito ExtraBold letters are roughly 0.68em wide, a space roughly 0.3em.
  const sampleText = caseMode === 'both' ? `${letter} ${lowerLetter}` : letter;
  const textWidthEm =
    sampleText.replace(/ /g, '').length * 0.68 + (sampleText.split(' ').length - 1) * 0.3;
  const letterFontSize = Math.min(guideLineHeight * 0.85, (colSpacing * 0.82) / textWidthEm);

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
            lineHeight={guideLineHeight}
            showDescender={['g', 'j', 'p', 'q', 'y'].includes(lowerLetter)}
          />

          {/* Repeat items along the line */}
          {Array.from({ length: repeats }).map((_, colIdx) => {
            const isModel = colIdx === 0;
            const itemX = paddingX + colIdx * colSpacing + colSpacing * 0.5;
            const textY = row.y + guideLineHeight - 4; // Aligned with baseline

            return (
              <g key={colIdx}>
                {isModel ? (
                  // Solid reference letter
                  <text
                    x={itemX}
                    y={textY}
                    textAnchor="middle"
                    fill="#2D2200"
                    fontFamily="Nunito, sans-serif"
                    fontSize={letterFontSize}
                    fontWeight="800"
                  >
                    {row.text}
                  </text>
                ) : (
                  // Letter to trace: solid Trace colour, the child draws over it
                  <g>
                    {/* Trace letter */}
                    <text
                      x={itemX}
                      y={textY}
                      textAnchor="middle"
                      fill="#B6B2A6"
                      fontFamily="Nunito, sans-serif"
                      fontSize={letterFontSize}
                      fontWeight="800"
                    >
                      {row.text}
                    </text>
                    {/* Small start helper dot for children */}
                    <circle
                      cx={itemX - guideLineHeight * 0.28}
                      cy={row.y + 10}
                      r="3"
                      fill="#2D2200"
                    />
                  </g>
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

export const LetterTracingBlockDefinition: BlockDefinition = {
  id: 'letter-tracing',
  displayName: 'Letter tracing',
  description: 'A solid letter to copy, then grey letters to trace on handwriting lines.',
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
