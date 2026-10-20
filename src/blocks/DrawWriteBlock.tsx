/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 6: Draw & Write Box
 * Features:
 * - Empty bordered drawing box with prompt line
 * - Handwriting lines below for child to write their response or name
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';

export const DrawWriteRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const prompt = (instance.settings.prompt || 'Draw your favourite animal.').trim();
  const requestedLines = Number(instance.settings.writingLinesCount) || (size === 'quarter' ? 1 : 2);
  const writingLinesCount = Math.min(size === 'quarter' ? 2 : 3, Math.max(1, requestedLines));

  const paddingX = size === 'quarter' ? 20 : 32;
  const paddingY = size === 'quarter' ? 22 : 30;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Split space: prompt header -> drawing area -> writing lines area
  const promptHeight = 22;
  const writingAreaHeight = writingLinesCount * (size === 'quarter' ? 36 : 46);
  const drawingBoxHeight = Math.max(50, usableHeight - promptHeight - writingAreaHeight - 16);
  const drawingBoxY = paddingY + promptHeight + 4;
  const writingStartY = drawingBoxY + drawingBoxHeight + 16;
  const lineHeight = size === 'quarter' ? 26 : 32;

  return (
    <g className="draw-and-write-block">
      {/* Prompt Text */}
      <text
        x={paddingX}
        y={paddingY + 12}
        fill="#2D2200"
        fontSize={size === 'quarter' ? '12' : '14'}
        fontWeight="700"
        fontFamily="Nunito, sans-serif"
      >
        {prompt}
      </text>

      {/* Empty Bordered Drawing Box */}
      <rect
        x={paddingX}
        y={drawingBoxY}
        width={usableWidth}
        height={drawingBoxHeight}
        rx="12"
        ry="12"
        fill="#FFFFFF"
        stroke="#2D2200"
        strokeWidth="2.5"
      />

      {/* Small corner pencil or drawing hint icon inside drawing box */}
      <g>
        <text
          x={paddingX + usableWidth - 16}
          y={drawingBoxY + 22}
          textAnchor="end"
          fill="#B6B2A6"
          fontSize="11"
          fontFamily="Nunito, sans-serif"
        >
          draw here
        </text>
      </g>

      {/* Writing lines below */}
      <g className="writing-lines-container">
        {Array.from({ length: writingLinesCount }).map((_, idx) => {
          const y = writingStartY + idx * (size === 'quarter' ? 34 : 44);
          return (
            <HandwritingGuideLines
              key={idx}
              x={paddingX}
              y={y}
              width={usableWidth}
              lineHeight={lineHeight}
              showDescender={false}
            />
          );
        })}
      </g>

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const DrawWriteBlockDefinition: BlockDefinition = {
  id: 'draw-and-write',
  displayName: 'Draw and write',
  description: 'An empty bordered drawing area with a prompt line and preschool handwriting lines below.',
  category: 'creative',
  skillTags: ['creative drawing', 'early writing', 'expression', 'fine motor'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'prompt',
      label: 'Prompt Text',
      type: 'text',
      placeholder: 'e.g. Draw your favourite animal.',
      helperText: 'Instruction prompt shown above the drawing box.',
    },
    {
      key: 'writingLinesCount',
      label: 'Writing Lines',
      type: 'number',
      min: 1,
      max: 3,
      step: 1,
      helperText: 'How many handwriting guide lines to display below the drawing area.',
    },
  ],
  defaultSettings: {
    prompt: 'Draw your favourite animal and write its name:',
    writingLinesCount: 2,
  },
  render: (props) => <DrawWriteRenderer {...props} />,
};
