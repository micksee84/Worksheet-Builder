/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 1: Line Tracing (Pre-Writing)
 * Features:
 * - Left-to-right dotted pre-writing lines
 * - Line styles: straight, wave, zigzag, loops, castle
 * - Shapes come from traceShapes.ts (shared with Trace the path), with a complexity level
 * - Start dot and finish star
 */

import React from 'react';
import { HandArt } from './handArt';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';
import {
  buildTraceShape,
  COMPLEXITY_OPTIONS,
  levelForRow,
  LineStyle,
  traceBandHalf,
} from './traceShapes';
import { TraceDots } from './TraceDots';

export type { LineStyle } from './traceShapes';

export const LineTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const lineStyle: LineStyle = instance.settings.lineStyle || 'wave';
  const requestedLines = Number(instance.settings.lineCount) || (size === 'quarter' ? 3 : 4);
  // A full space shows twice the lines of a half space
  const lineCount = Math.min(size === 'full' ? 8 : 6, Math.max(2, requestedLines) * (size === 'full' ? 2 : 1));

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;

  const startX = paddingX + 16;
  const endX = width - paddingX - 16;
  const usableHeight = sp.contentBottom - sp.contentTop;
  const lineSpacing = usableHeight / lineCount;
  const half = traceBandHalf(lineSpacing);

  const lines = Array.from({ length: lineCount }, (_, idx) => {
    const y = sp.contentTop + lineSpacing * (idx + 0.5);
    const effectiveStyle =
      instance.settings.lineStyle === 'mixed'
        ? (['straight', 'wave', 'zigzag', 'castle', 'loops'][idx % 5] as LineStyle)
        : lineStyle;
    const level = levelForRow(instance.settings.complexity, idx, lineCount);
    return { id: idx, y, ...buildTraceShape(effectiveStyle, startX, endX, y, half, level) };
  });

  return (
    <g className="line-tracing-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="pencil" size={size} text={size === 'quarter' ? 'Follow the dots to the star.' : 'Start at the big dot. Follow the dots to the star.'} />

      {/* Render each tracing line */}
      {lines.map((line) => (
        <g key={line.id}>
          {/* Start marker: playful green or dark circle */}
          <circle cx={startX - 10} cy={line.startY} r="5.5" fill="#2D2200" />
          <circle cx={startX - 10} cy={line.startY} r="2" fill="#FFFFFF" />

          {/* Trace line: soft grey dots */}
          <TraceDots dots={line.dots} r={line.r} />

          {/* Finish marker: hand-drawn star (version 0.3), placed where the old star sat */}
          <g transform={`translate(${endX} ${line.endY})`}>
            <HandArt id="finish-star" minLine={0} />
          </g>
        </g>
      ))}

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const LineTracingBlockDefinition: BlockDefinition = {
  id: 'line-tracing',
  displayName: 'Line tracing',
  description: 'Dotted straight, zigzag, wave, or loop lines to trace left-to-right.',
  category: 'pre-writing',
  skillTags: ['pencil control', 'hand-eye coordination', 'fine motor'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'lineStyle',
      label: 'Line Style',
      type: 'select',
      options: [
        { label: 'Wave', value: 'wave' },
        { label: 'Zigzag', value: 'zigzag' },
        { label: 'Loops', value: 'loops' },
        { label: 'Castle / Stepped', value: 'castle' },
        { label: 'Straight', value: 'straight' },
        { label: 'Mixed Variety', value: 'mixed' },
      ],
    },
    {
      key: 'lineCount',
      label: 'Number of Lines',
      type: 'number',
      min: 2,
      max: 6,
      step: 1,
      helperText: 'Full spaces show twice as many (up to 8).',
    },
    {
      key: 'complexity',
      label: 'How tricky',
      type: 'select',
      options: COMPLEXITY_OPTIONS,
      helperText: 'Changes how many waves, points, steps or loops fit across each line.',
    },
  ],
  defaultSettings: {
    lineStyle: 'wave',
    lineCount: 4,
    complexity: 'medium',
  },
  render: (props) => <LineTracingRenderer {...props} />,
};
