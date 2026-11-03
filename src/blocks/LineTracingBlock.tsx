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

/** Target distance between dots on dotted trace lines. Each shape fine-tunes it so dots land on corners. */
export const TRACE_DOT_GAP = 16;

/**
 * Every trace shape fits the same band: `half` above and below the row's centre line.
 * Shared by Line tracing and Trace the path so mixed rows all match in height and the
 * space between rows is always the same.
 */
export function traceBandHalf(rowSpacing: number): number {
  return Math.max(8, Math.min(rowSpacing * 0.27, 26));
}

export interface TraceShape {
  /** SVG path data. Straight sides are separate subpaths so the dot pattern restarts at each corner. */
  d: string;
  /** strokeDasharray that turns the path into round dots. */
  dash: string;
  /** Where the start dot and finish marker sit (some shapes begin on the band's edge). */
  startY: number;
  endY: number;
}

const dashFor = (gap: number) => `0.1,${Math.max(1, gap - 0.1).toFixed(3)}`;

/** Split a length into whole dot gaps close to `target`. */
function fitGap(length: number, target: number): number {
  return length / Math.max(1, Math.round(length / target));
}

const seg = (x1: number, y1: number, x2: number, y2: number) =>
  `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
const endDot = (x: number, y: number) => `M ${x.toFixed(2)} ${y.toFixed(2)} L ${(x + 0.1).toFixed(2)} ${y.toFixed(2)}`;

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

/** Build a dotted trace shape that fits inside y - half .. y + half. */
export function generateTraceShape(
  style: LineStyle,
  startX: number,
  endX: number,
  y: number,
  half: number
): TraceShape {
  const W = endX - startX;
  const flatShape = (d: string, gap: number): TraceShape => ({ d, dash: dashFor(gap), startY: y, endY: y });

  switch (style) {
    case 'wave':
      // Three big, smooth humps so they read as waves, not zigzags.
      return flatShape(generateSmoothWave(startX, endX, y, half, 3), TRACE_DOT_GAP);

    case 'zigzag': {
      // Centre, up to a peak, down to a valley ... back to centre. A dot on every point.
      const pitch0 = Math.max(28, half * 2.2);
      const m = Math.max(3, Math.round(W / pitch0)); // number of points (peaks + valleys)
      const pitch = W / m;
      const L = Math.hypot(pitch, half * 2);
      // An even number of gaps per side puts a dot on the midline crossing too.
      const nz = Math.max(2, Math.ceil(L / 12));
      const gap = L / (nz % 2 === 0 ? nz : nz + 1);
      const parts: string[] = [];
      let x = startX;
      let cy = y;
      for (let i = 0; i < m; i++) {
        const ny = i % 2 === 0 ? y - half : y + half;
        const dx = i === 0 ? pitch / 2 : pitch;
        parts.push(seg(x, cy, x + dx, ny));
        x += dx;
        cy = ny;
      }
      parts.push(seg(x, cy, endX, y));
      parts.push(endDot(endX, y));
      return flatShape(parts.join(' '), gap);
    }

    case 'castle': {
      // Square steps centred on the line: up to the top, along, down to the bottom, along.
      const k = Math.max(1, Math.round(half / 9));
      const gap = half / k; // dots split the half-height evenly, so every corner gets one
      const flat = gap * Math.max(3, Math.round(28 / gap));
      const cycles = Math.max(2, Math.floor((W - gap * 4) / (flat * 2)));
      const lead = (W - cycles * flat * 2) / 2;
      const parts: string[] = [];
      let x = startX;
      parts.push(seg(x, y, x + lead, y));
      x += lead;
      parts.push(seg(x, y, x, y - half));
      for (let i = 0; i < cycles; i++) {
        parts.push(seg(x, y - half, x + flat, y - half));
        x += flat;
        parts.push(seg(x, y - half, x, y + half));
        parts.push(seg(x, y + half, x + flat, y + half));
        x += flat;
        parts.push(seg(x, y + half, x, i === cycles - 1 ? y : y - half));
      }
      parts.push(seg(x, y, endX, y));
      parts.push(endDot(endX, y));
      return { d: parts.join(' '), dash: dashFor(gap), startY: y, endY: y };
    }

    case 'loops': {
      // Rounded arches standing on the bottom of the band and reaching its top.
      const base = y + half;
      const n = Math.max(3, Math.round(W / Math.max(40, half * 3)));
      const w = W / n;
      const ctrl = base - (half * 2 * 4) / 3; // cubic control height for a peak at y - half
      const archLen = approxCubicLength(0, 0, w * 0.1, ctrl - base, w * 0.9, ctrl - base, w, 0);
      const gap = fitGap(archLen, TRACE_DOT_GAP * 0.85);
      const parts: string[] = [];
      for (let i = 0; i < n; i++) {
        const x0 = startX + i * w;
        parts.push(
          `M ${x0.toFixed(2)} ${base.toFixed(2)} C ${(x0 + w * 0.1).toFixed(2)} ${ctrl.toFixed(2)}, ${(x0 + w * 0.9).toFixed(2)} ${ctrl.toFixed(2)}, ${(x0 + w).toFixed(2)} ${base.toFixed(2)}`
        );
      }
      parts.push(endDot(endX, base));
      return { d: parts.join(' '), dash: dashFor(gap), startY: base, endY: base };
    }

    case 'straight':
    default:
      return flatShape(`${seg(startX, y, endX, y)} ${endDot(endX, y)}`, fitGap(W, TRACE_DOT_GAP));
  }
}

function approxCubicLength(
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number
): number {
  let len = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const yy = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    len += Math.hypot(x - px, yy - py);
    px = x;
    py = yy;
  }
  return len;
}

/** @deprecated Kept for older callers. Use generateTraceShape. */
export function generateLinePath(style: LineStyle, startX: number, endX: number, y: number, amplitude: number): string {
  return generateTraceShape(style, startX, endX, y, amplitude).d;
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
  const half = traceBandHalf(lineSpacing);

  const lines = Array.from({ length: lineCount }, (_, idx) => {
    const y = sp.contentTop + lineSpacing * (idx + 0.5);
    const effectiveStyle =
      instance.settings.lineStyle === 'mixed'
        ? (['straight', 'wave', 'zigzag', 'castle', 'loops'][idx % 5] as LineStyle)
        : lineStyle;
    return { id: idx, y, ...generateTraceShape(effectiveStyle, startX, endX, y, half) };
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

          {/* Trace line (dotted, soft grey) */}
          <path
            d={line.d}
            fill="none"
            stroke="#B6B2A6"
            strokeWidth="5"
            strokeDasharray={line.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Finish marker: cute 5-point star */}
          <path
            d={`M ${endX + 10} ${line.endY - 6} L ${endX + 12} ${line.endY - 2} L ${endX + 16} ${line.endY - 2} L ${endX + 13} ${line.endY + 1} L ${endX + 14} ${line.endY + 5} L ${endX + 10} ${line.endY + 2.5} L ${endX + 6} ${line.endY + 5} L ${endX + 7} ${line.endY + 1} L ${endX + 4} ${line.endY - 2} L ${endX + 8} ${line.endY - 2} Z`}
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
