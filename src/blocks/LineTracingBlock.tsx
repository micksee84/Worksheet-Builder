/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 1: Line Tracing (Pre-Writing)
 * Features:
 * - Left-to-right dotted pre-writing lines
 * - Line styles: straight, wave, zigzag, loops, castle
 * - Crisp SVG path generation with start dot and finish star
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { blockSpacing } from '../utils/spacing';

export type LineStyle = 'straight' | 'wave' | 'zigzag' | 'loops' | 'castle';

/** Distance between dots on dotted trace lines (matches strokeDasharray). */
export const TRACE_DOT_GAP = 16;
/** Castle steps use closer dots so each straight side reads as a line, not a dot grid. */
export const CASTLE_DOT_GAP = 10;

export function traceDashArray(style: LineStyle): string {
  return `0.1,${style === 'castle' ? CASTLE_DOT_GAP : TRACE_DOT_GAP}`;
}

/** A true sine wave with a set number of peaks, drawn as a fine polyline. */
export function generateSmoothWave(startX: number, endX: number, y: number, amplitude: number, peaks: number): string {
  const width = endX - startX;
  const steps = Math.max(24, Math.round(width / 2));
  let d = `M ${startX} ${y}`;
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    const px = startX + width * t;
    const py = y - amplitude * Math.sin(t * peaks * Math.PI * 2);
    d += ` L ${px.toFixed(2)} ${py.toFixed(2)}`;
  }
  return d;
}


export function generateLinePath(
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
      // Big, square steps built on the castle dot spacing so a dot lands on
      // every corner. Each straight side is its own subpath: the dot pattern restarts
      // at each corner instead of skipping past it.
      const g = CASTLE_DOT_GAP;
      const rise = g * Math.max(2, Math.round((amplitude * 1.6) / g));
      const flat = g * 3;
      const unit = flat * 2;
      const count = Math.max(2, Math.floor((totalWidth - flat) / unit));
      const lead = (totalWidth - count * unit - flat) / 2;
      const segs: string[] = [];
      let x = startX;
      const seg = (x1: number, y1: number, x2: number, y2: number) => segs.push(`M ${x1} ${y1} L ${x2} ${y2}`);
      if (lead > 0.5) { seg(x, y, x + lead, y); x += lead; }
      for (let i = 0; i < count; i++) {
        seg(x, y, x + flat, y); x += flat; // ground
        seg(x, y, x, y - rise); // up
        seg(x, y - rise, x + flat, y - rise); x += flat; // top
        seg(x, y - rise, x, y); // down
      }
      seg(x, y, x + flat, y); x += flat;
      if (endX - x > 0.5) seg(x, y, endX, y);
      // Closing dot at the very end of the line.
      segs.push(`M ${endX} ${y} L ${endX + 0.1} ${y}`);
      return segs.join(' ');
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

  // Spacing comes from utils/spacing: 0.25 in from the frame on every side.
  const sp = blockSpacing(size, height);
  const paddingX = sp.padX;

  const startX = paddingX + 16;
  const endX = width - paddingX - 16;
  const usableHeight = sp.contentBottom - sp.contentTop;
  const lineSpacing = usableHeight / lineCount;
  const amplitude = Math.min(18, Math.max(10, lineSpacing * 0.35));

  const lines = Array.from({ length: lineCount }, (_, idx) => {
    const y = sp.contentTop + lineSpacing * (idx + 0.5);
    // If 'mixed' is selected or based on index, we can also alternate styles!
    const effectiveStyle =
      instance.settings.lineStyle === 'mixed'
        ? (['straight', 'wave', 'zigzag', 'castle', 'loops'][idx % 5] as LineStyle)
        : lineStyle;

    return {
      id: idx,
      y,
      dash: traceDashArray(effectiveStyle),
      // Waves: three big, smooth humps so they read as waves, not zigzags.
      path:
        effectiveStyle === 'wave'
          ? generateSmoothWave(startX, endX, y, Math.min(lineSpacing * 0.3, 26), 3)
          : generateLinePath(effectiveStyle, startX, endX, y, amplitude),
    };
  });

  return (
    <g className="line-tracing-block">
      <Instruction x={paddingX} y={sp.instructionY} cue="pencil" size={size} text={size === 'quarter' ? 'Follow the dots to the star.' : 'Start at the big dot. Follow the dots to the star.'} />

      {/* Render each tracing line */}
      {lines.map((line) => (
        <g key={line.id}>
          {/* Start marker: playful green or dark circle */}
          <circle cx={startX - 10} cy={line.y} r="5.5" fill="#2D2200" />
          <circle cx={startX - 10} cy={line.y} r="2" fill="#FFFFFF" />

          {/* Trace line (dotted, soft grey) */}
          <path
            d={line.path}
            fill="none"
            stroke="#B6B2A6"
            strokeWidth="5"
            strokeDasharray={line.dash}
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
      helperText: 'How many tracing lines to display in this block.',
    },
  ],
  defaultSettings: {
    lineStyle: 'wave',
    lineCount: 4,
  },
  render: (props) => <LineTracingRenderer {...props} />,
};
