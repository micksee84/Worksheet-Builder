/**
 * @license
 * Sunshine Brigade Worksheet Builder - Pages panel
 *
 * A vertical list of every page, like the Pages panel in Affinity, InDesign or Photoshop.
 * - Live thumbnails, numbered, with the page title underneath
 * - Tap a page to open it. Up and down arrow keys move between pages.
 * - Drag a page to a new place in the list (or Alt + up/down arrow)
 * - Duplicate, move and delete from the buttons on the selected page
 * - Drop an activity from the library straight onto a page thumbnail
 * - Collapses to a slim rail of page numbers when you want more room
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Page, PageSizeId } from '../types';
import { PAGE_SPECS } from '../config/appConfig';
import { WorksheetPageSvg } from './WorksheetPageSvg';
import { ArrowDown, ArrowUp, Copy, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react';

interface PagesPanelProps {
  pages: Page[];
  activePageIndex: number;
  pageSize: PageSizeId;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
}

const THUMB_WIDTH = 132;
const COLLAPSE_KEY = 'sb-pages-panel-collapsed';

const readCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeCollapsed = (value: boolean) => {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    // Storage can be blocked in private windows. The panel still works, it just won't remember.
  }
};

/** The page drawn small. Only redraws when that page changes. */
const PageThumb = memo(function PageThumb({
  page,
  index,
  pageSize,
}: {
  page: Page;
  index: number;
  pageSize: PageSizeId;
}) {
  const spec = PAGE_SPECS[pageSize as keyof typeof PAGE_SPECS] || PAGE_SPECS.letter;
  const scale = THUMB_WIDTH / spec.width;
  return (
    <div
      style={{ width: THUMB_WIDTH, height: spec.height * scale }}
      className="relative overflow-hidden bg-white"
      aria-hidden="true"
    >
      <div
        style={{ width: spec.width, height: spec.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="absolute top-0 left-0 pointer-events-none select-none"
      >
        <WorksheetPageSvg page={page} pageIndex={index} pageSize={pageSize} isInteractive={true} />
      </div>
    </div>
  );
});

const IconButton: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009BD9] ${
      danger
        ? 'text-[#E52311] hover:bg-[#E52311]/10'
        : 'text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2]'
    }`}
  >
    {children}
  </button>
);

/** One page in the list. Also a drop target for activities dragged from the library. */
const PageItem: React.FC<{
  page: Page;
  index: number;
  total: number;
  pageSize: PageSizeId;
  isActive: boolean;
  dropMarker: 'before' | 'after' | null;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  itemRef: (el: HTMLLIElement | null) => void;
}> = ({
  page,
  index,
  total,
  pageSize,
  isActive,
  dropMarker,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  itemRef,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `page-thumb-${page.id}`,
    data: { type: 'page-thumb', pageId: page.id },
  });
  const filled = page.slots.filter((s) => s.block).length;
  const label = page.title || `Page ${index + 1}`;

  return (
    <li ref={itemRef} className="relative">
      {dropMarker === 'before' && <DropLine position="top" />}
      <div
        ref={setNodeRef}
        role="option"
        aria-selected={isActive}
        aria-label={`Page ${index + 1}${page.title ? `: ${page.title}` : ''}, ${filled} of ${page.slots.length} spaces used`}
        tabIndex={-1}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onSelect}
        className={`group flex flex-col items-center gap-2 rounded-xl px-2 pt-3 pb-2 cursor-pointer transition-colors ${
          isActive ? 'bg-white' : 'hover:bg-white/70'
        }`}
      >
        <div className="relative">
          <div
            className={`rounded-[3px] transition-shadow ${
              isOver
                ? 'outline-[3px] outline outline-[#009BD9] outline-offset-2 shadow-[4px_4px_0_#009BD9]'
                : isActive
                ? 'outline-[3px] outline outline-[#2D2200] outline-offset-2 shadow-[4px_4px_0_#2D2200]'
                : 'outline-1 outline outline-[#D8D3BE] shadow-sm group-hover:outline-[#2D2200]'
            }`}
          >
            <PageThumb page={page} index={index} pageSize={pageSize} />
          </div>

          {/* Page number badge */}
          <span
            className={`absolute -top-2 -left-2 min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-[11px] font-extrabold tabular-nums border-2 ${
              isActive
                ? 'bg-[#F2B800] text-[#2D2200] border-[#2D2200]'
                : 'bg-white text-[#2D2200] border-[#2D2200]'
            }`}
          >
            {index + 1}
          </span>

          {isOver && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="px-2 py-1 rounded-full bg-[#009BD9] text-white text-[11px] font-bold shadow">
                Add here
              </span>
            </span>
          )}
        </div>

        <span
          className={`w-full text-center text-xs leading-tight truncate ${
            isActive ? 'font-extrabold text-[#2D2200]' : 'font-bold text-[#6B5838]'
          }`}
          title={label}
        >
          {label}
        </span>

        {isActive && (
          <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <IconButton label="Move this page up" onClick={onMoveUp} disabled={index === 0}>
              <ArrowUp className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton label="Move this page down" onClick={onMoveDown} disabled={index === total - 1}>
              <ArrowDown className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton label="Duplicate this page" onClick={onDuplicate}>
              <Copy className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton label="Delete this page" onClick={onDelete} disabled={total <= 1} danger>
              <Trash2 className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        )}
      </div>
      {dropMarker === 'after' && <DropLine position="bottom" />}
    </li>
  );
};

const DropLine: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => (
  <div
    className={`absolute left-3 right-3 h-[3px] rounded-full bg-[#009BD9] z-10 ${
      position === 'top' ? '-top-[2px]' : '-bottom-[2px]'
    }`}
  >
    <span className="absolute -left-1 -top-[3px] w-2.5 h-2.5 rounded-full bg-[#009BD9]" />
  </div>
);

export const PagesPanel: React.FC<PagesPanelProps> = ({
  pages,
  activePageIndex,
  pageSize,
  onSelectPageIndex,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<{ index: number; side: 'before' | 'after' } | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      writeCollapsed(!c);
      return !c;
    });
  };

  // Keep the open page in view as you add, move or step through pages.
  useEffect(() => {
    const el = itemRefs.current[activePageIndex];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activePageIndex, pages.length, collapsed]);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const dir = e.key === 'ArrowUp' ? -1 : 1;
    const next = activePageIndex + dir;
    if (next < 0 || next >= pages.length) return;
    if (e.altKey) onMovePage(activePageIndex, next);
    else onSelectPageIndex(next);
  };

  /* Reordering by drag. Uses the browser's own drag and drop, so it never gets mixed up with
     dragging activities in from the library. */
  const startDrag = (index: number) => (e: React.DragEvent) => {
    setDragFrom(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', `sb-page-${index}`);
    } catch {
      // Some browsers refuse custom data; the move still works from state.
    }
  };

  const overItem = (index: number) => (e: React.DragEvent) => {
    if (dragFrom === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const side = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDropAt((prev) => (prev && prev.index === index && prev.side === side ? prev : { index, side }));
  };

  const finishDrag = () => {
    setDragFrom(null);
    setDropAt(null);
  };

  const dropItem = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragFrom !== null && dropAt) {
      let target = dropAt.side === 'before' ? dropAt.index : dropAt.index + 1;
      if (target > dragFrom) target -= 1;
      if (target !== dragFrom) onMovePage(dragFrom, target);
    }
    finishDrag();
  };

  // Hide the marker where dropping would change nothing.
  const markerFor = (index: number): 'before' | 'after' | null => {
    if (!dropAt || dragFrom === null || dropAt.index !== index) return null;
    const target = dropAt.side === 'before' ? index : index + 1;
    if (target === dragFrom || target === dragFrom + 1) return null;
    return dropAt.side;
  };

  if (collapsed) {
    return (
      <aside
        aria-label="Pages"
        className="hidden md:flex w-14 shrink-0 flex-col items-center bg-[#FAF8F0] border-r border-[#E2DEC9]"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title="Show the pages panel"
          aria-label="Show the pages panel"
          className="mt-3 p-2 rounded-lg text-[#6B5838] hover:text-[#2D2200] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009BD9]"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <ul
          role="listbox"
          aria-label="Pages"
          tabIndex={0}
          onKeyDown={onListKeyDown}
          className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-1.5 py-3 focus:outline-none"
        >
          {pages.map((p, idx) => (
            <li key={p.id} ref={(el) => { itemRefs.current[idx] = el; }}>
              <button
                type="button"
                role="option"
                aria-selected={idx === activePageIndex}
                onClick={() => onSelectPageIndex(idx)}
                title={`Page ${idx + 1}${p.title ? `: ${p.title}` : ''}`}
                className={`w-8 h-8 rounded-full text-xs font-extrabold tabular-nums border-2 transition-colors ${
                  idx === activePageIndex
                    ? 'bg-[#F2B800] text-[#2D2200] border-[#2D2200]'
                    : 'bg-white text-[#6B5838] border-[#E2DEC9] hover:border-[#2D2200] hover:text-[#2D2200]'
                }`}
              >
                {idx + 1}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onAddPage}
          title="Add a new page"
          aria-label="Add a new page"
          className="mb-3 w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-[#009BD9] text-[#009BD9] hover:bg-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Pages"
      className="hidden md:flex w-[188px] shrink-0 flex-col bg-[#FAF8F0] border-r border-[#E2DEC9]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-3 bg-white border-b border-[#E2DEC9]">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-extrabold text-[#2D2200]">Pages</h2>
          <span className="px-1.5 min-w-5 h-5 rounded-full bg-[#F2F2E2] text-[11px] font-bold tabular-nums text-[#6B5838] flex items-center justify-center">
            {pages.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onAddPage}
            title="Add a new page at the end"
            aria-label="Add a new page"
            className="p-1.5 rounded-md text-[#2D2200] hover:bg-[#F2F2E2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009BD9]"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            title="Hide the pages panel"
            aria-label="Hide the pages panel"
            className="p-1.5 rounded-md text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009BD9]"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page list */}
      <ul
        ref={listRef}
        role="listbox"
        aria-label="Pages"
        aria-activedescendant={undefined}
        tabIndex={0}
        onKeyDown={onListKeyDown}
        onDragLeave={(e) => {
          if (!listRef.current?.contains(e.relatedTarget as Node)) setDropAt(null);
        }}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#009BD9]"
      >
        {pages.map((page, idx) => (
          <PageItem
            key={page.id}
            page={page}
            index={idx}
            total={pages.length}
            pageSize={pageSize}
            isActive={idx === activePageIndex}
            dropMarker={markerFor(idx)}
            onSelect={() => onSelectPageIndex(idx)}
            onDuplicate={() => onDuplicatePage(idx)}
            onDelete={() => onDeletePage(idx)}
            onMoveUp={() => onMovePage(idx, idx - 1)}
            onMoveDown={() => onMovePage(idx, idx + 1)}
            onDragStart={startDrag(idx)}
            onDragOver={overItem(idx)}
            onDrop={dropItem}
            onDragEnd={finishDrag}
            itemRef={(el) => { itemRefs.current[idx] = el; }}
          />
        ))}

        <li className="pt-1 pb-2">
          <button
            type="button"
            onClick={onAddPage}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-[#009BD9] text-[#009BD9] text-xs font-bold hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009BD9]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add page
          </button>
        </li>
      </ul>

      {/* Footer hint */}
      <p className="px-3 py-2 border-t border-[#E2DEC9] text-[11px] leading-snug text-[#6B5838]">
        Drag pages to reorder. Drop an activity on a page to add it there.
      </p>
    </aside>
  );
};
