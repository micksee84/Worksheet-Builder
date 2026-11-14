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
import { createPlannerPage, KIND_LABELS, lengthLabel, MAX_MINUTES, placeItem, samplePlanner, STEP, timeLabel } from './plannerModel';
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
  /** A card's height for a length (the schedule's sizes) */
  heightFor: (minutes: number) => number;
  /** Day cards run to the page edge, so their label sits inside the card */
  labelInside?: boolean;
  /** The longest this activity can be (day: until the day ends) */
  maxMinutes: number;
  onResize?: (minutes: number) => void;
}> = ({ pageId, item, box, selected, onSelect, heightFor, labelInside, maxMinutes, onResize }) => {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `planner-item-${pageId}-${item.id}`,
    data: { type: 'planner-item', pageId, itemId: item.id, label: item.label, picture: item.picture },
  });
  // Resizing: the length while the bottom edge is dragged, before it's let go
  const [draft, setDraft] = useState<number | null>(null);
  const start = useRef<{ y: number; minutes: number; scale: number } | null>(null);
  const minutes = item.minutes ?? STEP;
  const shown = draft ?? minutes;
  const live = draft !== null;
  // The card grows and shrinks with its length, 15 minutes at a time
  const h = live ? heightFor(shown) : box.h;
  // How far the handle moves for each 15 minutes
  const perStep = Math.max(4, heightFor(STEP * 2) - heightFor(STEP));
  const label = item.start !== undefined ? `${timeLabel(item.start)}–${timeLabel(item.start + shown)} · ${lengthLabel(shown)}` : lengthLabel(shown);
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
      style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: h }}
      className={`group rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
        isDragging
          ? 'bg-white/70 border-2 border-dashed border-[#A39C8E]'
          : live
          ? 'border-[3px] border-dashed border-[#009BD9] bg-[#009BD9]/10'
          : selected
          ? 'border-[3px] border-[#009BD9] bg-[#009BD9]/5'
          : 'hover:border-2 hover:border-[#009BD9]/60'
      }`}
    >
      {onResize && !isDragging && (
        <>
          {/* Bottom edge: drag to make the activity longer or shorter, in half hours */}
          <div
            role="slider"
            aria-label={`How long ${item.label} takes`}
            aria-valuetext={lengthLabel(shown)}
            aria-valuemin={STEP}
            aria-valuemax={maxMinutes}
            aria-valuenow={shown}
            title="Drag to change how long it takes"
            className={`absolute left-1/2 -translate-x-1/2 -bottom-[7px] h-[14px] w-[44px] max-w-[80%] flex items-center justify-center cursor-ns-resize touch-none ${
              selected || live ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              // Keep the card itself from starting a move
              e.stopPropagation();
              e.preventDefault();
              const root = (e.currentTarget.closest('[data-planner-overlay]') as HTMLElement | null) ?? e.currentTarget;
              const scale = root.getBoundingClientRect().width / (root.offsetWidth || 1);
              start.current = { y: e.clientY, minutes, scale };
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* no live pointer to capture */
              }
              setDraft(minutes);
            }}
            onPointerMove={(e) => {
              const s = start.current;
              if (!s) return;
              const dy = (e.clientY - s.y) / s.scale;
              const steps = Math.round(dy / perStep);
              setDraft(Math.max(STEP, Math.min(maxMinutes, s.minutes + steps * STEP)));
            }}
            onPointerUp={(e) => {
              const s = start.current;
              start.current = null;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* already released */
              }
              if (s && draft !== null && draft !== s.minutes) onResize(draft);
              setDraft(null);
            }}
            onPointerCancel={() => {
              start.current = null;
              setDraft(null);
            }}
          >
            <span className="block h-[5px] w-full rounded-full bg-[#009BD9] border border-white shadow" />
          </div>
          {/* How long, beside the card while it's resized */}
          {live && (
            <span
              className={`absolute bottom-0 translate-y-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#009BD9] text-white text-[10px] font-extrabold shadow pointer-events-none z-10 ${
                labelInside ? 'right-2' : 'left-full ml-1'
              }`}
            >
              {label}
            </span>
          )}
        </>
      )}
    </div>
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
  /** Sets an activity's length (the drag handle on the card) */
  onResizeItem?: (itemId: string, minutes: number) => void;
}> = ({ page, pageSize, selectedItemId, onSelectItem, onBackground, onChooseKind, onResizeItem }) => {
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
    const target = dropTarget(g, planner, hover.x, hover.y - GRAB_TOP, probe.minutes ?? STEP, moving?.id);
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
      data-planner-overlay=""
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
            heightFor={g.heightFor ?? (() => b.h)}
            labelInside={planner.kind === 'day'}
            maxMinutes={Math.min(MAX_MINUTES, planner.endHour * 60 - (item.start ?? planner.startHour * 60))}
            onResize={
              onResizeItem && (planner.kind === 'day' || planner.kind === 'week') ? (m) => onResizeItem(b.id, m) : undefined
            }
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
