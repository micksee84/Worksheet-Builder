/**
 * @license
 * Sunshine Brigade Worksheet Builder - Bubble letter tracing
 *
 * A big bubble letter (or number) with numbered strokes, dashed guides and arrows, so a
 * child learns where each stroke starts and which way it goes. Under it, practice rows
 * on handwriting lines step down the help: a small bubble letter, then dotted letters,
 * then space to write it alone.
 *
 * Every shape comes from Sunshine Print (letterStrokes.ts) through BubbleLetter, so the
 * bubble letters always match the dotted letters and the font.
 */

import React from 'react';
import { BlockRenderProps, SettingsFieldSchema } from '../types';
import { HandwritingGuideLines } from '../components/HandwritingGuideLines';
import { CharacterCorner } from '../components/CharacterCorner';
import { Instruction } from '../components/Instruction';
import { BubbleHelpers, BubbleLetter, BubbleWeight, bubblePad, MIN_NUMBERED_HEIGHT } from '../components/BubbleLetter';
import { HandwrittenText, LETTER_GAP } from '../components/HandwrittenText';
import { blockSpacing, HALF_SPACE, SPACE } from '../utils/spacing';
import { DESCENDER_LETTERS, layoutText } from './letterStrokes';

const BUBBLE_SHARE: Record<BubbleWeight, number> = { slim: 0.15, regular: 0.2, chunky: 0.25 };

/** Letters in a bubble row sit further apart than dotted ones, so the outlines don't touch. */
const bubbleGap = (weight: BubbleWeight) => LETTER_GAP + BUBBLE_SHARE[weight] + 0.08;

type ItemKind = 'bubble' | 'dotted' | 'blank';

export const BubbleTracingRenderer: React.FC<BlockRenderProps> = ({ instance, size, width, height }) => {
  const raw = String(instance.settings.letter || 'A').charAt(0) || 'A';
  const isNumber = /\d/.test(raw);
  const upper = isNumber ? raw : raw.toUpperCase();
  const lower = isNumber ? raw : raw.toLowerCase();
  const caseMode: 'both' | 'upper' | 'lower' = isNumber ? 'upper' : instance.settings.caseMode || 'both';
  const weight: BubbleWeight = instance.settings.weight || 'regular';
  const helpers: BubbleHelpers = instance.settings.helpers || 'numbers';
  const guide: 'ink' | 'grey' = instance.settings.guide || 'ink';
  const practice: 'fade' | 'dotted' = instance.settings.practice || 'fade';

  const sp = blockSpacing(size, height);
  const padX = sp.padX;
  const usableWidth = width - padX * 2;
  const contentH = sp.contentBottom - sp.contentTop;

  const modelChars = caseMode === 'both' ? [upper, lower] : caseMode === 'upper' ? [upper] : [lower];
  const deep = modelChars.some((c) => DESCENDER_LETTERS.has(c));

  // ---- Practice rows (none in a quarter box)
  const rowTexts: string[] =
    size === 'quarter' ? [] : size === 'full' ? (caseMode === 'both' ? [upper, lower] : [modelChars[0], modelChars[0]]) : [modelChars.join('')];
  const rowSpacing = rowTexts.length ? Math.min(78, contentH * (size === 'full' ? 0.18 : 0.32)) : 0;
  const practiceH = rowTexts.length * rowSpacing;

  // ---- Big model letters: as large as the space allows
  const modelTop = sp.contentTop;
  const modelBottom = sp.contentBottom - practiceH - (practiceH ? HALF_SPACE : 0);
  const modelArea = modelBottom - modelTop;
  const share = BUBBLE_SHARE[weight];
  const gapUnits = 0.6; // between the upper and lower case bubbles
  const widthUnits = modelChars.reduce((t, c) => t + layoutText(c, 0).width, 0) + gapUnits * (modelChars.length - 1);
  const heightUnits = deep ? 1.35 : 1;
  // pad ~ share/2 * h + outline (≤ 3pt) on each side
  const hByHeight = (modelArea - 8) / (heightUnits + share);
  const hByWidth = (usableWidth - 8 * modelChars.length) / (widthUnits + share * modelChars.length);
  const bigH = Math.max(20, Math.min(size === 'full' ? 300 : 220, hByHeight, hByWidth));
  const pad = bubblePad(bigH, weight);
  const totalW = widthUnits * bigH;
  let cursor = padX + (usableWidth - totalW) / 2;
  const bigY = modelTop + (modelArea - (heightUnits * bigH + pad * 2)) / 2 + pad;
  const modelItems = modelChars.map((c) => {
    const item = { ch: c, x: cursor };
    cursor += layoutText(c, 0).width * bigH + gapUnits * bigH;
    return item;
  });

  // ---- Instruction
  const startWord = helpers === 'numbers' && bigH >= MIN_NUMBERED_HEIGHT ? 'Start at 1' : 'Start at the dot';
  const what = isNumber ? `the number ${upper}` : caseMode === 'both' ? `${upper} and ${lower}` : `the letter ${modelChars[0]}`;
  const text = size === 'quarter' ? `Trace ${what}.` : `Trace ${what}. ${startWord} and follow the arrows.`;

  return (
    <g className="bubble-tracing-block">
      <Instruction x={padX} y={sp.instructionY} cue="pencil" size={size} text={helpers === 'dots' && size !== 'quarter' ? `Trace ${what}. Start at the dot.` : text} />

      <g className="bubble-model">
        {modelItems.map((m, i) => (
          <BubbleLetter key={i} ch={m.ch} x={m.x} y={bigY} h={bigH} weight={weight} helpers={helpers} guide={guide} />
        ))}
      </g>

      {rowTexts.map((rowText, r) => {
        const rowTop = modelBottom + (practiceH ? HALF_SPACE : 0) + r * rowSpacing;
        const rowDeep = [...rowText].some((c) => DESCENDER_LETTERS.has(c));
        const lineH = Math.min(46, (rowSpacing - 6) / (rowDeep ? 1.45 : 1.2));
        const rowY = rowTop + (rowSpacing - lineH * (rowDeep ? 1.35 : 1)) / 2;
        return (
          <PracticeRow
            key={r}
            text={rowText}
            x={padX}
            y={rowY}
            h={lineH}
            width={usableWidth}
            deep={rowDeep}
            weight={weight}
            guide={guide}
            practice={practice}
          />
        );
      })}

      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

interface PracticeRowProps {
  text: string;
  x: number;
  y: number;
  h: number;
  width: number;
  deep: boolean;
  weight: BubbleWeight;
  guide: 'ink' | 'grey';
  practice: 'fade' | 'dotted';
}

/** One handwriting line: a small bubble model, then less and less help along the line. */
const PracticeRow: React.FC<PracticeRowProps> = ({ text, x, y, h, width, deep, weight, guide, practice }) => {
  const bubbleLayout = layoutText(text, bubbleGap(weight));
  const pad = bubblePad(h, weight);
  const slotW = bubbleLayout.width * h + pad * 2 + SPACE;
  const count = Math.max(2, Math.floor(width / slotW));
  const slot = width / count;
  // After the bubble: dotted copies, then space to write it alone. No black start dots
  // in the practice rows: the big letter above already shows where to start.
  const rest = count - 1;
  const blanks = practice === 'fade' && rest >= 3 ? Math.max(1, Math.floor(rest / 3)) : 0;
  const kinds: ItemKind[] = ['bubble', ...Array<ItemKind>(rest - blanks).fill('dotted'), ...Array<ItemKind>(blanks).fill('blank')];

  return (
    <g className="bubble-practice-row">
      <HandwritingGuideLines x={x} y={y} width={width} lineHeight={h} showDescender={deep} />
      {kinds.map((kind, i) => {
        const cx = x + slot * i + slot / 2;
        if (kind === 'bubble') {
          const left = cx - (bubbleLayout.width * h) / 2;
          return (
            <g key={i}>
              {bubbleLayout.items.map((it, k) => (
                <BubbleLetter key={k} ch={it.ch} x={left + it.x * h} y={y} h={h} weight={weight} helpers="arrows" guide={guide} startMarks={false} />
              ))}
            </g>
          );
        }
        if (kind === 'dotted') return <HandwrittenText key={i} text={text} x={cx} y={y} h={h} align="middle" variant="trace" startDots={false} />;
        return null;
      })}
    </g>
  );
};

/** Settings the bubble style adds to Letter tracing. */
export const BUBBLE_SETTINGS: SettingsFieldSchema[] = [
  {
    key: 'helpers',
    label: 'Stroke helpers',
    type: 'select',
    options: [
      { label: 'Numbers and arrows', value: 'numbers' },
      { label: 'Arrows only', value: 'arrows' },
      { label: 'Start dots only', value: 'dots' },
    ],
    helperText: 'Bubble style. Numbers show the order of the strokes on the big letter.',
  },
  {
    key: 'weight',
    label: 'Bubble size',
    type: 'select',
    options: [
      { label: 'Slim', value: 'slim' },
      { label: 'Regular', value: 'regular' },
      { label: 'Chunky (easier)', value: 'chunky' },
    ],
    helperText: 'Bubble style only.',
  },
  {
    key: 'guide',
    label: 'Guide dashes',
    type: 'select',
    options: [
      { label: 'Dark', value: 'ink' },
      { label: 'Light grey', value: 'grey' },
    ],
    helperText: 'Bubble style only.',
  },
  {
    key: 'practice',
    label: 'Practice rows',
    type: 'select',
    options: [
      { label: 'Fade out (dotted, then space to write alone)', value: 'fade' },
      { label: 'All dotted', value: 'dotted' },
    ],
    helperText: 'Bubble style, half and full boxes.',
  },
];

export const BUBBLE_DEFAULTS = { helpers: 'numbers', weight: 'regular', guide: 'ink', practice: 'fade' };
