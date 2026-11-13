/**
 * @license
 * Sunshine Brigade Worksheet Builder - My Name and Words
 * Skill: writing their own name, the first word most children learn to write.
 * A grown-up types the name (or a word) once. It appears on handwriting lines in three modes:
 * - Trace (easier): dotted Sunshine Print letters on every line to draw over.
 * - Half trace (core): the start of the word to trace, the rest to finish alone.
 * - Write alone (stretch): a solid word to copy, then empty lines.
 * The name is only stored on this device. It is never sent anywhere.
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import { handwrittenWidth, HandwrittenText } from '../components/HandwrittenText';

export const WordTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const rawText = (instance.settings.text || 'SUNSHINE').trim() || 'NAME';
  // Lines per quarter (2) or half (3) space; a full space shows twice as many
  const repeatCount =
    Math.min(size === 'quarter' ? 2 : 3, Math.max(1, Number(instance.settings.repeatCount) || (size === 'quarter' ? 2 : 3))) *
    (size === 'full' ? 2 : 1);

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;

  const usableWidth = width - paddingX * 2;
  const usableHeight = sp.contentBottom - sp.contentTop;
  const rowHeight = usableHeight / repeatCount;
  const hasDescender = /[gjpqy,]/.test(rawText);
  // Sunshine Print size: as big as the row allows, shrunk only if the word is too long.
  const fitHeight = rowHeight / (hasDescender ? 1.6 : 1.3);
  const wordUnits = handwrittenWidth(rawText, 1);
  const guideLineHeight = Math.max(18, Math.min(50, fitHeight, (usableWidth - 24) / Math.max(wordUnits, 1)));

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
    // Centre each row's guide lines (and descender line, if any) in its share of the space
    const rowExtent = guideLineHeight * (hasDescender ? 1.35 : 1);
    const y = sp.contentTop + idx * rowHeight + (rowHeight - rowExtent) / 2;
    return { idx, y, isModel };
  });

  return (
    <g className="word-tracing-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="pencil" size={size} text={instruction} />

      {rows.map(({ idx, y, isModel }) => {
        const textX = paddingX + 12;
        return (
          <g key={idx}>
            <HandwritingGuideLines
              x={paddingX}
              y={y}
              width={usableWidth}
              lineHeight={guideLineHeight}
              showDescender={hasDescender}
            />
            {isModel ? (
              // First line is the solid word to copy
              <HandwrittenText text={rawText} x={textX} y={y} h={guideLineHeight} variant="solid" />
            ) : (
              // Word to trace: grey dots, a black start dot on each letter
              <HandwrittenText text={traceText} x={textX} y={y} h={guideLineHeight} variant="trace" />
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
      max: 3,
      step: 1,
      helperText: 'Quarter spaces show up to 2. Full spaces show twice as many.',
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
