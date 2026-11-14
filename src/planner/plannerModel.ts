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

export const STEP = 30; // minutes

/** The week view's parts of the day, top to bottom, with their side icons */
export const DAY_PARTS: { key: DayPart; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: 'ph:SunHorizon' },
  { key: 'afternoon', label: 'Afternoon', icon: 'ph:Sun' },
  { key: 'evening', label: 'Evening', icon: 'ph:Moon' },
];
export const bandsOn = (p: PlannerData) => p.kind === 'week' && p.weekBands !== false;
export const partOf = (i: PlannerItem): DayPart => i.part ?? 'morning';

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
          a('school', { day: 'mon' }), a('art', { day: 'mon', part: 'afternoon' }), a('story', { day: 'mon', part: 'evening' }),
          a('school', { day: 'tue' }), a('music', { day: 'tue', part: 'afternoon' }),
          a('school', { day: 'wed' }), a('swimming', { day: 'wed', part: 'afternoon' }), a('bath', { day: 'wed', part: 'evening' }),
          a('school', { day: 'thu' }), a('reading', { day: 'thu', part: 'afternoon' }),
          a('school', { day: 'fri' }), a('treat', { day: 'fri', part: 'evening' }),
          a('playground', { day: 'sat' }), a('bike', { day: 'sat', part: 'afternoon' }),
          a('pets', { day: 'sun' }), a('story', { day: 'sun', part: 'evening' }),
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
  if (p.kind === 'day') {
    let next = p.startHour * 60;
    items = items.map((it) => {
      const minutes = Math.max(STEP, Math.round((it.minutes ?? STEP) / STEP) * STEP);
      const start = it.start ?? next;
      next = Math.max(next, start + minutes);
      return it.start === start && it.minutes === minutes ? it : { ...it, start, minutes };
    });
  } else if (p.kind === 'week') {
    items = items.map((it) => (it.day ? it : { ...it, day: 'mon' }));
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
export function visibleItems(p: PlannerData, day?: DayKey, part?: DayPart): PlannerItem[] {
  switch (p.kind) {
    case 'day':
      return [...p.items].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    case 'week':
      return p.items.filter((i) => (i.day ?? 'mon') === day && (!part || partOf(i) === part));
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
export const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'am' : 'pm'}`;

/** Add an activity where a tap on + should put it */
export function addItem(p: PlannerData, item: PlannerItem, preferDay?: DayKey): PlannerData {
  const items = [...p.items];
  if (p.kind === 'day') {
    const end = Math.max(p.startHour * 60, ...p.items.map((i) => (i.start ?? 0) + (i.minutes ?? STEP)));
    const minutes = item.minutes ?? STEP;
    item = { ...item, start: Math.min(end, p.endHour * 60 - minutes) };
  } else if (p.kind === 'week') {
    item = { ...item, day: preferDay ?? 'mon' };
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
  | { kind: 'week'; day: DayKey; index: number; part?: DayPart }
  | { kind: 'checklist'; index: number }
  | { kind: 'first-then'; side: 'first' | 'then' };

/** Put an item (new or moved) where it was dropped */
export function placeItem(p: PlannerData, item: PlannerItem, drop: PlannerDrop): PlannerData {
  let items = p.items.filter((i) => i.id !== item.id);
  const existed = items.length !== p.items.length;
  switch (drop.kind) {
    case 'day': {
      const minutes = item.minutes ?? STEP;
      const start = Math.max(p.startHour * 60, Math.min(drop.start, p.endHour * 60 - minutes));
      items.push({ ...item, start });
      break;
    }
    case 'week': {
      // With bands, the index counts within that day's part of the day
      const sameDay = items.filter((i) => (i.day ?? 'mon') === drop.day && (!drop.part || partOf(i) === drop.part));
      const before = sameDay[drop.index];
      const placed = { ...item, day: drop.day, ...(drop.part ? { part: drop.part } : {}) };
      if (before) items.splice(items.indexOf(before), 0, placed);
      else items.push(placed);
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
