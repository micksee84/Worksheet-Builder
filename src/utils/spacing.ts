/**
 * @license
 * Sunshine Brigade Worksheet Builder - Print spacing
 *
 * One spacing unit runs the whole printed page: SPACE = 0.25 in. Pages are laid out
 * in points (72 per inch), so that is 18pt. It sets:
 *   - the margin on every edge of the page
 *   - the header area: the Name/Date line sits centred between the title and the first box
 *   - the gap from the activities to the footer rule
 *   - the gap between activity boxes
 *   - the inset inside every activity box, on all four sides
 * Tightly paired items (an instruction and the activity under it, the footer rule and
 * its text) use HALF_SPACE.
 *
 * Every gap is measured between visible edges: the outside of a stroke, the top of the
 * capital letters, the baseline of a line of text.
 */

import { PAGE_SPECS, PageSizeId } from '../config/appConfig';

/** 0.25 in, in page points. */
export const SPACE = 18;
export const HALF_SPACE = SPACE / 2;

/** Stroke widths drawn on the page. */
export const FRAME_STROKE = 2.25; // activity box border
export const RULE_STROKE = 1.5; // header and footer rules, write-on lines

/** Type on the page header and footer. */
export const TITLE_FONT_SIZE = 26; // Super Joyful ink sticker; never under 24
export const NAME_FONT_SIZE = 13;
export const FOOTER_FONT_SIZE = 9;

// Measured from the font files: both faces have capitals about 0.71 em tall.
const CAP_HEIGHT = 0.71;
// The sticker title adds an outline (3.2% all round) and a flat shadow (6% down-right).
const STICKER_OUTLINE = 0.032;
const STICKER_SHADOW = 0.06;

export interface PageLayout {
  /** Left and right edge of everything on the page (the margins). */
  left: number;
  right: number;
  titleBaseline: number;
  /** Baseline of the Name and Date labels (their write-on lines sit on it). Null when hidden. */
  nameBaseline: number | null;
  /** Centre of the header rule. */
  headerRuleY: number;
  /** Top and bottom of the activity area, for the activity box rectangles. */
  contentTop: number;
  contentBottom: number;
  /** Centre of the footer rule and the baseline of the footer text. */
  footerRuleY: number;
  footerBaseline: number;
}

/** Where everything on a page goes. Depends only on the paper size and whether Name/Date shows. */
export function pageLayout(pageSizeId: PageSizeId, showDateName = true): PageLayout {
  const spec = PAGE_SPECS[pageSizeId as keyof typeof PAGE_SPECS] || PAGE_SPECS.letter;
  const { width, height } = spec;
  const halfRule = RULE_STROKE / 2;
  const halfFrame = FRAME_STROKE / 2;

  // Header: the title, then the activities. The header area keeps the height it had when a
  // rule ran under Name/Date (title, SPACE, Name/Date, SPACE, rule, SPACE), so activities
  // never move. The rule is no longer drawn.
  const titleTop = TITLE_FONT_SIZE * (CAP_HEIGHT + STICKER_OUTLINE);
  const titleBottom = TITLE_FONT_SIZE * (STICKER_SHADOW + STICKER_OUTLINE);
  const titleBaseline = SPACE + titleTop;
  const titleRowBottom = titleBaseline + titleBottom;

  const nameCap = NAME_FONT_SIZE * CAP_HEIGHT;
  const nameRowHeight = nameCap + halfRule; // capitals down to the bottom of the write-on line
  const headerBottom = showDateName
    ? titleRowBottom + SPACE + nameRowHeight + SPACE + RULE_STROKE + SPACE
    : titleRowBottom + SPACE + RULE_STROKE + SPACE;
  const headerRuleY = headerBottom - SPACE - halfRule;
  const contentTop = headerBottom + halfFrame;

  // Name/Date sits in the middle of the gap between the title and the top of the first box.
  let nameBaseline: number | null = null;
  if (showDateName) {
    const gap = (headerBottom - titleRowBottom - nameRowHeight) / 2;
    nameBaseline = titleRowBottom + gap + nameCap;
  }

  // Footer: text SPACE from the bottom edge, its rule HALF_SPACE above it, and the
  // activities SPACE above the rule, matching the gap under the header rule.
  const footerBaseline = height - SPACE;
  const footerRuleY = footerBaseline - FOOTER_FONT_SIZE * CAP_HEIGHT - HALF_SPACE - halfRule;
  const contentBottom = footerRuleY - halfRule - SPACE - halfFrame;

  return {
    left: SPACE,
    right: width - SPACE,
    titleBaseline,
    nameBaseline,
    headerRuleY,
    contentTop,
    contentBottom,
    footerRuleY,
    footerBaseline,
  };
}

/**
 * Spacing inside an activity box, in the box's own coordinates (0,0 is the top-left of
 * its frame). Content sits SPACE in from the inside of the border on every side; the
 * instruction's picture cue starts at that line, and the activity starts HALF_SPACE
 * under the instruction.
 */
export interface BlockSpacing {
  /** Left inset; the right inset is the same, so content spans padX to width - padX. */
  padX: number;
  /** Baseline to pass to <Instruction y>. */
  instructionY: number;
  /** Where the activity itself starts and ends. */
  contentTop: number;
  contentBottom: number;
}

export function blockSpacing(size: 'full' | 'half' | 'quarter', height: number): BlockSpacing {
  const inset = SPACE + FRAME_STROKE / 2;
  // Matches <Instruction>: text size, and a cue icon 6pt taller drawn from baseline - size - 2.
  const textSize = size === 'quarter' ? 12 : 14;
  const instructionY = inset + textSize + 2;
  // Under the instruction: its descenders (about 0.25 em), then HALF_SPACE.
  const contentTop = instructionY + Math.round(textSize * 0.25) + HALF_SPACE;
  return {
    padX: inset,
    instructionY,
    contentTop,
    contentBottom: height - inset,
  };
}
