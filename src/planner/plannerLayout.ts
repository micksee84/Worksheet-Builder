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
import { daysShown, PlannerDrop, STEP, visibleItems } from './plannerModel';

export interface Box { x: number; y: number; w: number; h: number }
export interface ItemBox extends Box { id: string; day?: DayKey; lane?: number; lanes?: number }

export interface PlannerGeometry {
  /** The planner's whole area on the page */
  area: Box;
  /** Day and week: the time column, and the height of one 15-minute step */
  timeCol?: Box;
  rowH?: number;
  /** Day and week: where the timeline itself starts (below the week's day names) */
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
 * Boxes for activities on a timeline: each one as tall as its length, starting at its
 * time. Activities that overlap share the width side by side, in lanes.
 */
function laneBoxes(items: PlannerItem[], startHour: number, top: number, rowH: number, x: number, w: number, gap: number): ItemBox[] {
  const laneOf = new Map<string, number>();
  const laneEnds: number[] = [];
  const groups: string[][] = [];
  let groupEnd = -1;
  for (const it of items) {
    const s = it.start ?? 0;
    const e = s + (it.minutes ?? STEP);
    if (s >= groupEnd) {
      groups.push([]);
      laneEnds.length = 0;
    }
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = e;
    laneOf.set(it.id, lane);
    groups[groups.length - 1].push(it.id);
    groupEnd = Math.max(groupEnd, e);
  }
  const lanesIn = new Map<string, number>();
  for (const g of groups) {
    const n = Math.max(...g.map((id) => laneOf.get(id)!)) + 1;
    g.forEach((id) => lanesIn.set(id, n));
  }
  return items.map((it) => {
    const lanes = lanesIn.get(it.id) ?? 1;
    const lane = laneOf.get(it.id) ?? 0;
    const laneW = (w - gap * (lanes - 1)) / lanes;
    const y = top + (((it.start ?? 0) - startHour * 60) / STEP) * rowH;
    const h = ((it.minutes ?? STEP) / STEP) * rowH;
    return { id: it.id, x: x + lane * (laneW + gap), y: y + 1, w: laneW, h: h - 2, lane, lanes };
  });
}

export function plannerGeometry(pageSize: PageSizeId, showDateName: boolean, p: PlannerData): PlannerGeometry {
  const dims = pageDims(pageSize, { planner: p });
  const layout = pageLayout(pageSize, showDateName, dims);
  const area: Box = { x: layout.left, y: layout.contentTop, w: layout.right - layout.left, h: layout.contentBottom - layout.contentTop };

  if (p.kind === 'day' || p.kind === 'week') {
    // One timeline for both: hours down the left, every 15 minutes the same height.
    // The week puts the day names along the top and a column for each day.
    const headerH = p.kind === 'week' ? 30 : 0;
    const top = area.y + headerH;
    const rows = Math.max(1, ((p.endHour - p.startHour) * 60) / STEP);
    const rowH = (area.h - headerH) / rows;
    const timeCol = { x: area.x, y: top, w: TIME_COL, h: area.h - headerH };
    const trackX = area.x + TIME_COL + GAP;
    const trackW = area.w - TIME_COL - GAP;
    const boxFor = (list: PlannerItem[], x: number, w: number, day?: DayKey) =>
      laneBoxes(list, p.startHour, top, rowH, x, w, p.kind === 'week' ? 3 : GAP).map((b) => ({ ...b, day }));
    if (p.kind === 'day') {
      return { area, timeCol, rowH, trackTop: top, items: boxFor(visibleItems(p), trackX, trackW) };
    }
    const days = daysShown(p);
    const colW = (trackW - GAP * (days.length - 1)) / days.length;
    const columns = days.map((d, i) => ({ x: trackX + i * (colW + GAP), y: area.y, w: colW, h: area.h, day: d.key, label: d.label }));
    const items = columns.flatMap((c) => boxFor(visibleItems(p, c.day), c.x + 3, c.w - 6, c.day));
    return { area, timeCol, rowH, trackTop: top, columns, headerH, items };
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
export function dropTarget(g: PlannerGeometry, p: PlannerData, x: number, y: number, minutes = STEP): PlannerDrop {
  if (p.kind === 'day' || p.kind === 'week') {
    // The pointer holds the top of the card; snap to the nearest 15 minutes
    const rowH = g.rowH ?? 1;
    const rows = Math.round((y - (g.trackTop ?? g.area.y)) / rowH);
    const start = Math.max(p.startHour * 60, Math.min(p.startHour * 60 + rows * STEP, p.endHour * 60 - minutes));
    if (p.kind === 'day') return { kind: 'day', start };
    const cols = g.columns!;
    const col = cols.reduce((best, c) => (Math.abs(c.x + c.w / 2 - x) < Math.abs(best.x + best.w / 2 - x) ? c : best), cols[0]);
    return { kind: 'week', day: col.day, start };
  }
  if (p.kind === 'checklist') {
    const index = g.items.filter((b) => b.y + b.h / 2 < y).length;
    return { kind: 'checklist', index };
  }
  const panels = g.panels!;
  return { kind: 'first-then', side: x < panels[1].x - 28 ? 'first' : 'then' };
}
