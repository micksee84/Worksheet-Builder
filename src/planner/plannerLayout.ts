/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner page geometry
 *
 * Where every activity sits on a planner page, in page points, for each view. The SVG
 * drawing and the on-screen drag targets both use these boxes, so what you grab is
 * exactly what's drawn. dropTarget() turns a point on the page into a time, a day and
 * position, a list position or a side.
 */

import { DayKey, PageSizeId, PlannerData, PlannerItem } from '../types';
import { pageDims } from '../config/appConfig';
import { pageLayout } from '../utils/spacing';
import { canJoin, daysShown, MAX_MINUTES, PlannerDrop, STEP, tasksOf, visibleItems } from './plannerModel';

export interface Box { x: number; y: number; w: number; h: number }
export interface ItemBox extends Box { id: string; day?: DayKey; lane?: number; lanes?: number }

/** How far below the pointer a dragged card's top sits, in page points */
export const GRAB_TOP = 8;

/** Room at the right of a daily routine card for its time (7:00–7:15) */
export const TIME_W = 62;

/**
 * A block's tasks side by side inside its card: one cell each, leaving room for the time
 * at the right. Drawing and the on-screen handles both use these.
 */
export function blockCells(b: Box, n: number, showTimes: boolean): Box[] {
  const pad = 4;
  const left = b.x + pad;
  const width = b.w - pad * 2 - (showTimes ? TIME_W : 0);
  const gap = 4;
  const w = (width - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: left + i * (w + gap), y: b.y + 2, w, h: b.h - 4 }));
}

export interface PlannerGeometry {
  /** The planner's whole area on the page */
  area: Box;
  /** Day: the column of start times down the left */
  timeCol?: Box;
  /** Day and week: a card's height for a length in minutes (your 15-minute and 3-hour sizes, scaled to fit) */
  heightFor?: (minutes: number) => number;
  /** Day and week: where the schedule starts (below the week's day names) */
  trackTop?: number;
  /** Week: one column per day, and the band their names sit in */
  columns?: (Box & { day: DayKey; label: string })[];
  headerH?: number;
  /** Checklist rows / first–then panels */
  rowBoxes?: Box[];
  panels?: (Box & { side: 'first' | 'then' })[];
  items: ItemBox[];
}

const TIME_COL = 46;
const GAP = 6;

/**
 * Card sizes for the day and week schedules, in page points: how tall 15 minutes and
 * 3 hours are (Mick's sample cards). Every length keeps that same scale, so longer
 * activities (up to MAX_MINUTES, 7 hours) grow past the 3-hour card in proportion. The week's columns are narrow,
 * so its short cards are taller (room for the picture over the words).
 */
export const CARD_SIZES = {
  day: { min: 25, max: 125 },
  week: { min: 35, max: 95 },
} as const;
/** Space between two activities that follow straight on, and for free time between them */
const NEXT_GAP = 4;
const FREE_GAP = 14;

/** A stacked schedule: cards in time order, each as tall as its length allows */
function stack(items: PlannerItem[], top: number, x: number, w: number, heightFor: (m: number) => number, k: number, day?: DayKey): ItemBox[] {
  let y = top;
  let end: number | null = null;
  return items.map((it) => {
    if (end !== null) y += ((it.start ?? 0) > end ? FREE_GAP : NEXT_GAP) * k;
    const h = heightFor(it.minutes ?? STEP);
    const box = { id: it.id, day, x, y, w, h };
    y += h;
    end = (it.start ?? 0) + (it.minutes ?? STEP);
    return box;
  });
}

/** How tall a stack is at full size */
function stackHeight(items: PlannerItem[], size: { min: number; max: number }): number {
  let total = 0;
  let end: number | null = null;
  for (const it of items) {
    if (end !== null) total += (it.start ?? 0) > end ? FREE_GAP : NEXT_GAP;
    total += sized(it.minutes ?? STEP, size);
    end = (it.start ?? 0) + (it.minutes ?? STEP);
  }
  return total;
}

/** The length the "max" card size was set for */
const REF_MINUTES = 180;
const sized = (m: number, size: { min: number; max: number }) =>
  size.min + ((Math.max(STEP, Math.min(MAX_MINUTES, m)) - STEP) / (REF_MINUTES - STEP)) * (size.max - size.min);

export function plannerGeometry(pageSize: PageSizeId, showDateName: boolean, p: PlannerData): PlannerGeometry {
  const dims = pageDims(pageSize, { planner: p });
  const layout = pageLayout(pageSize, showDateName, dims);
  const area: Box = { x: layout.left, y: layout.contentTop, w: layout.right - layout.left, h: layout.contentBottom - layout.contentTop };

  if (p.kind === 'day' || p.kind === 'week') {
    // A schedule: cards stacked in time order, sized by length. A full day that would run
    // off the page shrinks everything by the same amount, so sizes stay comparable.
    const size = CARD_SIZES[p.kind];
    if (p.kind === 'day') {
      const top = area.y;
      const timeCol = { x: area.x, y: top, w: TIME_COL, h: area.h };
      const list = visibleItems(p);
      const k = Math.min(1, area.h / Math.max(1, stackHeight(list, size)));
      const heightFor = (m: number) => sized(m, size) * k;
      const x = area.x + TIME_COL + GAP;
      return { area, timeCol, heightFor, trackTop: top, items: stack(list, top, x, area.w - TIME_COL - GAP, heightFor, k) };
    }
    const headerH = 30;
    const top = area.y + headerH + GAP;
    const days = daysShown(p);
    const colW = (area.w - GAP * (days.length - 1)) / days.length;
    const columns = days.map((d, i) => ({ x: area.x + i * (colW + GAP), y: area.y, w: colW, h: area.h, day: d.key, label: d.label }));
    const avail = area.h - headerH - GAP * 2;
    const k = Math.min(1, ...columns.map((c) => avail / Math.max(1, stackHeight(visibleItems(p, c.day), size))));
    const heightFor = (m: number) => sized(m, size) * k;
    const items = columns.flatMap((c) => stack(visibleItems(p, c.day), top, c.x + 4, c.w - 8, heightFor, k, c.day));
    return { area, heightFor, trackTop: top, columns, headerH, items };
  }

  if (p.kind === 'checklist') {
    const list = visibleItems(p);
    const rows = Math.max(list.length, 6);
    const rowH = Math.min(88, (area.h - GAP * (rows - 1)) / rows);
    const rowBoxes = Array.from({ length: rows }, (_, i) => ({ x: area.x, y: area.y + i * (rowH + GAP), w: area.w, h: rowH }));
    return { area, rowBoxes, items: list.map((it, i) => ({ id: it.id, ...rowBoxes[i] })) };
  }

  // First–then: two big panels with an arrow between them
  const arrowW = 56;
  const panelW = (area.w - arrowW) / 2;
  const panels = [
    { x: area.x, y: area.y, w: panelW, h: area.h, side: 'first' as const },
    { x: area.x + panelW + arrowW, y: area.y, w: panelW, h: area.h, side: 'then' as const },
  ];
  const items = visibleItems(p).map((it) => {
    const panel = panels.find((pn) => pn.side === it.side)!;
    return { id: it.id, x: panel.x, y: panel.y, w: panel.w, h: panel.h };
  });
  return { area, panels, items };
}

/** What dropping at (x, y) in page points means. `grabOffsetY` keeps a moved card's top where it was grabbed. */
export function dropTarget(g: PlannerGeometry, p: PlannerData, x: number, y: number, minutes = STEP, movingId?: string): PlannerDrop {
  if (p.kind === 'day' || p.kind === 'week') {
    // Between the cards: before the first card whose middle is below the pointer.
    // It starts when the card above it ends (or just before the first one); anything
    // it runs into slides later.
    let day: DayKey | undefined;
    if (p.kind === 'week') {
      const cols = g.columns!;
      day = cols.reduce((best, c) => (Math.abs(c.x + c.w / 2 - x) < Math.abs(best.x + best.w / 2 - x) ? c : best), cols[0]).day;
    }
    // The card being moved doesn't count: it's leaving its old spot
    const list = visibleItems(p, day).filter((it) => it.id !== movingId);
    const boxes = new Map(g.items.map((b) => [b.id, b]));
    // Daily routine: over the middle of a card (not its top or bottom edge), it joins
    // that card's block, if there's room for it
    if (p.kind === 'day') {
      const moving = movingId ? p.items.find((i) => i.id === movingId) : undefined;
      const count = moving ? tasksOf(moving).length : 1;
      const over = list.find((it) => {
        const b = boxes.get(it.id);
        if (!b) return false;
        const edge = Math.min(8, b.h * 0.25);
        // y is where the dragged card's top would go; the pointer is GRAB_TOP below it
        const py = y + GRAB_TOP;
        return py > b.y + edge && py < b.y + b.h - edge && canJoin(it, count);
      });
      if (over) {
        // Which gap between the tasks: past the middle of a task means after it
        const b = boxes.get(over.id)!;
        const cells = blockCells(b, tasksOf(over).length, p.showTimes);
        const at = cells.filter((c) => x > c.x + c.w / 2).length;
        return { kind: 'day', start: over.start ?? 0, join: over.id, at };
      }
    }
    const next = list.findIndex((it) => {
      const b = boxes.get(it.id);
      return b && b.y + b.h / 2 > y;
    });
    const before = next === -1 ? list[list.length - 1] : list[next - 1];
    const after = next === -1 ? undefined : list[next];
    const start = before
      ? (before.start ?? 0) + (before.minutes ?? STEP)
      : after
      ? Math.max(p.startHour * 60, (after.start ?? 0) - minutes)
      : p.startHour * 60;
    const clamped = Math.max(p.startHour * 60, Math.min(start, p.endHour * 60 - minutes));
    return day ? { kind: 'week', day, start: clamped } : { kind: 'day', start: clamped };
  }
  if (p.kind === 'checklist') {
    const index = g.items.filter((b) => b.y + b.h / 2 < y).length;
    return { kind: 'checklist', index };
  }
  const panels = g.panels!;
  return { kind: 'first-then', side: x < panels[1].x - 28 ? 'first' : 'then' };
}
