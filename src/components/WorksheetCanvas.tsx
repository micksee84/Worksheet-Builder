/**
 * @license
 * Sunshine Brigade Worksheet Builder - Central Canvas & To-Scale Page Preview
 * Features:
 * - Live to-scale preview of current page
 * - Layout selector for active page (1-full, 2-half, 4-quarter, etc.)
 * - Page tabs (add, delete, reorder, switch)
 * - @dnd-kit useDroppable drop zones over slots
 * - Quick action overlay over active slot
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Page, PageSizeId, Slot, PageLayoutPreset, BlockInstance } from '../types';
import { PAGE_SPECS } from '../config/appConfig';
import { LAYOUT_PRESETS, calculateSlotGeometries } from '../utils/layoutPresets';
import { WorksheetPageSvg } from './WorksheetPageSvg';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  LayoutGrid,
  FileText,
} from 'lucide-react';

interface WorksheetCanvasProps {
  pages: Page[];
  activePageIndex: number;
  pageSize: PageSizeId;
  selectedSlot: { pageId: string; slot: Slot } | null;
  onSelectSlot: (pageId: string, slot: Slot) => void;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onChangePageLayout: (pageId: string, layout: PageLayoutPreset) => void;
  onChangePageTitle: (pageId: string, title: string) => void;
  onDeleteBlock: (pageId: string, slotId: string) => void;
  onOpenSettings: (pageId: string, slot: Slot) => void;
}

const DEFAULT_ZOOM = { single: 0.85, grid: 0.32 } as const;
const ZOOM_RANGE = { grid: [0.2, 0.6] } as const;
// Single-page view: the page is framed to fill the canvas, and can be zoomed in up to 200% of its real size.
const MAX_ZOOM = 2;
const ZOOM_STEP = 1.25;
// Room kept between the page and the canvas edge, when framed and at the edges while panning.
const FRAME_GUTTER = 24;

const isTypingTarget = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
};

// Space should still press a focused button, so only treat it as the hand tool elsewhere.
const isActivatable = (el: EventTarget | null) =>
  !!(el as HTMLElement | null)?.closest?.('button, a[href], [role="button"], [role="tab"], summary');

// Droppable Slot Overlay Target for DnD
const DroppableSlotOverlay: React.FC<{
  pageId: string;
  slot: Slot;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
  onDeleteBlock: () => void;
  /** Grid thumbnails: accept drops only, no click handling or hover controls. */
  dropOnly?: boolean;
}> = ({
  pageId,
  slot,
  x,
  y,
  width,
  height,
  isSelected,
  onSelect,
  onOpenSettings,
  onDeleteBlock,
  dropOnly = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${pageId}-${slot.id}`,
    data: {
      type: 'slot-target',
      pageId,
      slotId: slot.id,
      size: slot.size,
    },
  });

  if (dropOnly) {
    return (
      <div
        ref={setNodeRef}
        style={{ position: 'absolute', left: x, top: y, width, height, pointerEvents: 'none' }}
        className={`rounded-xl transition-colors ${
          isOver ? 'bg-[#009BD9]/15 border-[6px] border-dashed border-[#009BD9]' : ''
        }`}
      >
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Drawn at page scale, so the label is large enough to read once the thumbnail shrinks it */}
            <span className="text-4xl font-black text-[#009BD9] bg-white px-8 py-4 rounded-full border-4 border-[#009BD9]">
              Drop here
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`group rounded-lg transition-all cursor-pointer ${
        isOver
          ? 'bg-[#009BD9]/15 border-2 border-dashed border-[#009BD9] shadow-inner'
          : isSelected
          ? 'border-2 border-[#009BD9] bg-[#009BD9]/5'
          : 'hover:border hover:border-[#009BD9]/50'
      }`}
    >
      {/* Drag hover hint */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <span className="text-xs font-black text-[#2D2200] bg-[#FAF8F0] px-3 py-1.5 rounded-full border-[1.5px] border-[#2D2200]">
            Drop block here!
          </span>
        </div>
      )}

      {/* Floating Action Controls for slotted block */}
      {slot.block && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-[#E2DEC9] shadow-md z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1 text-[#2D2200] hover:text-[#009BD9] hover:bg-[#FAF8F0] rounded"
            title="Change this activity's settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBlock();
            }}
            className="p-1 text-[#E52311] hover:bg-red-50 rounded"
            title="Remove this activity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const WorksheetCanvas: React.FC<WorksheetCanvasProps> = ({
  pages,
  activePageIndex,
  pageSize,
  selectedSlot,
  onSelectSlot,
  onSelectPageIndex,
  onAddPage,
  onDeletePage,
  onMovePage,
  onChangePageLayout,
  onChangePageTitle,
  onDeleteBlock,
  onOpenSettings,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [gridZoom, setGridZoom] = useState<number>(DEFAULT_ZOOM.grid);
  const activePage = pages[activePageIndex] || pages[0];
  const spec = PAGE_SPECS[pageSize as keyof typeof PAGE_SPECS] || PAGE_SPECS.letter;
  const geometries = calculateSlotGeometries(pageSize, activePage.layout);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isGrid = viewMode === 'grid';

  /* ---------- Framed page (single-page view) ----------
     The page is always framed to fill the canvas. You can zoom in from there up to 200% of its real
     size, and only while zoomed in can you hold Space and drag to move around the page. Panning stops
     at the page edges, so the page can never get lost off screen. */
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  // 'fit' follows the canvas size; a number is a zoom the user chose.
  const [zoomChoice, setZoomChoice] = useState<'fit' | number>('fit');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ x: number; y: number; px: number; py: number; id: number } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [isGrid]);

  const fitZoom =
    viewport.w && viewport.h
      ? Math.min(MAX_ZOOM, (viewport.w - FRAME_GUTTER * 2) / spec.width, (viewport.h - FRAME_GUTTER * 2) / spec.height)
      : DEFAULT_ZOOM.single;
  const zoomLevel = zoomChoice === 'fit' ? fitZoom : Math.min(MAX_ZOOM, Math.max(fitZoom, zoomChoice));
  const isZoomedIn = zoomLevel > fitZoom + 0.001;
  const pageW = spec.width * zoomLevel;
  const pageH = spec.height * zoomLevel;

  // Keep the page from being dragged further than its own edges.
  const clampPan = useCallback(
    (x: number, y: number, pw = pageW, ph = pageH) => {
      const limit = (size: number, view: number, v: number) => {
        if (size + FRAME_GUTTER * 2 <= view) return 0;
        const max = (size - view) / 2 + FRAME_GUTTER;
        return Math.min(max, Math.max(-max, v));
      };
      return { x: limit(pw, viewport.w, x), y: limit(ph, viewport.h, y) };
    },
    [pageW, pageH, viewport.w, viewport.h],
  );

  const pageLeft = (viewport.w - pageW) / 2 + pan.x;
  const pageTop = (viewport.h - pageH) / 2 + pan.y;

  const live = useRef({ zoomLevel, fitZoom, pageLeft, pageTop, isGrid, isZoomedIn });
  live.current = { zoomLevel, fitZoom, pageLeft, pageTop, isGrid, isZoomedIn };

  // Zoom to `next`, keeping the page point under (ax, ay) where it is. Defaults to the canvas centre.
  const zoomTo = useCallback(
    (next: number, ax?: number, ay?: number) => {
      const { zoomLevel: z, fitZoom: fit, pageLeft: left, pageTop: top } = live.current;
      const target = Math.min(MAX_ZOOM, Math.max(fit, next));
      if (target <= fit + 0.001) {
        setZoomChoice('fit');
        setPan({ x: 0, y: 0 });
        return;
      }
      const x = ax ?? viewport.w / 2;
      const y = ay ?? viewport.h / 2;
      const px = (x - left) / z;
      const py = (y - top) / z;
      const pw = spec.width * target;
      const ph = spec.height * target;
      setZoomChoice(target);
      setPan(clampPan(x - px * target - (viewport.w - pw) / 2, y - py * target - (viewport.h - ph) / 2, pw, ph));
    },
    [viewport.w, viewport.h, spec.width, spec.height, clampPan],
  );

  const fitPage = useCallback(() => {
    setZoomChoice('fit');
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoom = (dir: 1 | -1) => {
    if (isGrid) {
      const [min, max] = ZOOM_RANGE.grid;
      setGridZoom((prev) => Math.min(max, Math.max(min, Number((prev + dir * 0.04).toFixed(2)))));
      return;
    }
    zoomTo(dir > 0 ? zoomLevel * ZOOM_STEP : zoomLevel / ZOOM_STEP);
  };

  const resetZoom = () => (isGrid ? setGridZoom(DEFAULT_ZOOM.grid) : fitPage());
  const currentZoom = isGrid ? gridZoom : zoomLevel;

  // A new page, paper size or coming back from the grid starts framed again.
  useEffect(() => {
    fitPage();
  }, [activePageIndex, isGrid, pageSize, fitPage]);

  // Re-clamp when the canvas is resized so the page never ends up stranded.
  useLayoutEffect(() => {
    setPan((p) => {
      const c = clampPan(p.x, p.y);
      return c.x === p.x && c.y === p.y ? p : c;
    });
  }, [clampPan]);

  // Ctrl/Cmd + scroll and trackpad pinch zoom around the pointer, between framed and 200%.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (live.current.isGrid) return;
      e.preventDefault();
      if (!(e.ctrlKey || e.metaKey)) return;
      const rect = el.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      // A mouse-wheel notch is one big delta: step like the buttons. A pinch sends small deltas: follow them.
      const factor = Math.abs(dy) >= 40 ? (dy < 0 ? ZOOM_STEP : 1 / ZOOM_STEP) : Math.exp(-dy * 0.01);
      zoomTo(live.current.zoomLevel * factor, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomTo, isGrid]);

  // Space is the hand tool, but only while zoomed in. Ctrl/Cmd + 0 frames the page, Ctrl/Cmd +/- zoom.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (live.current.isGrid || isTypingTarget(e.target)) return;
      if (e.code === 'Space') {
        if (!live.current.isZoomedIn || isActivatable(e.target)) return;
        e.preventDefault();
        if (!e.repeat) setSpaceHeld(true);
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '0') {
        e.preventDefault();
        fitPage();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomTo(live.current.zoomLevel * ZOOM_STEP);
      } else if (e.key === '-') {
        e.preventDefault();
        zoomTo(live.current.zoomLevel / ZOOM_STEP);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [fitPage, zoomTo]);

  const canPan = !isGrid && isZoomedIn && spaceHeld;

  useEffect(() => {
    if (!canPan) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    window.getSelection()?.removeAllRanges();
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [canPan]);

  // Hold Space and drag. Captured before the page sees it, so blocks are not picked up by accident.
  const onPanPointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    panRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  };

  const onPanPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (!p || p.id !== e.pointerId) return;
    setPan(clampPan(p.px + e.clientX - p.x, p.py + e.clientY - p.y));
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (!p || p.id !== e.pointerId) return;
    panRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setPanning(false);
  };

  const openPage = (idx: number) => {
    onSelectPageIndex(idx);
    setViewMode('single');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#EAE6D6] overflow-hidden relative">
      {/* Canvas Top Bar Controls: Page Tabs, Layout Selector, Title Edit */}
      <div className="px-6 py-2.5 bg-white border-b border-[#E2DEC9] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Page navigation tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => onSelectPageIndex(idx)}
              title={`Go to page ${idx + 1}${p.title ? `: ${p.title}` : ''}`}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                idx === activePageIndex
                  ? 'bg-[#2D2200] text-white shadow-xs'
                  : 'bg-[#FAF8F0] text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Page {idx + 1}
            </button>
          ))}

          <button
            onClick={onAddPage}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg border border-dashed border-[#009BD9] transition-colors"
            title="Add a new blank page"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Page
          </button>
        </div>

        {/* Center: Page Layout Grid Picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B5838] hidden sm:inline">
            Slots:
          </span>
          <div className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] gap-1">
            {LAYOUT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangePageLayout(activePage.id, preset.id)}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                  activePage.layout === preset.id
                    ? 'bg-white text-[#2D2200] shadow-xs'
                    : 'text-[#6B5838] hover:text-[#2D2200]'
                }`}
                title={`Split this page: ${preset.displayName}`}
              >
                {preset.id === '1-full'
                  ? '1 Full'
                  : preset.id === '2-half'
                  ? '2 Halves'
                  : preset.id === '4-quarter'
                  ? '4 Quarters'
                  : preset.id === 'top-half-2-quarter'
                  ? '1/2 + 2/4'
                  : '2/4 + 1/2'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Zoom controls & Page Actions */}
        <div className="flex items-center gap-2">
          {pages.length > 1 && (
            <div className="flex items-center gap-1 mr-2 border-r border-[#E2DEC9] pr-2">
              <button
                onClick={() => onMovePage(activePageIndex, activePageIndex - 1)}
                disabled={activePageIndex === 0}
                className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30 rounded"
                title="Move this page earlier"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMovePage(activePageIndex, activePageIndex + 1)}
                disabled={activePageIndex === pages.length - 1}
                className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30 rounded"
                title="Move this page later"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeletePage(activePageIndex)}
                className="p-1.5 text-[#E52311] hover:bg-red-50 rounded"
                title="Delete this page"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View toggle: one page at a time, or every page side by side */}
          <div
            role="group"
            aria-label="Page view"
            className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] gap-1"
          >
            {([
              { id: 'single', label: 'One page', Icon: FileText },
              { id: 'grid', label: 'All pages', Icon: LayoutGrid },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                aria-pressed={viewMode === id}
                className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                  viewMode === id ? 'bg-white text-[#2D2200] shadow-xs' : 'text-[#6B5838] hover:text-[#2D2200]'
                }`}
                title={id === 'grid' ? 'See all pages side by side' : 'Edit one page at a time'}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] gap-1">
            <button
              onClick={() => handleZoom(-1)}
              disabled={!isGrid && !isZoomedIn}
              className="p-1 text-[#6B5838] hover:text-[#2D2200] rounded disabled:opacity-35 disabled:cursor-default"
              title={isGrid ? 'Make the pages smaller' : 'Zoom out (Ctrl/Cmd + −)'}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              className="text-[11px] font-bold tabular-nums text-[#2D2200] w-10 text-center"
              title={isGrid ? 'Size of the page previews' : 'Current zoom'}
            >
              {Math.round(currentZoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(1)}
              disabled={!isGrid && zoomLevel >= MAX_ZOOM - 0.001}
              className="p-1 text-[#6B5838] hover:text-[#2D2200] rounded disabled:opacity-35 disabled:cursor-default"
              title={isGrid ? 'Make the pages bigger' : 'Zoom in, up to 200% (Ctrl/Cmd + +)'}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 text-[#6B5838] hover:text-[#2D2200] rounded"
              title={isGrid ? 'Reset the preview size' : 'Fit the whole page in the frame (Ctrl/Cmd + 0)'}
              aria-label={isGrid ? 'Reset preview size' : 'Fit page'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Title Quick Editor Banner */}
      <div className="bg-[#FAF8F0] px-6 py-2 border-b border-[#E2DEC9] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <span className="text-[#6B5838] font-bold shrink-0">Worksheet Header Title:</span>
          <input
            type="text"
            value={activePage.title}
            onChange={(e) => onChangePageTitle(activePage.id, e.target.value)}
            placeholder="e.g. Letter Practice or Sunshine Math"
            className="flex-1 px-2.5 py-1 text-xs font-bold text-[#2D2200] bg-white border border-[#E2DEC9] rounded-md focus:outline-none focus:ring-1 focus:ring-[#009BD9]"
          />
        </div>
        <span className="text-[11px] text-[#A39C8E] font-medium hidden md:inline">
          {spec.displayName}
        </span>
      </div>

      {/* To-Scale Interactive Viewport Area. In single-page view the page is framed to fill this area and
          positioned absolutely (centre + pan), so nothing scrolls and the page can never be cut off. */}
      <div
        ref={scrollRef}
        data-canvas="viewport"
        onPointerDownCapture={onPanPointerDownCapture}
        onPointerMove={onPanPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        className={`flex-1 min-h-0 ${isGrid ? 'overflow-auto p-8 flex' : 'overflow-hidden relative select-none'}`}
        style={isGrid ? undefined : { cursor: panning ? 'grabbing' : canPan ? 'grab' : undefined }}
      >
        {isGrid ? (
          <div className="m-auto w-full">
            <p className="text-xs text-[#6B5838] font-medium mb-4">
              Tap a page to choose it. Double-tap or use Edit to open it. Drag blocks onto any page.
            </p>
            <div className="flex flex-wrap gap-6 items-start">
              {pages.map((page, idx) => {
                const pageGeoms = calculateSlotGeometries(pageSize, page.layout);
                const isActive = idx === activePageIndex;
                return (
                  <div key={page.id} className="flex flex-col gap-2 shrink-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Page ${idx + 1}${page.title ? `: ${page.title}` : ''}${isActive ? ' (selected)' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => onSelectPageIndex(idx)}
                      onDoubleClick={() => openPage(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openPage(idx);
                        if (e.key === ' ') {
                          e.preventDefault();
                          onSelectPageIndex(idx);
                        }
                      }}
                      style={{ width: spec.width * gridZoom, height: spec.height * gridZoom }}
                      className={`relative rounded-md bg-white cursor-pointer transition-shadow focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[#009BD9] focus-visible:outline-offset-[3px] ${
                        isActive
                          ? 'outline-[3px] outline outline-[#2D2200] outline-offset-[3px] shadow-[4px_4px_0_#2D2200]'
                          : 'shadow-lg hover:shadow-[3px_3px_0_#2D2200]'
                      }`}
                    >
                      <div
                        style={{
                          width: spec.width,
                          height: spec.height,
                          transform: `scale(${gridZoom})`,
                          transformOrigin: 'top left',
                        }}
                        className="absolute top-0 left-0 select-none pointer-events-none"
                      >
                        <WorksheetPageSvg
                          page={page}
                          pageIndex={idx}
                          pageSize={pageSize}
                          isInteractive={true}
                        />
                        {page.slots.map((slot) => {
                          const geom = pageGeoms[slot.id];
                          if (!geom) return null;
                          return (
                            <DroppableSlotOverlay
                              key={slot.id}
                              pageId={page.id}
                              slot={slot}
                              x={geom.x}
                              y={geom.y}
                              width={geom.width}
                              height={geom.height}
                              isSelected={false}
                              onSelect={() => {}}
                              onOpenSettings={() => {}}
                              onDeleteBlock={() => {}}
                              dropOnly
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between gap-2"
                      style={{ width: spec.width * gridZoom }}
                    >
                      <span className="text-xs font-bold text-[#2D2200] truncate">
                        {idx + 1}. {page.title || `Page ${idx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => openPage(idx)}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-[#2D2200] bg-white border border-[#2D2200] rounded-full hover:bg-[#F2B800] active:bg-[#009BD9] transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add-page tile at the end of the grid */}
              <button
                type="button"
                onClick={onAddPage}
                style={{ width: spec.width * gridZoom, height: spec.height * gridZoom }}
                className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#009BD9] text-[#009BD9] font-bold text-xs hover:bg-white/60 transition-colors"
              >
                <Plus className="w-6 h-6" />
                Add page
              </button>
            </div>
          </div>
        ) : (
        <div
          // The page, framed in the canvas. Its position is the centre plus any Space-drag pan.
          style={{ width: pageW, height: pageH, left: pageLeft, top: pageTop, visibility: viewport.w ? 'visible' : 'hidden' }}
          className="absolute"
        >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            width: `${spec.width}px`,
            height: `${spec.height}px`,
          }}
          className="absolute top-0 left-0 select-none shadow-2xl rounded-xs"
        >
          {/* Base SVG Page (True Vector Output) */}
          <WorksheetPageSvg
            page={activePage}
            pageIndex={activePageIndex}
            pageSize={pageSize}
            selectedInstanceId={selectedSlot?.slot.block?.instanceId}
            onSelectSlot={onSelectSlot}
            onDeleteBlock={onDeleteBlock}
            isInteractive={true}
          />

          {/* Interactive Droppable Overlay Targets */}
          <div className="absolute inset-0 pointer-events-auto">
            {activePage.slots.map((slot) => {
              const geom = geometries[slot.id];
              if (!geom) return null;
              const isSelected = selectedSlot?.slot.id === slot.id;

              return (
                <DroppableSlotOverlay
                  key={slot.id}
                  pageId={activePage.id}
                  slot={slot}
                  x={geom.x}
                  y={geom.y}
                  width={geom.width}
                  height={geom.height}
                  isSelected={isSelected}
                  onSelect={() => onSelectSlot(activePage.id, slot)}
                  onOpenSettings={() => onOpenSettings(activePage.id, slot)}
                  onDeleteBlock={() => onDeleteBlock(activePage.id, slot.id)}
                />
              );
            })}
          </div>
        </div>
        </div>
        )}
      </div>
      {!isGrid && isZoomedIn && !panning && (
        <p className="pointer-events-none absolute bottom-3 right-4 whitespace-nowrap text-[11px] font-bold text-white bg-[#2D2200]/85 rounded-full px-3 py-1.5 shadow-sm">
          Hold Space and drag to move around the page
        </p>
      )}
    </div>
  );
};
