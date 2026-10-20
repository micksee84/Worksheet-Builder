/**
 * @license
 * Sunshine Brigade Worksheet Builder
 * HandwritingGuideLines: Standard 3-line preschool handwriting rules:
 * - Top headline (solid, thin)
 * - Midline (dashed, for lowercase letters)
 * - Baseline (solid, bold)
 * - Optional descender line (for letters like g, j, p, q, y)
 */

import React from 'react';

interface HandwritingGuideLinesProps {
  x: number;
  y: number;
  width: number;
  lineHeight: number;
  showDescender?: boolean;
  strokeColor?: string;
  dashedColor?: string;
  baselineColor?: string;
}

export const HandwritingGuideLines: React.FC<HandwritingGuideLinesProps> = ({
  x,
  y,
  width,
  lineHeight,
  showDescender = false,
  // Ink Style: guide lines in Trace colour, the baseline in Ink so letters have a clear floor.
  strokeColor = '#B6B2A6',
  dashedColor = '#B6B2A6',
  baselineColor = '#2D2200',
}) => {
  const topY = y;
  const midY = y + lineHeight * 0.5;
  const baseY = y + lineHeight;
  const descenderY = y + lineHeight * 1.35;

  return (
    <g className="handwriting-guidelines" pointerEvents="none">
      {/* Top headline */}
      <line
        x1={x}
        y1={topY}
        x2={x + width}
        y2={topY}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Midline - dashed */}
      <line
        x1={x}
        y1={midY}
        x2={x + width}
        y2={midY}
        stroke={dashedColor}
        strokeWidth="1.5"
        strokeDasharray="4,4"
        strokeLinecap="round"
      />
      {/* Baseline */}
      <line
        x1={x}
        y1={baseY}
        x2={x + width}
        y2={baseY}
        stroke={baselineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Descender line if requested */}
      {showDescender && (
        <line
          x1={x}
          y1={descenderY}
          x2={x + width}
          y2={descenderY}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeDasharray="4,4"
          strokeLinecap="round"
        />
      )}
    </g>
  );
};
