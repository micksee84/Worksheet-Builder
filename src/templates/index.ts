/**
 * @license
 * Sunshine Brigade Worksheet Builder - Template Gallery Registry
 */

import { Worksheet } from '../types';
import tracingLinesJson from './tracingLinesWarmUp.json';
import letterAPracticeJson from './letterAPractice.json';
import countingTo5Json from './countingTo5.json';
import linesAndCurvesPackJson from './linesAndCurvesPack.json';

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  worksheet: Worksheet;
}

export const PREMADE_TEMPLATES: TemplateItem[] = [
  {
    id: 'lines-and-curves-pack',
    title: 'Lines and curves',
    description: 'Eight pages of pre-writing practice with Finn the fox, from straight lines to loops, plus an "I did it!" page.',
    category: 'Pre-writing',
    tags: ['pre-writing', 'fine motor', 'free pack', 'ages 3-5'],
    worksheet: linesAndCurvesPackJson as unknown as Worksheet,
  },
  {
    id: 'tracing-lines-warm-up',
    title: 'Tracing Lines Warm-Up',
    description: 'Gentle pre-writing curves, zigzags, and waves to build fine-motor pencil control.',
    category: 'Pre-writing',
    tags: ['motor skills', 'warm-up', 'ages 3-4'],
    worksheet: tracingLinesJson as unknown as Worksheet,
  },
  {
    id: 'letter-a-practice',
    title: 'Letter A Practice',
    description: 'Letter tracing with guide lines plus an open drawing & writing space for letter A vocabulary.',
    category: 'Alphabet',
    tags: ['phonics', 'alphabet', 'ages 3-5'],
    worksheet: letterAPracticeJson as unknown as Worksheet,
  },
  {
    id: 'counting-to-5',
    title: 'Counting to 5',
    description: 'Early numeracy practice: numeral tracing with stars to colour, plus an apple counting challenge.',
    category: 'Numbers',
    tags: ['counting', 'math', 'ages 3-5'],
    worksheet: countingTo5Json as unknown as Worksheet,
  },
];

export function getAllTemplates(): TemplateItem[] {
  return PREMADE_TEMPLATES;
}

export function getTemplateById(id: string): TemplateItem | undefined {
  return PREMADE_TEMPLATES.find((t) => t.id === id);
}
