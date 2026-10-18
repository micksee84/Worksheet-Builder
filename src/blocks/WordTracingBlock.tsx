/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 3: Name / Word Tracing
 * Features:
 * - Parents or teachers type child's name or vocabulary word (e.g., "EMMA", "SUN", "CAT")
 * - Rendered as dashed traceable text on standard handwriting guidelines
 * - Repeated to fill the block rows
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';

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

  const rows = Array.from({ length: repeatCount }, (_, idx) => {
    const isModel = idx === 0 && Boolean(instance.settings.showSolidModel);
    const y = paddingY + idx * rowHeight + 10;
    return { idx, y, isModel };
  });

  return (
    <g className="word-tracing-block">
      {/* Title */}
      <text
        x={paddingX}
        y={paddingY - 10}
        fill="#2D2200"
        fontSize={size === 'quarter' ? '12' : '14'}
        fontWeight="700"
        fontFamily="Nunito, sans-serif"
      >
        Name & Word Tracing:
      </text>

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
              // Dashed outline to trace
              <g>
                <text
                  x={textX}
                  y={textY}
                  fill="#EDE8DA"
                  fontFamily="Nunito, sans-serif"
                  fontSize={fontSize}
                  fontWeight="800"
                  letterSpacing="4"
                  opacity="0.6"
                >
                  {rawText}
                </text>
                <text
                  x={textX}
                  y={textY}
                  fill="none"
                  stroke="#2D2200"
                  strokeWidth="2.2"
                  strokeDasharray="4,4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fontFamily="Nunito, sans-serif"
                  fontSize={fontSize}
                  fontWeight="800"
                  letterSpacing="4"
                >
                  {rawText}
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
  displayName: 'Name & Word Tracing',
  description: 'Type a child name or sight word; renders as dashed traceable text on handwriting lines.',
  category: 'letters',
  skillTags: ['name writing', 'early literacy', 'sight words'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'text',
      label: 'Word or Name to Trace',
      type: 'text',
      placeholder: 'e.g. EMMA, CAT, SUNSHINE',
      helperText: 'Type the word or name for the child to trace.',
    },
    {
      key: 'repeatCount',
      label: 'Number of Rows',
      type: 'number',
      min: 1,
      max: 5,
      step: 1,
      helperText: 'How many practice lines to fill.',
    },
    {
      key: 'showSolidModel',
      label: 'Solid Model on First Line',
      type: 'boolean',
      helperText: 'Show a solid black reference word on the first line.',
    },
  ],
  defaultSettings: {
    text: 'SUNSHINE',
    repeatCount: 3,
    showSolidModel: true,
  },
  render: (props) => <WordTracingRenderer {...props} />,
};
