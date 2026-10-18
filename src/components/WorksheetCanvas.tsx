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

import React, { useState } from 'react';
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
          <span className="text-xs font-black text-[#009BD9] bg-[#FAF8F0] px-3 py-1.5 rounded-full border border-[#009BD9] shadow-sm">
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
            title="Edit Settings"
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
            title="Remove block"
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
  const [zoomLevel, setZoomLevel] = useState<number>(0.85); // 0.65 to 1.2
  const activePage = pages[activePageIndex] || pages[0];
  const spec = PAGE_SPECS[pageSize as keyof typeof PAGE_SPECS] || PAGE_SPECS.letter;
  const geometries = calculateSlotGeometries(pageSize, activePage.layout);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.2, Math.max(0.5, Number((prev + delta).toFixed(2)))));
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
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#009BD9] hover:bg-[#FAF8F0] rounded-lg border border-dashed border-[#009BD9] transition-colors"
            title="Add a new page"
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
                title={preset.displayName}
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
                title="Move page left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMovePage(activePageIndex, activePageIndex + 1)}
                disabled={activePageIndex === pages.length - 1}
                className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30 rounded"
                title="Move page right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeletePage(activePageIndex)}
                className="p-1.5 text-[#E52311] hover:bg-red-50 rounded"
                title="Delete current page"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] gap-1">
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1 text-[#6B5838] hover:text-[#2D2200] rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-[#2D2200] w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1 text-[#6B5838] hover:text-[#2D2200] rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(0.85)}
              className="p-1 text-[#6B5838] hover:text-[#2D2200] rounded"
              title="Reset Zoom"
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

      {/* To-Scale Interactive Viewport Area */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.1s ease-out',
            width: `${spec.width}px`,
            height: `${spec.height}px`,
          }}
          className="relative shrink-0 select-none shadow-2xl rounded-xs"
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
    </div>
  );
};
