/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 1: Line Tracing (Pre-Writing)
 * Features:
 * - Left-to-right dashed pre-writing lines
 * - Line styles: straight, wave, zigzag, loops, castle
 * - Crisp SVG path generation with start dot and finish star
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';

export type LineStyle = 'straight' | 'wave' | 'zigzag' | 'loops' | 'castle';

function generateLinePath(
  style: LineStyle,
  startX: number,
  endX: number,
  y: number,
  amplitude: number
): string {
  const totalWidth = endX - startX;

  switch (style) {
    case 'straight':
      return `M ${startX} ${y} L ${endX} ${y}`;

    case 'wave': {
      const wavelength = 60;
      const cycles = Math.max(2, Math.floor(totalWidth / wavelength));
      const segWidth = totalWidth / cycles;
      let path = `M ${startX} ${y}`;
      for (let i = 0; i < cycles; i++) {
        const x0 = startX + i * segWidth;
        const xMid = x0 + segWidth / 2;
        const xNext = x0 + segWidth;
        path += ` Q ${x0 + segWidth * 0.25} ${y - amplitude}, ${xMid} ${y}`;
        path += ` Q ${x0 + segWidth * 0.75} ${y + amplitude}, ${xNext} ${y}`;
      }
      return path;
    }

    case 'zigzag': {
      const step = 36;
      const count = Math.max(3, Math.floor(totalWidth / step));
      const segWidth = totalWidth / count;
      let path = `M ${startX} ${y}`;
      for (let i = 0; i < count; i++) {
        const xNext = startX + (i + 1) * segWidth;
        const peakY = i % 2 === 0 ? y - amplitude : y + amplitude;
        path += ` L ${startX + (i + 0.5) * segWidth} ${peakY} L ${xNext} ${y}`;
      }
      return path;
    }

    case 'castle': {
      const step = 48;
      const count = Math.max(2, Math.floor(totalWidth / step));
      const segWidth = totalWidth / count;
      let path = `M ${startX} ${y}`;
      for (let i = 0; i < count; i++) {
        const curX = startX + i * segWidth;
        const halfSeg = segWidth * 0.5;
        path += ` L ${curX + segWidth * 0.25} ${y} L ${curX + segWidth * 0.25} ${y - amplitude} L ${curX + segWidth * 0.75} ${y - amplitude} L ${curX + segWidth * 0.75} ${y} L ${curX + segWidth} ${y}`;
      }
      return path;
    }

    case 'loops': {
      const wavelength = 55;
      const cycles = Math.max(2, Math.floor(totalWidth / wavelength));
      const segWidth = totalWidth / cycles;
      let path = `M ${startX} ${y}`;
      for (let i = 0; i < cycles; i++) {
        const x0 = startX + i * segWidth;
        const xNext = x0 + segWidth;
        // Cubic bezier loop that arches up and loops
        path += ` C ${x0 + segWidth * 0.2} ${y - amplitude * 1.4}, ${x0 + segWidth * 0.8} ${y - amplitude * 1.4}, ${xNext} ${y}`;
      }
      return path;
    }

    default:
      return `M ${startX} ${y} L ${endX} ${y}`;
  }
}

export const LineTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const lineStyle: LineStyle = instance.settings.lineStyle || 'wave';
  const requestedLines = Number(instance.settings.lineCount) || (size === 'quarter' ? 3 : 4);
  const lineCount = Math.min(6, Math.max(2, requestedLines));

  const paddingX = size === 'quarter' ? 24 : 36;
  const paddingY = size === 'quarter' ? 24 : 32;

  const startX = paddingX + 16;
  const endX = width - paddingX - 16;
  const usableHeight = height - paddingY * 2;
  const lineSpacing = usableHeight / (lineCount + 1);
  const amplitude = Math.min(18, Math.max(10, lineSpacing * 0.35));

  const lines = Array.from({ length: lineCount }, (_, idx) => {
    const y = paddingY + lineSpacing * (idx + 1);
    // If 'mixed' is selected or based on index, we can also alternate styles!
    const effectiveStyle =
      instance.settings.lineStyle === 'mixed'
        ? (['straight', 'wave', 'zigzag', 'castle', 'loops'][idx % 5] as LineStyle)
        : lineStyle;

    return {
      id: idx,
      y,
      path: generateLinePath(effectiveStyle, startX, endX, y, amplitude),
    };
  });

  return (
    <g className="line-tracing-block">
      {/* Title / Instruction */}
      <text
        x={paddingX}
        y={paddingY - 6}
        fill="#2D2200"
        fontSize={size === 'quarter' ? '12' : '14'}
        fontWeight="700"
        fontFamily="Nunito, sans-serif"
      >
        Trace the lines from left to right:
      </text>

      {/* Render each tracing line */}
      {lines.map((line) => (
        <g key={line.id}>
          {/* Start marker: playful green or dark circle */}
          <circle cx={startX - 10} cy={line.y} r="5.5" fill="#2D2200" />
          <circle cx={startX - 10} cy={line.y} r="2" fill="#FFFFFF" />

          {/* Trace line (dashed, bold black) */}
          <path
            d={line.path}
            fill="none"
            stroke="#2D2200"
            strokeWidth="2.5"
            strokeDasharray="6,5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Finish marker: cute 5-point star */}
          <path
            d={`M ${endX + 10} ${line.y - 6} L ${endX + 12} ${line.y - 2} L ${endX + 16} ${line.y - 2} L ${endX + 13} ${line.y + 1} L ${endX + 14} ${line.y + 5} L ${endX + 10} ${line.y + 2.5} L ${endX + 6} ${line.y + 5} L ${endX + 7} ${line.y + 1} L ${endX + 4} ${line.y - 2} L ${endX + 8} ${line.y - 2} Z`}
            fill="#2D2200"
          />
        </g>
      ))}

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const LineTracingBlockDefinition: BlockDefinition = {
  id: 'line-tracing',
  displayName: 'Line Tracing',
  description: 'Dashed straight, zigzag, wave, or loop lines to trace left-to-right.',
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
      helperText: 'How many tracing lines to display in this block.',
    },
  ],
  defaultSettings: {
    lineStyle: 'wave',
    lineCount: 4,
  },
  render: (props) => <LineTracingRenderer {...props} />,
};
