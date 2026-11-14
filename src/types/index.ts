/**
 * @license
 * Sunshine Brigade Worksheet Builder - Type Definitions
 */

import React from 'react';
import { PageSizeId, CharacterId } from '../config/appConfig';
export type { PageSizeId, CharacterId };

export type BlockCategory =
  | 'pre-writing'
  | 'letters'
  | 'numbers'
  | 'thinking'
  | 'feelings'
  | 'world'
  | 'creative';

export type BlockSize = 'full' | 'half' | 'quarter';

export type PageLayoutPreset =
  | '1-full'
  | '2-half'
  | '4-quarter'
  | 'top-half-2-quarter'
  | '2-quarter-bottom-half';

export interface SettingsFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface SettingsFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'slider';
  options?: SettingsFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  placeholder?: string;
  /** Only show this setting while another setting has this value. */
  showWhen?: { key: string; value: string | number | boolean };
}

export type CharacterCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface BlockCharacterConfig {
  id: CharacterId;
  corner: CharacterCorner;
}

export interface BlockInstance {
  instanceId: string;
  blockId: string; // References BlockDefinition.id
  settings: Record<string, any>;
  character?: BlockCharacterConfig | null;
}

export interface BlockRenderProps {
  instance: BlockInstance;
  size: BlockSize;
  width: number; // Viewport width in SVG units
  height: number; // Viewport height in SVG units
  isSelected?: boolean;
}

export interface BlockDefinition {
  id: string;
  displayName: string;
  description: string;
  category: BlockCategory;
  skillTags: string[];
  ageRange: string; // e.g. "3-5", "3-4", "4-5"
  allowedSizes: BlockSize[];
  settingsSchema: SettingsFieldSchema[];
  defaultSettings: Record<string, any>;
  render: (props: BlockRenderProps) => React.ReactNode;
}

export interface Slot {
  id: string;
  size: BlockSize;
  label: string; // e.g. "Top Half", "Bottom Left"
  block: BlockInstance | null;
}

export interface Page {
  id: string;
  title: string;
  layout: PageLayoutPreset;
  slots: Slot[];
  showDateName: boolean;
  /** A planner page (routine, week, checklist, first–then) instead of activity slots. */
  planner?: PlannerData;
}

// ---------- Planner pages ----------
export type PlannerKind = 'day' | 'week' | 'checklist' | 'first-then';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** The week view's bands, down the side */
export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Another task done in the same block of time as its card's own (daily routine) */
export interface GroupTask {
  id: string;
  label: string;
  picture: string;
}

export interface PlannerItem {
  id: string;
  label: string;
  /** Picture library name */
  picture: string;
  /** Day and week views: start time, minutes after midnight */
  start?: number;
  /** Day and week views: how long, in minutes (15-minute steps, at most 3 hours) */
  minutes?: number;
  /** Week view: which day; items keep their order in the list */
  day?: DayKey;
  /** Week plans saved with morning / afternoon / evening bands: which one. Opening the
   *  plan turns it into a start time in that part of the day. */
  part?: DayPart;
  /** First–then: which side */
  side?: 'first' | 'then';
  /** Daily routine: more tasks in this card's block, shown side by side (up to 3 more) */
  also?: GroupTask[];
}

export interface PlannerData {
  kind: PlannerKind;
  /** Day view hours shown, e.g. 7 to 20 */
  startHour: number;
  endHour: number;
  showTimes: boolean;
  weekdaysOnly: boolean;
  showTicks: boolean;
  items: PlannerItem[];
  /** False on a new planner until the grown-up picks its type on the start screen */
  kindChosen?: boolean;
}

export interface Worksheet {
  id: string;
  title: string;
  pageSize: PageSizeId;
  pages: Page[];
  /** Name and date line on every worksheet page (default) or only the first one */
  nameDate?: 'all' | 'first';
  createdAt: number;
  updatedAt: number;
}

// Drag & drop item types
export interface DraggedLibraryBlock {
  type: 'library-block';
  blockId: string;
}

export interface DraggedSlotBlock {
  type: 'slot-block';
  sourceSlotId: string;
  sourcePageId: string;
  block: BlockInstance;
}

export type DragPayload = DraggedLibraryBlock | DraggedSlotBlock;

/** A routine activity dragged from the planner library */
export interface DraggedPlannerActivity {
  type: 'planner-activity';
  activityId: string;
}
/** A planner item already on the page, being moved */
export interface DraggedPlannerItem {
  type: 'planner-item';
  pageId: string;
  itemId: string;
}
