/**
 * @license
 * Sunshine Brigade Worksheet Builder - My Name and Words
 * Skill: writing their own name, the first word most children learn to write.
 * A grown-up types the name (or a word) once. It appears on handwriting lines in three modes:
 * - Trace (easier): grey letters on every line to draw over.
 * - Half trace (core): the start of the word to trace, the rest to finish alone.
 * - Write alone (stretch): a solid word to copy, then empty lines.
 * The name is only stored on this device. It is never sent anywhere.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';

export const WordTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const rawText = (instance.settings.text || 'SUNSHINE').trim() || 'NAME';
  const repeatCount = Math.min(
    size === 'quarter' ? 2 : size === 'half' ? 3 : 5,
    Math.max(1, Number(instance.settings.repeatCount) || (size === 'quarter' ? 2 : 3))
  );

  const paddingX = size === 'quarter' ? 24 : 36;
  const paddingY = size === 'quarter' ? 28 : 36;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;
  const rowHeight = usableHeight / repeatCount;
  const guideLineHeight = Math.min(50, Math.max(30, rowHeight * 0.65));

  // Auto-size font based on word length to fit nicely across the guideline
  const charCount = Math.max(rawText.length, 3);
  const maxFontSize = guideLineHeight * 0.85;
  const calculatedFontSize = Math.min(maxFontSize, (usableWidth * 0.85) / charCount);
  const fontSize = Math.max(22, calculatedFontSize);

  const mode: 'trace' | 'half' | 'alone' =
    instance.settings.mode === 'half' || instance.settings.mode === 'alone' ? instance.settings.mode : 'trace';
  // Write alone always shows the word to copy first
  const showModel = mode === 'alone' || Boolean(instance.settings.showSolidModel);
  const traceText =
    mode === 'half' ? rawText.slice(0, Math.max(1, Math.ceil(rawText.length / 2))) : mode === 'alone' ? '' : rawText;
  const instruction =
    mode === 'alone'
      ? 'Copy the word on each line.'
      : mode === 'half'
        ? size === 'quarter'
          ? 'Trace, then finish the word.'
          : 'Trace the start, then finish the word on your own.'
        : size === 'quarter'
          ? 'Trace the word.'
          : 'Trace the word. Start on the left.';

  const rows = Array.from({ length: repeatCount }, (_, idx) => {
    const isModel = idx === 0 && showModel;
    const y = paddingY + idx * rowHeight + 10;
    return { idx, y, isModel };
  });

  return (
    <g className="word-tracing-block">
      <Instruction x={paddingX} y={paddingY - 8} cue="pencil" size={size} text={instruction} />

      {rows.map(({ idx, y, isModel }) => {
        const textY = y + guideLineHeight - 4;
        const textX = paddingX + 16;

        return (
          <g key={idx}>
            <HandwritingGuideLines
              x={paddingX}
              y={y}
              width={usableWidth}
              lineHeight={guideLineHeight}
              showDescender={/[gjpqy]/.test(rawText.toLowerCase())}
            />

            {isModel ? (
              // First line is solid reference model
              <text
                x={textX}
                y={textY}
                fill="#2D2200"
                fontFamily="Nunito, sans-serif"
                fontSize={fontSize}
                fontWeight="800"
                letterSpacing="4"
              >
                {rawText}
              </text>
            ) : (
              // Word to trace: solid Trace colour, the child draws over it
              <g>
                <text
                  x={textX}
                  y={textY}
                  fill="#B6B2A6"
                  fontFamily="Nunito, sans-serif"
                  fontSize={fontSize}
                  fontWeight="800"
                  letterSpacing="4"
                >
                  {traceText}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const WordTracingBlockDefinition: BlockDefinition = {
  id: 'word-tracing',
  displayName: 'My name and words',
  description: 'Type a name or word once. Trace it, finish it, or copy it alone on handwriting lines.',
  category: 'letters',
  skillTags: ['name writing', 'early literacy', 'sight words'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'text',
      label: 'Name or word',
      type: 'text',
      placeholder: 'e.g. Emma, cat, sun',
      helperText: 'Stays on this device only.',
    },
    {
      key: 'mode',
      label: 'How to practise',
      type: 'select',
      options: [
        { label: 'Trace (easier)', value: 'trace' },
        { label: 'Half trace, half on their own', value: 'half' },
        { label: 'Write alone (stretch)', value: 'alone' },
      ],
    },
    {
      key: 'repeatCount',
      label: 'Number of lines',
      type: 'number',
      min: 1,
      max: 5,
      step: 1,
      helperText: 'How many practice lines to fill.',
    },
    {
      key: 'showSolidModel',
      label: 'Solid word to copy on the first line',
      type: 'boolean',
      helperText: 'Show a solid word to copy on the first line.',
    },
  ],
  defaultSettings: {
    text: 'Sunshine',
    mode: 'trace',
    repeatCount: 3,
    showSolidModel: true,
  },
  render: (props) => <WordTracingRenderer {...props} />,
};
