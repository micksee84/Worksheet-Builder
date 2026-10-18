/**
 * @license
 * Sunshine Brigade Worksheet Builder - Starter Block 4: Number Tracing & Counting
 * Features:
 * - A numeral (0–10) to trace
 * - That many simple shapes to count and colour
 * - Practice tracing line with guide lines
 */

import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';
import { KidShape, ShapeType } from './svgShapes';

export const NumberTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const num = Math.min(10, Math.max(0, Number(instance.settings.number) ?? 5));
  const shape: ShapeType = instance.settings.shape || 'stars';

  const paddingX = size === 'quarter' ? 22 : 36;
  const paddingY = size === 'quarter' ? 24 : 32;

  // Split block vertically:
  // Top section: Left = large numeral (solid & dashed) | Right = objects to count and color
  // Bottom section: handwriting line with repeated dashed numbers
  const isQuarter = size === 'quarter';
  const topSectionHeight = height * (isQuarter ? 0.6 : 0.65);
  const bottomSectionY = topSectionHeight + paddingY * 0.4;
  const bottomSectionHeight = height - bottomSectionY - paddingY;

  // Layout for objects to count and color:
  // Arrange in up to 2 rows of items
  const itemsAreaX = isQuarter ? width * 0.44 : width * 0.38;
  const itemsAreaWidth = width - itemsAreaX - paddingX;
  const itemsAreaHeight = topSectionHeight - paddingY;

  const cols = Math.min(5, Math.max(2, Math.ceil(num / 2)));
  const rows = num > 5 ? 2 : 1;
  const itemSize = Math.min(38, Math.max(22, (itemsAreaWidth / cols) * 0.7));

  const shapes = Array.from({ length: num }, (_, i) => {
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);
    const cx = itemsAreaX + (colIdx + 0.5) * (itemsAreaWidth / cols);
    const cy = paddingY + 28 + (rowIdx + 0.5) * (itemsAreaHeight / Math.max(rows, 1.5));
    return { id: i, cx, cy };
  });

  // Practice line repeats
  const practiceRepeats = isQuarter ? 4 : 7;
  const usableWidth = width - paddingX * 2;
  const colSpacing = usableWidth / practiceRepeats;

  return (
    <g className="number-tracing-block">
      {/* Title */}
      <text
        x={paddingX}
        y={paddingY - 6}
        fill="#2D2200"
        fontSize={isQuarter ? '12' : '14'}
        fontWeight="700"
        fontFamily="Nunito, sans-serif"
      >
        Count, color and trace: {num}
      </text>

      {/* Left side: Large Numeral model + large dashed trace */}
      <g className="large-numerals">
        {/* Solid reference numeral */}
        <text
          x={paddingX + (isQuarter ? 20 : 32)}
          y={topSectionHeight * 0.72}
          textAnchor="middle"
          fill="#2D2200"
          fontFamily="Nunito, sans-serif"
          fontSize={isQuarter ? '58' : '78'}
          fontWeight="900"
        >
          {num}
        </text>

        {/* Big dashed numeral to trace */}
        <g>
          <text
            x={paddingX + (isQuarter ? 70 : 108)}
            y={topSectionHeight * 0.72}
            textAnchor="middle"
            fill="#EFECE2"
            fontFamily="Nunito, sans-serif"
            fontSize={isQuarter ? '58' : '78'}
            fontWeight="900"
            opacity="0.7"
          >
            {num}
          </text>
          <text
            x={paddingX + (isQuarter ? 70 : 108)}
            y={topSectionHeight * 0.72}
            textAnchor="middle"
            fill="none"
            stroke="#2D2200"
            strokeWidth="2.8"
            strokeDasharray="5,4"
            strokeLinecap="round"
            fontFamily="Nunito, sans-serif"
            fontSize={isQuarter ? '58' : '78'}
            fontWeight="900"
          >
            {num}
          </text>
        </g>
      </g>

      {/* Right side: Shapes to count and color */}
      <g className="count-shapes-container">
        {num === 0 ? (
          <text
            x={itemsAreaX + itemsAreaWidth * 0.5}
            y={paddingY + itemsAreaHeight * 0.5}
            textAnchor="middle"
            fill="#6B5838"
            fontSize="14"
            fontStyle="italic"
            fontFamily="Nunito, sans-serif"
          >
            Zero means none!
          </text>
        ) : (
          shapes.map((s) => (
            <KidShape key={s.id} type={shape} cx={s.cx} cy={s.cy} size={itemSize} />
          ))
        )}
      </g>

      {/* Bottom practice handwriting line */}
      <g className="bottom-practice-row">
        <HandwritingGuideLines
          x={paddingX}
          y={bottomSectionY}
          width={usableWidth}
          lineHeight={Math.min(42, bottomSectionHeight * 0.7)}
          showDescender={false}
        />

        {Array.from({ length: practiceRepeats }).map((_, idx) => {
          const itemX = paddingX + idx * colSpacing + colSpacing * 0.5;
          const textY = bottomSectionY + Math.min(42, bottomSectionHeight * 0.7) - 3;
          const isModel = idx === 0;

          return (
            <g key={idx}>
              {isModel ? (
                <text
                  x={itemX}
                  y={textY}
                  textAnchor="middle"
                  fill="#2D2200"
                  fontFamily="Nunito, sans-serif"
                  fontSize="28"
                  fontWeight="800"
                >
                  {num}
                </text>
              ) : (
                <g>
                  <text
                    x={itemX}
                    y={textY}
                    textAnchor="middle"
                    fill="none"
                    stroke="#2D2200"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    strokeLinecap="round"
                    fontFamily="Nunito, sans-serif"
                    fontSize="28"
                    fontWeight="800"
                  >
                    {num}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Optional Character Corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const NumberTracingBlockDefinition: BlockDefinition = {
  id: 'number-tracing',
  displayName: 'Number Tracing & Counting',
  description: 'A numeral to trace plus that many simple shapes to count and colour, with line practice below.',
  category: 'numbers',
  skillTags: ['number formation', 'counting', 'one-to-one correspondence'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'number',
      label: 'Number (0 to 10)',
      type: 'number',
      min: 0,
      max: 10,
      step: 1,
      helperText: 'Numeral to practice and items to count.',
    },
    {
      key: 'shape',
      label: 'Shape to Count & Color',
      type: 'select',
      options: [
        { label: 'Stars', value: 'stars' },
        { label: 'Apples', value: 'apples' },
        { label: 'Hearts', value: 'hearts' },
        { label: 'Balloons', value: 'balloons' },
        { label: 'Flowers', value: 'flowers' },
        { label: 'Circles', value: 'circles' },
      ],
    },
  ],
  defaultSettings: {
    number: 5,
    shape: 'stars',
  },
  render: (props) => <NumberTracingRenderer {...props} />,
};
