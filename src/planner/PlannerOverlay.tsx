/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner page drag targets
 *
 * Sits over a planner page on the canvas, in page points (the canvas scales it with the
 * page). The whole page is one drop target; each activity is a handle you can click to
 * edit or drag to move. While something is dragged, a dashed outline shows exactly where
 * it will land: the time on a day, the spot in a week column or list, or the side.
 */

import React, { useState } from 'react';
import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Page, PageSizeId, PlannerItem } from '../types';
import { plannerGeometry, dropTarget, Box } from './plannerLayout';
import { placeItem, STEP } from './plannerModel';
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
}> = ({ page, pageSize, selectedItemId, onSelectItem, onBackground }) => {
  const planner = page.planner!;
  const g = plannerGeometry(pageSize, page.showDateName, planner);
  const { setNodeRef } = useDroppable({ id: `planner-drop-${page.id}`, data: { type: 'planner-target', pageId: page.id } });
  const { active } = useDndContext();
  const drag = active?.data.current as { type?: string; itemId?: string; activityId?: string; pageId?: string } | undefined;
  const draggingHere = drag?.type === 'planner-activity' || (drag?.type === 'planner-item' && drag.pageId === page.id);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

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
      ref={setNodeRef}
      className="absolute inset-0"
      onClick={onBackground}
      onPointerMove={(e) => {
        if (!draggingHere) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const scale = rect.width / e.currentTarget.offsetWidth;
        setHover({ x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale });
      }}
      onPointerLeave={() => setHover(null)}
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
      {ghost && (
        <div
          className="absolute rounded-lg border-2 border-dashed border-[#009BD9] bg-[#009BD9]/10 pointer-events-none"
          style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
        />
      )}
    </div>
  );
};
