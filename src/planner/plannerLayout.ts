/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner page geometry
 *
 * Where every activity sits on a planner page, in page points, for each view. The SVG
 * drawing and the on-screen drag targets both use these boxes, so what you grab is
 * exactly what's drawn. dropTarget() turns a point on the page into a time, a day and
 * position, a list position or a side.
 */

import { DayKey, DayPart, PageSizeId, PlannerData } from '../types';
import { pageDims } from '../config/appConfig';
import { pageLayout } from '../utils/spacing';
import { bandsOn, DAY_PARTS, daysShown, PlannerDrop, STEP, visibleItems } from './plannerModel';

export interface Box { x: number; y: number; w: number; h: number }
export interface ItemBox extends Box { id: string; day?: DayKey; lane?: number; lanes?: number }

export interface PlannerGeometry {
  /** The planner's whole area on the page */
  area: Box;
  /** Day: the time column and the rows */
  timeCol?: Box;
  rowH?: number;
  /** Week: one column per day, and the band their names sit in */
  columns?: (Box & { day: DayKey; label: string })[];
  headerH?: number;
  /** Week with parts of the day: the side rail and the bands across the days */
  rail?: Box;
  bands?: (Box & { part: DayPart; label: string; icon: string })[];
  /** Checklist rows / first–then panels */
  rowBoxes?: Box[];
  panels?: (Box & { side: 'first' | 'then' })[];
  items: ItemBox[];
}

const TIME_COL = 46;
const RAIL = 30; // the week view's parts-of-the-day rail
const GAP = 6;

export function plannerGeometry(pageSize: PageSizeId, showDateName: boolean, p: PlannerData): PlannerGeometry {
  const dims = pageDims(pageSize, { planner: p });
  const layout = pageLayout(pageSize, showDateName, dims);
  const area: Box = { x: layout.left, y: layout.contentTop, w: layout.right - layout.left, h: layout.contentBottom - layout.contentTop };

  if (p.kind === 'day') {
    const rows = Math.max(1, ((p.endHour - p.startHour) * 60) / STEP);
    const rowH = area.h / rows;
    const timeCol = { x: area.x, y: area.y, w: TIME_COL, h: area.h };
    const trackX = area.x + TIME_COL + GAP;
    const trackW = area.w - TIME_COL - GAP;
    // Overlapping activities share the width in lanes, side by side
    const items = visibleItems(p);
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
    const boxes: ItemBox[] = items.map((it) => {
      const lanes = lanesIn.get(it.id) ?? 1;
      const lane = laneOf.get(it.id) ?? 0;
      const laneW = (trackW - GAP * (lanes - 1)) / lanes;
      const top = area.y + (((it.start ?? 0) - p.startHour * 60) / STEP) * rowH;
      const h = ((it.minutes ?? STEP) / STEP) * rowH;
      return { id: it.id, x: trackX + lane * (laneW + GAP), y: top + 1.5, w: laneW, h: h - 3, lane, lanes };
    });
    return { area, timeCol, rowH, items: boxes };
  }

  if (p.kind === 'week') {
    const days = daysShown(p);
    const headerH = 30;
    const banded = bandsOn(p);
    // Parts of the day: a rail down the left, shared by every day
    const railW = banded ? RAIL : 0;
    const left = area.x + (banded ? railW + GAP : 0);
    const width = area.w - (banded ? railW + GAP : 0);
    const colW = (width - GAP * (days.length - 1)) / days.length;
    const columns = days.map((d, i) => ({ x: left + i * (colW + GAP), y: area.y, w: colW, h: area.h, day: d.key, label: d.label }));
    const items: ItemBox[] = [];
    if (banded) {
      const bodyTop = area.y + headerH;
      const bandH = (area.h - headerH) / DAY_PARTS.length;
      const bands = DAY_PARTS.map((pt, i) => ({ x: area.x, y: bodyTop + i * bandH, w: area.w, h: bandH, part: pt.key, label: pt.label, icon: pt.icon }));
      // Every cell shares one card size, set by the busiest day-and-part
      const most = Math.max(1, ...columns.flatMap((c) => DAY_PARTS.map((pt) => visibleItems(p, c.day, pt.key).length)));
      const cardH = Math.min(84, (bandH - GAP * (most + 1)) / most);
      for (const col of columns) {
        for (const band of bands) {
          visibleItems(p, col.day, band.part).forEach((it, j) => {
            items.push({ id: it.id, day: col.day, x: col.x + 5, y: band.y + GAP + j * (cardH + GAP), w: col.w - 10, h: cardH });
          });
        }
      }
      return { area, columns, headerH, items, rail: { x: area.x, y: bodyTop, w: railW, h: area.h - headerH }, bands };
    }
    const most = Math.max(1, ...columns.map((c) => visibleItems(p, c.day).length));
    const listH = area.h - headerH - GAP * 2;
    const cardH = Math.min(84, (listH - GAP * (most - 1)) / most);
    for (const col of columns) {
      visibleItems(p, col.day).forEach((it, j) => {
        items.push({ id: it.id, day: col.day, x: col.x + 5, y: col.y + headerH + GAP + j * (cardH + GAP), w: col.w - 10, h: cardH });
      });
    }
    return { area, columns, headerH, items };
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
  if (p.kind === 'day') {
    const rowH = g.rowH ?? 1;
    // The pointer holds the top of the card
    const rows = Math.round((y - g.area.y) / rowH);
    const start = p.startHour * 60 + rows * STEP;
    return { kind: 'day', start: Math.max(p.startHour * 60, Math.min(start, p.endHour * 60 - minutes)) };
  }
  if (p.kind === 'week') {
    const cols = g.columns!;
    const col = cols.reduce((best, c) => (Math.abs(c.x + c.w / 2 - x) < Math.abs(best.x + best.w / 2 - x) ? c : best), cols[0]);
    if (g.bands) {
      // The band under the pointer, then the spot among that band's cards
      const band = g.bands.reduce((best, b) => (Math.abs(b.y + b.h / 2 - y) < Math.abs(best.y + best.h / 2 - y) ? b : best), g.bands[0]);
      const inCell = g.items.filter((b) => b.day === col.day && b.y >= band.y && b.y < band.y + band.h);
      const index = inCell.filter((b) => b.y + b.h / 2 < y).length;
      return { kind: 'week', day: col.day, index, part: band.part };
    }
    const inCol = g.items.filter((b) => b.day === col.day);
    const index = inCol.filter((b) => b.y + b.h / 2 < y).length;
    return { kind: 'week', day: col.day, index };
  }
  if (p.kind === 'checklist') {
    const index = g.items.filter((b) => b.y + b.h / 2 < y).length;
    return { kind: 'checklist', index };
  }
  const panels = g.panels!;
  return { kind: 'first-then', side: x < panels[1].x - 28 ? 'first' : 'then' };
}
