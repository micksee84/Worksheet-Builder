/**
 * @license
 * Sunshine Brigade Worksheet Builder - Reusable Kid-Friendly Colouring Shapes
 * Crisp black line work (with white fill) perfect for 3-5 year olds to count and colour.
 */

import React from 'react';

export type ShapeType = 'stars' | 'apples' | 'hearts' | 'circles' | 'balloons' | 'flowers';

interface RenderShapeProps {
  type: ShapeType;
  cx: number;
  cy: number;
  size: number;
}

export const KidShape: React.FC<RenderShapeProps> = ({ type, cx, cy, size }) => {
  const r = size / 2;

  switch (type) {
    case 'stars': {
      // 5-point star
      const points: string[] = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r * 0.45;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
      }
      return (
        <polygon
          points={points.join(' ')}
          fill="#FFFFFF"
          stroke="#2D2200"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      );
    }

    case 'apples': {
      // Cute apple with stem and little leaf
      return (
        <g>
          {/* Apple body */}
          <path
            d={`M ${cx} ${cy - r * 0.5} 
                C ${cx - r * 0.9} ${cy - r * 0.9}, ${cx - r * 1.1} ${cy + r * 0.3}, ${cx - r * 0.4} ${cy + r * 0.9}
                C ${cx - r * 0.1} ${cy + r * 0.8}, ${cx + r * 0.1} ${cy + r * 0.8}, ${cx + r * 0.4} ${cy + r * 0.9}
                C ${cx + r * 1.1} ${cy + r * 0.3}, ${cx + r * 0.9} ${cy - r * 0.9}, ${cx} ${cy - r * 0.5} Z`}
            fill="#FFFFFF"
            stroke="#2D2200"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Stem */}
          <path
            d={`M ${cx} ${cy - r * 0.5} Q ${cx + r * 0.2} ${cy - r * 0.95} ${cx + r * 0.3} ${cy - r * 1.05}`}
            fill="none"
            stroke="#2D2200"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Little leaf */}
          <ellipse
            cx={cx + r * 0.4}
            cy={cy - r * 0.8}
            rx={r * 0.3}
            ry={r * 0.15}
            fill="#FFFFFF"
            stroke="#2D2200"
            strokeWidth="1.8"
            transform={`rotate(-25 ${cx + r * 0.4} ${cy - r * 0.8})`}
          />
        </g>
      );
    }

    case 'hearts': {
      // Classic friendly heart
      return (
        <path
          d={`M ${cx} ${cy + r * 0.8}
              C ${cx - r * 1.2} ${cy + r * 0.1}, ${cx - r * 1.1} ${cy - r * 0.8}, ${cx} ${cy - r * 0.25}
              C ${cx + r * 1.1} ${cy - r * 0.8}, ${cx + r * 1.2} ${cy + r * 0.1}, ${cx} ${cy + r * 0.8} Z`}
          fill="#FFFFFF"
          stroke="#2D2200"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      );
    }

    case 'balloons': {
      // Balloon with string
      return (
        <g>
          <ellipse
            cx={cx}
            cy={cy - r * 0.2}
            rx={r * 0.85}
            ry={r}
            fill="#FFFFFF"
            stroke="#2D2200"
            strokeWidth="3"
          />
          {/* Knot */}
          <polygon
            points={`${cx - r * 0.2},${cy + r * 0.95} ${cx + r * 0.2},${cy + r * 0.95} ${cx},${cy + r * 0.78}`}
            fill="#2D2200"
          />
          {/* String */}
          <path
            d={`M ${cx} ${cy + r * 0.95} Q ${cx - r * 0.3} ${cy + r * 1.4} ${cx + r * 0.1} ${cy + r * 1.8}`}
            fill="none"
            stroke="#2D2200"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      );
    }

    case 'flowers': {
      // Daisy / 5-petal flower
      return (
        <g>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx={cx}
              cy={cy - r * 0.55}
              rx={r * 0.35}
              ry={r * 0.45}
              fill="#FFFFFF"
              stroke="#2D2200"
              strokeWidth="2"
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          ))}
          <circle
            cx={cx}
            cy={cy}
            r={r * 0.35}
            fill="#FFFFFF"
            stroke="#2D2200"
            strokeWidth="3"
          />
        </g>
      );
    }

    case 'circles':
    default:
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#FFFFFF"
          stroke="#2D2200"
          strokeWidth="3"
        />
      );
  }
};
