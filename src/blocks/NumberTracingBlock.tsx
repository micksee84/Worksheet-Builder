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
import { Instruction } from '../components/Instruction';
import { KidShape, ShapeType } from './svgShapes';

export const NumberTracingRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const num = Math.min(10, Math.max(0, Number.isFinite(Number(instance.settings.number)) ? Number(instance.settings.number) : 5));
  const shape: ShapeType = instance.settings.shape || 'stars';

  const paddingX = size === 'quarter' ? 22 : 36;
  const paddingY = size === 'quarter' ? 24 : 32;

  // Split block vertically:
  // Top section: Left = large numeral (solid & dashed) | Right = objects to count and colour
  // Bottom section: handwriting line with repeated dashed numbers
  const isQuarter = size === 'quarter';
  const topSectionHeight = height * (isQuarter ? 0.6 : 0.65);
  const bottomSectionY = topSectionHeight + paddingY * 0.4;
  const bottomSectionHeight = height - bottomSectionY - paddingY;

  // Big numerals: size and spacing scale with the number of digits, so "10"
  // never overlaps its traced copy or the shapes beside it.
  const digits = String(num).length;
  const bigFontSize = (isQuarter ? 58 : 78) * (digits > 1 ? 0.75 : 1);
  const numeralWidth = bigFontSize * 0.62 * digits; // Nunito Black digit width ~0.62em
  const solidNumeralX = paddingX + numeralWidth / 2;
  const tracedNumeralX = solidNumeralX + numeralWidth + 10;
  const numeralsRight = tracedNumeralX + numeralWidth / 2;

  // Layout for objects to count and colour:
  // Arrange in up to 2 rows of items
  const itemsAreaX = Math.max(isQuarter ? width * 0.44 : width * 0.38, numeralsRight + 14);
  const itemsAreaWidth = width - itemsAreaX - paddingX;
  // Shapes stay inside the top section, clear of the practice line below
  const itemsAreaHeight = topSectionHeight - paddingY - 28 - 8;

  const cols = Math.min(5, Math.max(2, Math.ceil(num / 2)));
  const rows = Math.max(1, Math.ceil(num / cols));
  const itemSize = Math.min(38, Math.max(18, (itemsAreaWidth / cols) * 0.7), (itemsAreaHeight / rows) * 0.8);

  const shapes = Array.from({ length: num }, (_, i) => {
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);
    const cx = itemsAreaX + (colIdx + 0.5) * (itemsAreaWidth / cols);
    const cy = paddingY + 28 + (rowIdx + 0.5) * (itemsAreaHeight / rows);
    return { id: i, cx, cy };
  });

  // Practice line repeats
  const practiceRepeats = isQuarter ? 4 : 7;
  const usableWidth = width - paddingX * 2;
  const colSpacing = usableWidth / practiceRepeats;

  return (
    <g className="number-tracing-block">
      <Instruction x={paddingX} y={paddingY - 6} cue="crayon" size={size} text={`Count, colour and trace ${num}.`} />

      {/* Left side: Large Numeral model + large dashed trace */}
      <g className="large-numerals">
        {/* Solid reference numeral */}
        <text
          x={solidNumeralX}
          y={topSectionHeight * 0.72}
          textAnchor="middle"
          fill="#2D2200"
          fontFamily="Nunito, sans-serif"
          fontSize={bigFontSize}
          fontWeight="900"
        >
          {num}
        </text>

        {/* Big numeral to trace, in Trace colour */}
        <g>
          <text
            x={tracedNumeralX}
            y={topSectionHeight * 0.72}
            textAnchor="middle"
            fill="#B6B2A6"
            fontFamily="Nunito, sans-serif"
            fontSize={bigFontSize}
            fontWeight="900"
          >
            {num}
          </text>
        </g>
      </g>

      {/* Right side: Shapes to count and colour */}
      <g className="count-shapes-container">
        {num === 0 ? (
          <text
            x={itemsAreaX + itemsAreaWidth * 0.5}
            y={paddingY + itemsAreaHeight * 0.5}
            textAnchor="middle"
            fill="#2D2200"
            fontSize="14"
            fontFamily="Nunito, sans-serif"
          >
            Zero means none.
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
                    fill="#B6B2A6"
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
  displayName: 'Number tracing and counting',
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
      label: 'Shape to count and colour',
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
