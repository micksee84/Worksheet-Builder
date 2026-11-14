/**
 * @license
 * Sunshine Brigade Worksheet Builder - Checklist row editor
 *
 * Typing a checklist straight onto the page, like a to-do app. The row being edited turns
 * into a text box: Enter saves it and starts a new row under it, Backspace in an empty row
 * removes it, the arrow keys move up and down, Esc stops. The icon follows the words
 * ("socks" gives the sock) until one is picked by hand. Clicking the icon opens the icon
 * picker; the ... button opens the rest: how many, section heading, remove.
 */

import React, { useEffect, useRef, useState } from 'react';
import { PlannerItem } from '../types';
import { Box } from './plannerLayout';
import { GraphicThumb, iconForWords } from './plannerIcons';
import { ACTIVITIES } from './activities';
import { IconPicker } from './PlannerDrawer';
import { Minus, MoreHorizontal, Plus, Trash2 } from '../components/icons';

export const BLANK_PICTURE = 'ph:Star';

/** The picture for typed words: a ready-made activity of that name, else the best icon */
export function pictureFor(text: string): string {
  const t = text.trim().toLowerCase();
  const exact = ACTIVITIES.find((a) => a.label.toLowerCase() === t);
  return exact?.picture ?? iconForWords(text) ?? BLANK_PICTURE;
}

export interface RowEditorActions {
  /** Save changes to this row */
  save: (patch: Partial<PlannerItem>) => void;
  /** Save, then start a new empty row under it */
  saveAndNext: (patch: Partial<PlannerItem>) => void;
  /** Take this row off the list */
  remove: () => void;
  /** Save and edit the row above (-1) or below (1) */
  move: (dir: -1 | 1, patch: Partial<PlannerItem>) => void;
  /** Stop editing (after saving, or when an empty new row is dropped) */
  close: () => void;
}

export const ChecklistRowEditor: React.FC<{
  item: PlannerItem;
  box: Box;
  areaBottom: number;
  actions: RowEditorActions;
  /** Open with the icon picker showing (the icon was clicked) */
  startWithIcons?: boolean;
}> = ({ item, box, areaBottom, actions, startWithIcons }) => {
  const [text, setText] = useState(item.label);
  // The icon follows the words until someone picks one (new rows, and rows still on the blank star)
  const [auto, setAuto] = useState(!item.label || item.picture === BLANK_PICTURE);
  // Which panel is open under the row: the icon picker, or the other settings
  const [open, setOpen] = useState<null | 'icon' | 'more'>(startWithIcons ? 'icon' : null);
  // Set once this row hands over (Enter, arrows, Esc): its blur when it goes must not save again
  const left = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const picture = auto ? pictureFor(text) : item.picture;
  const patch = (): Partial<PlannerItem> => ({ label: text.trim(), picture });

  useEffect(() => {
    // Straight to the icons: their search box takes the focus instead
    if (startWithIcons) return;
    input.current?.focus();
    input.current?.select();
  }, [item.id, startWithIcons]);

  const finish = () => {
    if (left.current) return;
    left.current = true;
    if (!text.trim()) actions.remove();
    else actions.save(patch());
    actions.close();
  };

  const h = box.h;
  const heading = !!item.heading;
  const fontSize = Math.max(11, Math.min(heading ? 24 : 22, h * (heading ? 0.55 : 0.32)));
  const pic = Math.min(h - 10, 64);
  // The extras open under the row, or above it near the bottom of the page
  const popUp = box.y + h + 330 > areaBottom;

  return (
    <div
      ref={root}
      tabIndex={-1}
      data-planner-editor=""
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => {
        // Leaving the row and its extras saves it
        if (!root.current?.contains(e.relatedTarget as Node | null)) finish();
      }}
      style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: h, zIndex: 30 }}
      className={`outline-none flex items-center gap-2 px-1.5 rounded-[10px] bg-white border-[3px] border-[#009BD9] shadow-lg`}
    >
      {!heading && (
        <button
          type="button"
          onClick={() => setOpen((o) => (o === 'icon' ? null : 'icon'))}
          title="Change the icon"
          aria-label="Change the icon"
          aria-expanded={open === 'icon'}
          className={`shrink-0 rounded-lg flex items-center justify-center ${open === 'icon' ? 'outline outline-2 outline-[#009BD9] bg-[#009BD9]/10' : 'hover:outline hover:outline-2 hover:outline-[#009BD9]/60 hover:bg-[#009BD9]/5'}`}
          style={{ width: pic + 6, height: pic + 6 }}
        >
          <GraphicThumb picture={picture} size={pic} />
        </button>
      )}
      <input
        ref={input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={heading ? 'Section name (Clothes, Bathroom...)' : 'Type an item, then press Enter'}
        aria-label={heading ? 'Section heading' : 'Checklist item'}
        onKeyDown={(e) => {
          if (['Enter', 'Escape', 'ArrowUp', 'ArrowDown'].includes(e.key) || (e.key === 'Backspace' && !text)) {
            if (e.key !== 'Enter' || text.trim()) left.current = true;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (!text.trim()) {
              left.current = false;
              return finish();
            }
            actions.saveAndNext(patch());
          } else if (e.key === 'Escape') {
            e.preventDefault();
            if (!item.label) actions.remove();
            actions.close();
          } else if (e.key === 'Backspace' && !text) {
            e.preventDefault();
            actions.remove();
            actions.move(-1, {});
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (!text.trim()) actions.remove();
            actions.move(e.key === 'ArrowUp' ? -1 : 1, text.trim() ? patch() : {});
          }
        }}
        className={`flex-1 min-w-0 bg-transparent outline-none text-[#2D2200] placeholder:text-[#B6B2A6] placeholder:font-semibold ${heading ? 'font-black' : 'font-extrabold'}`}
        style={{ fontSize }}
      />
      {!heading && (item.count ?? 1) > 1 && (
        <span className="shrink-0 font-extrabold text-[#2D2200]" style={{ fontSize }}>
          ×{item.count}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => (o === 'more' ? null : 'more'))}
        title="More: how many, section heading, remove"
        aria-label="More options for this row"
        aria-expanded={open === 'more'}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${open === 'more' ? 'bg-[#2D2200] text-white' : 'text-[#6B5838] hover:bg-[#FAF8F0]'}`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open === 'icon' && !heading && (
        <div
          tabIndex={-1}
          className="absolute left-0 w-[300px] outline-none bg-white border-2 border-[#2D2200] rounded-2xl shadow-[4px_4px_0_#2D2200] p-3 text-left"
          style={popUp ? { bottom: h + 6 } : { top: h + 6 }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(null);
              input.current?.focus();
            }
          }}
        >
          <IconPicker
            autoFocus
            value={picture}
            onChange={(pic) => {
              // Picked: back to the words
              setAuto(false);
              actions.save({ label: text.trim() || item.label, picture: pic });
              setOpen(null);
              input.current?.focus();
            }}
          />
        </div>
      )}

      {open === 'more' && (
        <div
          tabIndex={-1}
          className="absolute right-0 w-[300px] outline-none bg-white border-2 border-[#2D2200] rounded-2xl shadow-[4px_4px_0_#2D2200] p-3 space-y-3 text-left"
          style={popUp ? { bottom: h + 6 } : { top: h + 6 }}
        >
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span>
              <span className="block text-sm font-bold text-[#2D2200]">Section heading</span>
              <span className="block text-xs text-[#6B5838]">A title row, like "Clothes", with nothing to tick</span>
            </span>
            <input
              type="checkbox"
              checked={heading}
              onChange={(e) => actions.save({ ...patch(), heading: e.target.checked || undefined })}
              className="w-5 h-5 accent-[#009BD9]"
            />
          </label>
          {!heading && (
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-bold text-[#2D2200]">How many</span>
                <span className="block text-xs text-[#6B5838]">Prints as "Socks ×3"</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="One fewer"
                  disabled={(item.count ?? 1) <= 1}
                  onClick={() => actions.save({ ...patch(), count: Math.max(1, (item.count ?? 1) - 1) })}
                  className="w-8 h-8 rounded-lg border border-[#E2DEC9] flex items-center justify-center disabled:opacity-40 hover:border-[#2D2200]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-extrabold tabular-nums text-[#2D2200]">{item.count ?? 1}</span>
                <button
                  type="button"
                  aria-label="One more"
                  disabled={(item.count ?? 1) >= 20}
                  onClick={() => actions.save({ ...patch(), count: Math.min(20, (item.count ?? 1) + 1) })}
                  className="w-8 h-8 rounded-lg border border-[#E2DEC9] flex items-center justify-center disabled:opacity-40 hover:border-[#2D2200]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              left.current = true;
              actions.remove();
              actions.close();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#E52311] border border-[#F3C3BD] rounded-lg hover:bg-[#FDECEA]"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove this row
          </button>
        </div>
      )}
    </div>
  );
};
