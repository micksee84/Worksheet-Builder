/**
 * @license
 * Sunshine Brigade Worksheet Builder - Worksheet Validation
 * Checks worksheets that come from outside the running app (localStorage, share links)
 * before they reach React. Anything malformed is repaired where possible or rejected,
 * so a bad link or an old save can never leave the app stuck on a blank screen.
 */

import { Worksheet, Page, Slot, PageLayoutPreset, BlockInstance } from '../types';
import { PAGE_SPECS, CHARACTERS } from '../config/appConfig';
import { LAYOUT_PRESETS, createSlotsForPreset } from './layoutPresets';
import { getBlockById } from '../registry/blockRegistry';

/** Bump this whenever the saved worksheet shape changes in a way old saves can't follow. */
export const WORKSHEET_SCHEMA_VERSION = 1;

const VALID_LAYOUTS = new Set<string>(LAYOUT_PRESETS.map((p) => p.id));
const VALID_CORNERS = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
const VALID_CHARACTERS = new Set<string>(CHARACTERS.map((c) => c.id));
const MAX_PAGES = 50;
const MAX_TITLE_LENGTH = 120;

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.slice(0, MAX_TITLE_LENGTH) : fallback;
}

function validateBlock(raw: unknown): BlockInstance | null {
  if (!isObject(raw) || typeof raw.blockId !== 'string') return null;
  const def = getBlockById(raw.blockId);
  if (!def) return null; // Unknown or removed block type: leave the slot empty

  // Only keep settings the block actually defines, and fall back to its defaults
  const rawSettings = isObject(raw.settings) ? raw.settings : {};
  const settings: Record<string, any> = { ...def.defaultSettings };
  for (const field of def.settingsSchema) {
    const value = rawSettings[field.key];
    if (value === undefined || value === null) continue;
    if (field.type === 'number' || field.type === 'slider') {
      const num = Number(value);
      if (Number.isFinite(num)) {
        const min = field.min ?? -Infinity;
        const max = field.max ?? Infinity;
        settings[field.key] = Math.min(max, Math.max(min, num));
      }
    } else if (field.type === 'boolean') {
      settings[field.key] = Boolean(value);
    } else if (field.type === 'select') {
      const allowed = field.options?.some((opt) => String(opt.value) === String(value));
      if (allowed) settings[field.key] = value;
    } else if (typeof value === 'string') {
      settings[field.key] = value.slice(0, MAX_TITLE_LENGTH);
    }
  }

  let character: BlockInstance['character'] = null;
  if (
    isObject(raw.character) &&
    VALID_CHARACTERS.has(raw.character.id) &&
    VALID_CORNERS.has(raw.character.corner)
  ) {
    character = { id: raw.character.id, corner: raw.character.corner };
  }

  return {
    instanceId:
      typeof raw.instanceId === 'string' && raw.instanceId
        ? raw.instanceId
        : `inst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    blockId: raw.blockId,
    settings,
    character,
  };
}

function validatePage(raw: unknown, index: number): Page | null {
  if (!isObject(raw)) return null;

  const layout: PageLayoutPreset = VALID_LAYOUTS.has(raw.layout) ? raw.layout : '2-half';

  // Rebuild the slot list from the layout so ids, sizes and labels always line up,
  // then copy across any valid blocks from the saved slots in order.
  const slots: Slot[] = createSlotsForPreset(layout);
  const rawSlots: unknown[] = Array.isArray(raw.slots) ? raw.slots : [];
  slots.forEach((slot) => {
    const match = rawSlots.find((s) => isObject(s) && s.id === slot.id);
    slot.block = isObject(match) ? validateBlock(match.block) : null;
  });

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `page_${Date.now()}_${index}`,
    title: cleanString(raw.title, `Page ${index + 1}`),
    layout,
    slots,
    showDateName: raw.showDateName !== false,
  };
}

/**
 * Returns a safe Worksheet, or null if the input is not a worksheet at all.
 */
export function validateWorksheet(raw: unknown): Worksheet | null {
  if (!isObject(raw) || !Array.isArray(raw.pages)) return null;

  const pages = raw.pages
    .slice(0, MAX_PAGES)
    .map((p: unknown, i: number) => validatePage(p, i))
    .filter((p: Page | null): p is Page => p !== null);

  if (pages.length === 0) return null;

  // Page ids must be unique, or selection and PDF export pick the wrong page
  const seen = new Set<string>();
  pages.forEach((page, i) => {
    if (seen.has(page.id)) page.id = `page_${Date.now()}_${i}`;
    seen.add(page.id);
  });

  const now = Date.now();
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `ws_${now}`,
    title: cleanString(raw.title, 'My worksheet'),
    pageSize: raw.pageSize in PAGE_SPECS ? raw.pageSize : 'letter',
    pages,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : now,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : now,
  };
}
