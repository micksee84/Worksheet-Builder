/**
 * @license
 * Sunshine Brigade Worksheet Builder - Layout Presets & Geometry
 * Calculates slot coordinates for full, half, and quarter page slots on US Letter & A4.
 */

import { PageLayoutPreset, Slot, PageSizeId } from '../types';
import { pageLayout, SPACE, FRAME_STROKE } from './spacing';

export interface SlotGeometry {
  slotId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PresetInfo {
  id: PageLayoutPreset;
  displayName: string;
  slotCount: number;
  iconType: string;
}

export const LAYOUT_PRESETS: PresetInfo[] = [
  { id: '1-full', displayName: '1 Full Page Block', slotCount: 1, iconType: 'full' },
  { id: '2-half', displayName: '2 Half Page Blocks', slotCount: 2, iconType: 'half-stacked' },
  { id: '4-quarter', displayName: '4 Quarter Page Grid', slotCount: 4, iconType: 'quarter-grid' },
  { id: 'top-half-2-quarter', displayName: 'Top Half + 2 Quarters', slotCount: 3, iconType: 'half-top-2-quarter' },
  { id: '2-quarter-bottom-half', displayName: '2 Quarters + Bottom Half', slotCount: 3, iconType: '2-quarter-half-bottom' },
];

/**
 * Creates empty slots for a given layout preset
 */
export function createSlotsForPreset(preset: PageLayoutPreset): Slot[] {
  switch (preset) {
    case '1-full':
      return [{ id: 'slot-1', size: 'full', label: 'Full Page', block: null }];

    case '2-half':
      return [
        { id: 'slot-1', size: 'half', label: 'Top Half', block: null },
        { id: 'slot-2', size: 'half', label: 'Bottom Half', block: null },
      ];

    case '4-quarter':
      return [
        { id: 'slot-1', size: 'quarter', label: 'Top Left', block: null },
        { id: 'slot-2', size: 'quarter', label: 'Top Right', block: null },
        { id: 'slot-3', size: 'quarter', label: 'Bottom Left', block: null },
        { id: 'slot-4', size: 'quarter', label: 'Bottom Right', block: null },
      ];

    case 'top-half-2-quarter':
      return [
        { id: 'slot-1', size: 'half', label: 'Top Half', block: null },
        { id: 'slot-2', size: 'quarter', label: 'Bottom Left', block: null },
        { id: 'slot-3', size: 'quarter', label: 'Bottom Right', block: null },
      ];

    case '2-quarter-bottom-half':
      return [
        { id: 'slot-1', size: 'quarter', label: 'Top Left', block: null },
        { id: 'slot-2', size: 'quarter', label: 'Top Right', block: null },
        { id: 'slot-3', size: 'half', label: 'Bottom Half', block: null },
      ];

    default:
      return [{ id: 'slot-1', size: 'full', label: 'Full Page', block: null }];
  }
}

/**
 * Computes exact SVG coordinates (x, y, width, height) for each slot in a layout.
 */
export function calculateSlotGeometries(
  pageSizeId: PageSizeId,
  preset: PageLayoutPreset,
  showDateName = true
): Record<string, SlotGeometry> {
  // Box rectangles are positioned by their stroke centre, so each one is pulled in by half
  // the border. That puts the outside of every border exactly on the page's spacing lines:
  // SPACE from the page edges and rules, and SPACE between neighbouring boxes.
  const layout = pageLayout(pageSizeId, showDateName);
  const halfFrame = FRAME_STROKE / 2;
  const contentX = layout.left + halfFrame;
  const contentY = layout.contentTop;
  const contentWidth = layout.right - layout.left - FRAME_STROKE;
  const contentHeight = layout.contentBottom - layout.contentTop;
  const gap = SPACE + FRAME_STROKE;

  const geometries: Record<string, SlotGeometry> = {};

  if (preset === '1-full') {
    geometries['slot-1'] = {
      slotId: 'slot-1',
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
    };
  } else if (preset === '2-half') {
    const halfH = (contentHeight - gap) / 2;
    geometries['slot-1'] = {
      slotId: 'slot-1',
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: halfH,
    };
    geometries['slot-2'] = {
      slotId: 'slot-2',
      x: contentX,
      y: contentY + halfH + gap,
      width: contentWidth,
      height: halfH,
    };
  } else if (preset === '4-quarter') {
    const halfW = (contentWidth - gap) / 2;
    const halfH = (contentHeight - gap) / 2;
    geometries['slot-1'] = {
      slotId: 'slot-1',
      x: contentX,
      y: contentY,
      width: halfW,
      height: halfH,
    };
    geometries['slot-2'] = {
      slotId: 'slot-2',
      x: contentX + halfW + gap,
      y: contentY,
      width: halfW,
      height: halfH,
    };
    geometries['slot-3'] = {
      slotId: 'slot-3',
      x: contentX,
      y: contentY + halfH + gap,
      width: halfW,
      height: halfH,
    };
    geometries['slot-4'] = {
      slotId: 'slot-4',
      x: contentX + halfW + gap,
      y: contentY + halfH + gap,
      width: halfW,
      height: halfH,
    };
  } else if (preset === 'top-half-2-quarter') {
    const halfH = (contentHeight - gap) / 2;
    const halfW = (contentWidth - gap) / 2;
    geometries['slot-1'] = {
      slotId: 'slot-1',
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: halfH,
    };
    geometries['slot-2'] = {
      slotId: 'slot-2',
      x: contentX,
      y: contentY + halfH + gap,
      width: halfW,
      height: halfH,
    };
    geometries['slot-3'] = {
      slotId: 'slot-3',
      x: contentX + halfW + gap,
      y: contentY + halfH + gap,
      width: halfW,
      height: halfH,
    };
  } else if (preset === '2-quarter-bottom-half') {
    const halfH = (contentHeight - gap) / 2;
    const halfW = (contentWidth - gap) / 2;
    geometries['slot-1'] = {
      slotId: 'slot-1',
      x: contentX,
      y: contentY,
      width: halfW,
      height: halfH,
    };
    geometries['slot-2'] = {
      slotId: 'slot-2',
      x: contentX + halfW + gap,
      y: contentY,
      width: halfW,
      height: halfH,
    };
    geometries['slot-3'] = {
      slotId: 'slot-3',
      x: contentX,
      y: contentY + halfH + gap,
      width: contentWidth,
      height: halfH,
    };
  }

  return geometries;
}
