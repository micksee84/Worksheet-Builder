/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner page drag targets
 *
 * Sits over a planner page on the canvas, in page points (the canvas scales it with the
 * page). The whole page is one drop target; each activity is a handle you can click to
 * edit or drag to move. While something is dragged, a dashed outline shows exactly where
 * it will land: the time on a day, the spot in a week column or list, or the side.
 */

import React, { useRef, useState } from 'react';
import { DragMoveEvent, useDndContext, useDndMonitor, useDraggable, useDroppable } from '@dnd-kit/core';
import { Page, PageSizeId, PlannerItem, PlannerKind } from '../types';
import { plannerGeometry, dropTarget, Box } from './plannerLayout';
import { createPlannerPage, KIND_LABELS, placeItem, samplePlanner, STEP } from './plannerModel';
import { Mini } from './WhatAreYouMaking';
import { getActivity } from './activities';

/** How far below the pointer a dragged card's top sits, in page points */
export const GRAB_TOP = 8;

const ItemHandle: React.FC<{
  pageId: string;
  item: PlannerItem;
  box: Box;
  selected: boolean;
  onSelect: () => void;
}> = ({ pageId, item, box, selected, onSelect }) => {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `planner-item-${pageId}-${item.id}`,
    data: { type: 'planner-item', pageId, itemId: item.id, label: item.label, picture: item.picture },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-opens-settings=""
      aria-label={`${item.label}: drag to move, click to change`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h }}
      className={`rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
        isDragging
          ? 'bg-white/70 border-2 border-dashed border-[#A39C8E]'
          : selected
          ? 'border-[3px] border-[#009BD9] bg-[#009BD9]/5'
          : 'hover:border-2 hover:border-[#009BD9]/60'
      }`}
    />
  );
};

export const PlannerOverlay: React.FC<{
  page: Page;
  pageSize: PageSizeId;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onBackground: () => void;
  /** Picks the planner's type from the start screen */
  onChooseKind?: (kind: PlannerKind) => void;
}> = ({ page, pageSize, selectedItemId, onSelectItem, onBackground, onChooseKind }) => {
  const planner = page.planner!;
  const g = plannerGeometry(pageSize, page.showDateName, planner);
  const { setNodeRef } = useDroppable({ id: `planner-drop-${page.id}`, data: { type: 'planner-target', pageId: page.id } });
  const { active } = useDndContext();
  const drag = active?.data.current as { type?: string; itemId?: string; activityId?: string; pageId?: string } | undefined;
  const draggingHere = drag?.type === 'planner-activity' || (drag?.type === 'planner-item' && drag.pageId === page.id);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const surface = useRef<HTMLDivElement | null>(null);

  // Follow the drag itself: the dragged card sits under the pointer, so this page never
  // gets pointer events of its own while something is dragged.
  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      const el = surface.current;
      const start = event.activatorEvent as PointerEvent | TouchEvent | null;
      const pt = start && ('touches' in start ? start.touches[0] ?? start.changedTouches[0] : start);
      if (!el || !pt) return;
      const rect = el.getBoundingClientRect();
      const x = pt.clientX + event.delta.x;
      const y = pt.clientY + event.delta.y;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setHover(null);
        return;
      }
      const scale = rect.width / el.offsetWidth;
      setHover({ x: (x - rect.left) / scale, y: (y - rect.top) / scale });
    },
    onDragEnd: () => setHover(null),
    onDragCancel: () => setHover(null),
  });

  // Where the dragged thing would land: lay the planner out as if it were dropped, and
  // outline that box.
  let ghost: Box | null = null;
  if (draggingHere && hover) {
    const moving = drag?.type === 'planner-item' ? planner.items.find((i) => i.id === drag.itemId) : undefined;
    const activity = drag?.activityId ? getActivity(drag.activityId) : undefined;
    const probe: PlannerItem = moving ?? { id: '__probe__', label: activity?.label ?? '', picture: activity?.picture ?? '', minutes: activity?.minutes ?? STEP };
    const target = dropTarget(g, planner, hover.x, hover.y - GRAB_TOP, probe.minutes ?? STEP);
    const after = plannerGeometry(pageSize, page.showDateName, placeItem(planner, probe, target));
    ghost = after.items.find((b) => b.id === probe.id) ?? null;
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        surface.current = el;
      }}
      className="absolute inset-0"
      onClick={onBackground}
    >
      {g.items.map((b) => {
        const item = planner.items.find((i) => i.id === b.id);
        if (!item) return null;
        return (
          <ItemHandle
            key={b.id}
            pageId={page.id}
            item={item}
            box={b}
            selected={selectedItemId === b.id}
            onSelect={() => onSelectItem(b.id)}
          />
        );
      })}
      {/* Start screen: a new planner asks what kind it is, until one is picked or an
          activity is added. The toolbar switcher changes it later. */}
      {planner.kindChosen === false && planner.items.length === 0 && !draggingHere && onChooseKind && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/85" onClick={(e) => e.stopPropagation()}>
          <div className="w-[80%] text-center">
            <h3 className="text-2xl font-extrabold text-[#2D2200]">What kind of planner?</h3>
            <p className="text-sm text-[#6B5838] mt-1 mb-5">Pick one to start. You can switch any time from the bar above.</p>
            <div className="grid grid-cols-2 gap-4">
              {(['day', 'week', 'checklist', 'first-then'] as PlannerKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChooseKind(k)}
                  className="flex flex-col items-center gap-2 p-3 bg-white border-2 border-[#E2DEC9] rounded-xl hover:border-[#2D2200] hover:shadow-[3px_3px_0_#2D2200] focus:outline-none focus-visible:border-[#009BD9] transition-all"
                >
                  <Mini page={{ ...createPlannerPage(k, 0), id: `start_${k}`, planner: samplePlanner(k) }} pageSize={pageSize} size={120} />
                  <span className="text-base font-extrabold text-[#2D2200]">{k === 'day' ? 'Daily routine' : k === 'week' ? 'Week plan' : k === 'checklist' ? 'Checklist' : 'First–then board'}</span>
                  <span className="text-xs text-[#6B5838] leading-snug">{KIND_LABELS[k].blurb}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {ghost && (
        <div
          className="absolute rounded-lg border-[3px] border-dashed border-[#009BD9] bg-[#009BD9]/15 pointer-events-none"
          style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
        />
      )}
    </div>
  );
};
