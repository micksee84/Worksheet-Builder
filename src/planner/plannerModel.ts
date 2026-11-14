/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner model
 *
 * A planner page keeps every field on every item (start time, length, day, side), so
 * switching between Day, Week, Checklist and First–then never loses anything: each view
 * reads the fields it needs and fills sensible defaults for the rest.
 */

import { DayKey, Page, PlannerData, PlannerItem, PlannerKind, DayPart } from '../types';
import { ACTIVITIES, getActivity } from './activities';

export const WEEK: { key: DayKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

export const KIND_LABELS: Record<PlannerKind, { label: string; title: string; blurb: string }> = {
  day: { label: 'Day', title: 'My day', blurb: 'A picture timeline of the day, from wake up to bedtime.' },
  week: { label: 'Week', title: 'My week', blurb: 'What happens each day of the week, in pictures.' },
  checklist: { label: 'Checklist', title: 'My morning', blurb: 'Steps or things to tick off: getting ready, or packing for a trip.' },
  'first-then': { label: 'First–then', title: 'First, then', blurb: 'One thing to do first, then the reward. Big pictures.' },
};

/** The planner's time unit: every start time and length moves in 15-minute steps */
export const STEP = 15; // minutes
/** The longest an activity can be, and the tallest its card gets */
export const MAX_MINUTES = 180;
/** Round a length to the time unit, between 15 minutes and 3 hours */
export const clampLength = (m: number | undefined) => Math.max(STEP, Math.min(MAX_MINUTES, Math.round((m ?? 30) / STEP) * STEP));

/**
 * Parts of the day, marked on the time rail of the day and week views with a small icon
 * where each begins (black and white, so it suits the Ink Style). `from` is the hour.
 */
export const DAY_PARTS: { key: DayPart; label: string; icon: string; from: number }[] = [
  { key: 'morning', label: 'Morning', icon: 'ph:SunHorizon', from: 0 },
  { key: 'afternoon', label: 'Afternoon', icon: 'ph:Sun', from: 12 },
  { key: 'evening', label: 'Evening', icon: 'ph:Moon', from: 17 },
];
/** Week plans saved with morning / afternoon / evening bands start their activities at these hours */
const PART_START: Record<DayPart, number> = { morning: 9 * 60, afternoon: 13 * 60, evening: 18 * 60 };
/** True for the views laid out on a timeline */
export const timed = (p: PlannerData) => p.kind === 'day' || p.kind === 'week';

let counter = 0;
export const newItemId = () => `pi_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export function itemFromActivity(activityId: string, extra: Partial<PlannerItem> = {}): PlannerItem {
  const a = getActivity(activityId) ?? ACTIVITIES[0];
  return { id: newItemId(), label: a.label, picture: a.picture, minutes: a.minutes, ...extra };
}

const at = (h: number, m = 0) => h * 60 + m;

/** An example of each kind of planner: shown in "What are you making?" and by Reset example */
export function samplePlanner(kind: PlannerKind): PlannerData {
  const base = { kind, startHour: 7, endHour: 20, showTimes: true, weekdaysOnly: false, showTicks: kind === 'checklist' };
  const a = itemFromActivity;
  switch (kind) {
    case 'day':
      return {
        ...base,
        items: [
          a('wake-up', { start: at(7) }),
          a('get-dressed', { start: at(7, 30) }),
          a('breakfast', { start: at(8) }),
          a('brush-teeth', { start: at(8, 30) }),
          a('school', { start: at(9), minutes: 180 }),
          a('lunch', { start: at(12) }),
          a('outside', { start: at(13), minutes: 90 }),
          a('snack', { start: at(15) }),
          a('free-play', { start: at(15, 30), minutes: 90 }),
          a('dinner', { start: at(17, 30) }),
          a('bath', { start: at(18, 30) }),
          a('story', { start: at(19) }),
          a('bedtime', { start: at(19, 30) }),
        ],
      };
    case 'week':
      return {
        ...base,
        items: [
          a('school', { day: 'mon', start: at(9) }), a('art', { day: 'mon', start: at(13) }), a('story', { day: 'mon', start: at(19) }),
          a('school', { day: 'tue', start: at(9) }), a('music', { day: 'tue', start: at(14) }),
          a('school', { day: 'wed', start: at(9) }), a('swimming', { day: 'wed', start: at(15) }), a('bath', { day: 'wed', start: at(18, 30) }),
          a('school', { day: 'thu', start: at(9) }), a('reading', { day: 'thu', start: at(13, 30) }),
          a('school', { day: 'fri', start: at(9) }), a('treat', { day: 'fri', start: at(16) }),
          a('playground', { day: 'sat', start: at(10) }), a('bike', { day: 'sat', start: at(14) }),
          a('pets', { day: 'sun', start: at(9) }), a('story', { day: 'sun', start: at(19) }),
        ],
      };
    case 'checklist':
      return {
        ...base,
        items: ['wake-up', 'get-dressed', 'breakfast', 'brush-teeth', 'shoes-on', 'pack-bag'].map((id) => a(id)),
      };
    case 'first-then':
      return { ...base, items: [a('tidy', { side: 'first' }), a('playground', { side: 'then' })] };
  }
}

/** A new planner page of a kind. `chosen: false` shows the start screen to pick the type. */
export function createPlannerPage(kind: PlannerKind, pageNumber: number, chosen = true): Page {
  return {
    id: `page_${Date.now()}_${pageNumber}`,
    title: KIND_LABELS[kind].title,
    layout: '1-full',
    slots: [],
    showDateName: false,
    // Starts empty: the grown-up adds the activities
    planner: { ...samplePlanner(kind), items: [], kindChosen: chosen },
  };
}

export const daysShown = (p: PlannerData) => (p.weekdaysOnly ? WEEK.slice(0, 5) : WEEK);

/**
 * Fill in what a view needs, keeping everything else. Day: items without a time follow
 * on from the one before. Week: items without a day go on Monday. First–then: if
 * neither side is set, the first two items take them.
 */
export function normalize(p: PlannerData): PlannerData {
  let items = p.items;
  if (p.kind === 'day' || p.kind === 'week') {
    // Every activity gets a length in 15-minute steps (at most 3 hours) and a start time.
    // One without a time follows on from the one before it on the same day; a week
    // activity saved with a part of the day starts in that part.
    const next: Record<string, number> = {};
    items = items.map((it) => {
      const day = p.kind === 'week' ? it.day ?? 'mon' : 'all';
      const minutes = clampLength(it.minutes);
      const from = it.part ? Math.max(PART_START[it.part], next[day] ?? 0) : next[day] ?? p.startHour * 60;
      const raw = it.start ?? from;
      const start = Math.max(p.startHour * 60, Math.min(Math.round(raw / STEP) * STEP, p.endHour * 60 - minutes));
      next[day] = Math.max(next[day] ?? p.startHour * 60, start + minutes);
      const done = it.start === start && it.minutes === minutes && (p.kind === 'day' || it.day === day) && !it.part;
      if (done) return it;
      const { part: _part, ...rest } = it;
      return { ...rest, start, minutes, ...(p.kind === 'week' ? { day: day as DayKey } : {}) };
    });
  } else if (p.kind === 'first-then') {
    const hasFirst = items.some((i) => i.side === 'first');
    const hasThen = items.some((i) => i.side === 'then');
    if (!hasFirst || !hasThen) {
      const free = items.filter((i) => !i.side);
      items = items.map((it) => {
        if (!hasFirst && it === free[0]) return { ...it, side: 'first' as const };
        if (!hasThen && it === free[hasFirst ? 0 : 1]) return { ...it, side: 'then' as const };
        return it;
      });
    }
  }
  return items === p.items ? p : { ...p, items };
}

/** Switch view: the same activities, laid out the new way */
export function switchKind(p: PlannerData, kind: PlannerKind): PlannerData {
  const next = normalize({ ...p, kind, kindChosen: true, showTicks: kind === 'checklist' ? true : p.showTicks });
  return next;
}

/** Items a view actually draws, in drawing order */
export function visibleItems(p: PlannerData, day?: DayKey): PlannerItem[] {
  switch (p.kind) {
    case 'day':
      return [...p.items].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    case 'week':
      return p.items.filter((i) => (i.day ?? 'mon') === day).sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    case 'checklist':
      return p.items;
    case 'first-then':
      return (['first', 'then'] as const).map((s) => p.items.find((i) => i.side === s)).filter(Boolean) as PlannerItem[];
  }
}

export const timeLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')}`;
};
/** An activity's length: 30 min, 1 h, 1 h 30 */
export const lengthLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`);
export const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'am' : 'pm'}`;

/** Add an activity where a tap on + should put it */
export function addItem(p: PlannerData, item: PlannerItem, preferDay?: DayKey): PlannerData {
  const items = [...p.items];
  if (p.kind === 'day' || p.kind === 'week') {
    // After the last activity (that day, on the week)
    const day = preferDay ?? 'mon';
    const same = p.kind === 'week' ? p.items.filter((i) => (i.day ?? 'mon') === day) : p.items;
    const end = Math.max(p.startHour * 60, ...same.map((i) => (i.start ?? 0) + (i.minutes ?? STEP)));
    const minutes = clampLength(item.minutes);
    item = { ...item, minutes, start: Math.min(end, p.endHour * 60 - minutes), ...(p.kind === 'week' ? { day } : {}) };
  } else if (p.kind === 'first-then') {
    const first = items.find((i) => i.side === 'first');
    const then = items.find((i) => i.side === 'then');
    const side = !first ? 'first' : 'then';
    if (side === 'then' && then) items.splice(items.indexOf(then), 1);
    item = { ...item, side };
  }
  items.push(item);
  return { ...p, items };
}

/** Where a drop lands, worked out by the layout (see plannerLayout.dropTarget) */
export type PlannerDrop =
  | { kind: 'day'; start: number }
  | { kind: 'week'; day: DayKey; start: number }
  | { kind: 'checklist'; index: number }
  | { kind: 'first-then'; side: 'first' | 'then' };

/** Put an item (new or moved) where it was dropped */
export function placeItem(p: PlannerData, item: PlannerItem, drop: PlannerDrop): PlannerData {
  let items = p.items.filter((i) => i.id !== item.id);
  const existed = items.length !== p.items.length;
  switch (drop.kind) {
    case 'day':
    case 'week': {
      const minutes = clampLength(item.minutes);
      const start = Math.max(p.startHour * 60, Math.min(drop.start, p.endHour * 60 - minutes));
      const { part: _part, ...rest } = item;
      items.push({ ...rest, minutes, start, ...(drop.kind === 'week' ? { day: drop.day } : {}) });
      break;
    }
    case 'checklist': {
      items.splice(Math.min(drop.index, items.length), 0, item);
      break;
    }
    case 'first-then': {
      const other = drop.side === 'first' ? 'then' : 'first';
      const occupant = items.find((i) => i.side === drop.side);
      if (occupant) {
        // Moving across: swap the two. A new activity replaces what was there.
        if (existed && item.side === other) items = items.map((i) => (i === occupant ? { ...i, side: other } : i));
        else items = items.filter((i) => i !== occupant);
      }
      items.push({ ...item, side: drop.side });
      break;
    }
  }
  return { ...p, items };
}
