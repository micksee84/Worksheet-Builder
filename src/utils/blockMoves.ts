/**
 * @license
 * Sunshine Brigade Worksheet Builder - Moving placed blocks
 *
 * A block already on a page can be dragged to another slot, on the same page or another:
 *   - onto an empty slot: it moves there,
 *   - onto a filled slot: the two blocks swap places,
 *   - onto a page in the Pages panel: it moves to that page's first empty slot it fits.
 * A block only goes where its definition allows that slot size (allowedSizes). A swap
 * needs both blocks to fit each other's slot. Blocks redraw at the size they land in.
 */

import { BlockSize, Page, Slot, Worksheet } from '../types';
import { getBlockById } from '../registry/blockRegistry';

/** Drag data for a placed block (see WorksheetCanvas). */
export interface SlotBlockDrag {
  type: 'slot-block';
  sourcePageId: string;
  sourceSlotId: string;
  sourceSize: BlockSize;
  blockId: string;
}

export type DropKind = 'self' | 'move' | 'swap' | 'no-fit';

export function isSlotBlockDrag(data: unknown): data is SlotBlockDrag {
  return !!data && (data as { type?: string }).type === 'slot-block';
}

const fits = (blockId: string | undefined, size: BlockSize) => {
  if (!blockId) return true;
  const def = getBlockById(blockId);
  return !def || def.allowedSizes.includes(size);
};

/** What dropping this placed block onto a slot would do. */
export function dropKind(drag: SlotBlockDrag, targetPageId: string, target: Slot): DropKind {
  if (drag.sourcePageId === targetPageId && drag.sourceSlotId === target.id) return 'self';
  if (!fits(drag.blockId, target.size)) return 'no-fit';
  if (!target.block) return 'move';
  return fits(target.block.blockId, drag.sourceSize) ? 'swap' : 'no-fit';
}

/** The first empty slot on a page this block can go in, if any. */
export function firstFreeSlot(page: Page, drag: SlotBlockDrag): Slot | null {
  return page.slots.find((s) => !s.block && fits(drag.blockId, s.size) && !(page.id === drag.sourcePageId && s.id === drag.sourceSlotId)) || null;
}

/** Move (or swap) the block in source into target. Returns the worksheet unchanged if either slot is gone. */
export function moveBlock(
  ws: Worksheet,
  source: { pageId: string; slotId: string },
  target: { pageId: string; slotId: string }
): Worksheet {
  const find = (ref: { pageId: string; slotId: string }) =>
    ws.pages.find((p) => p.id === ref.pageId)?.slots.find((s) => s.id === ref.slotId);
  const from = find(source);
  const to = find(target);
  if (!from || !to || !from.block) return ws;
  const moving = from.block;
  const displaced = to.block;
  return {
    ...ws,
    pages: ws.pages.map((p) => {
      if (p.id !== source.pageId && p.id !== target.pageId) return p;
      return {
        ...p,
        slots: p.slots.map((s) => {
          if (p.id === target.pageId && s.id === target.slotId) return { ...s, block: moving };
          if (p.id === source.pageId && s.id === source.slotId) return { ...s, block: displaced };
          return s;
        }),
      };
    }),
  };
}
