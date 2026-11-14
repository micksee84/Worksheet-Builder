/**
 * @license
 * Sunshine Brigade Worksheet Builder
 * Root Application Component
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  DragMoveEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  Modifier,
} from '@dnd-kit/core';
import { getEventCoordinates } from '@dnd-kit/utilities';

import {
  Worksheet,
  Page,
  Slot,
  PageLayoutPreset,
  BlockInstance,
  BlockDefinition,
  PageSizeId,
  PlannerData,
  PlannerItem,
  PlannerKind,
} from './types';
import { PAGE_SPECS, CharacterId } from './config/appConfig';
import {
  getAllBlocks,
  getBlockById,
  createBlockInstance,
} from './registry/blockRegistry';
import { createSlotsForPreset } from './utils/layoutPresets';
import {
  saveWorksheetToStorage,
  loadWorksheetFromStorage,
  clearWorksheetStorage,
} from './utils/storage';
import { useAuth } from './auth/AuthProvider';
import { useAccountSync } from './auth/useAccountSync';
import {
  buildShareUrl,
  clearShareHash,
  decodeWorksheetFromHash,
} from './utils/shareLink';
import { exportWorksheetToPdf, printWorksheetNative } from './utils/pdf/pdfExporter';
import { trackEvent } from './utils/analytics';
import { TemplateItem, getTemplateById } from './templates';

import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { WorksheetCanvas } from './components/WorksheetCanvas';
import { PagesPanel } from './components/PagesPanel';
import { dropKind, firstFreeSlot, isSlotBlockDrag, moveBlock, SlotBlockDrag } from './utils/blockMoves';
import { Trash2 } from './components/icons';
import { RemoveBlockConfirm } from './components/RemoveBlockConfirm';
import { SaveWorksheetDialog } from './components/SaveWorksheetDialog';
import { deleteFromLibrary, isInBrowserLibrary, isUnnamed, LibrarySource, loadFromLibrary, saveToLibrary } from './utils/worksheetLibrary';
import { SaveFirstDialog } from './components/SaveFirstDialog';
import type { SaveState } from './components/TopBar';
import { BlockSettingsDrawer } from './components/BlockSettingsDrawer';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { PrintDoneToast, PrintDoneKind } from './components/PrintDoneToast';
import { PrintContainer } from './components/PrintContainer';
import { TooltipLayer } from './components/TooltipLayer';
import { MyWorksheetsModal } from './components/MyWorksheetsModal';
import { PlannerLibrary, PictureThumb } from './planner/PlannerLibrary';
import { PlannerDrawer } from './planner/PlannerDrawer';
import { WhatAreYouMaking, MakeChoice } from './planner/WhatAreYouMaking';
import { GRAB_TOP } from './planner/PlannerOverlay';
import { plannerGeometry, dropTarget } from './planner/plannerLayout';
import {
  addItem,
  createPlannerPage,
  itemFromActivity,
  KIND_LABELS,
  newItemId,
  normalize,
  placeItem,
  samplePlanner,
  flow,
  splitBlock,
  takeOut,
  blockOf,
  STEP,
  switchKind,
  tasksOf,
} from './planner/plannerModel';
import { getActivity } from './planner/activities';
import { pageDims } from './config/appConfig';
import { pointerNow } from './utils/pointerTracker';

/** A blank worksheet for New: one page, two empty halves. Keeps the current paper size. */
function createBlankWorksheet(pageSize: Worksheet['pageSize'] = 'letter'): Worksheet {
  const now = Date.now();
  return {
    id: `ws_${now}`,
    title: 'Untitled worksheet',
    pageSize,
    createdAt: now,
    updatedAt: now,
    pages: [{ id: 'page_1', title: 'Page 1', layout: '2-half', showDateName: true, slots: createSlotsForPreset('2-half') }],
  };
}

/**
 * Keeps the drag card under the mouse. By default the overlay starts at the top-left of
 * whatever was picked up, so a block grabbed from the middle of a big slot trails far
 * from the pointer. This moves the card so the pointer sits just inside its top-left
 * corner, wherever it was grabbed, leaving the drop target visible.
 */
const GRAB_POINT = { x: 24, y: 22 };
const followPointer: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!activatorEvent || !draggingNodeRect) return transform;
  const start = getEventCoordinates(activatorEvent);
  if (!start) return transform;
  return {
    ...transform,
    x: transform.x + start.x - draggingNodeRect.left - GRAB_POINT.x,
    y: transform.y + start.y - draggingNodeRect.top - GRAB_POINT.y,
  };
};

/**
 * The name and date line on worksheet pages: every page, or only the first worksheet page.
 * Planner pages keep their own switch.
 */
function applyNameDate(ws: Worksheet): Worksheet {
  const first = ws.nameDate === 'first';
  const firstSheet = ws.pages.findIndex((p) => !p.planner);
  let changed = false;
  const pages = ws.pages.map((p, i) => {
    if (p.planner) return p;
    const want = !first || i === firstSheet;
    if (p.showDateName === want) return p;
    changed = true;
    return { ...p, showDateName: want };
  });
  return changed ? { ...ws, pages } : ws;
}

export default function App() {
  const { user, signOut } = useAuth();

  // True when the builder opened on a blank page (no share link, nothing open in this tab)
  const startedFreshRef = useRef(false);

  // Main worksheet state
  const [worksheet, setWorksheet] = useState<Worksheet>(() => {
    // 1. Try URL hash first
    const fromHash = decodeWorksheetFromHash();
    if (fromHash) return fromHash;
    // 2. Then the worksheet already open in this tab (a refresh)
    const fromStorage = loadWorksheetFromStorage();
    if (fromStorage) return fromStorage;
    // 3. Otherwise every start is a blank page
    startedFreshRef.current = true;
    return createBlankWorksheet();
  });

  // Undo / Redo history
  const [history, setHistory] = useState<Worksheet[]>([]);
  const [future, setFuture] = useState<Worksheet[]>([]);

  // Navigation & selection state
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedSlotRef, setSelectedSlotRef] = useState<{
    pageId: string;
    slotId: string;
  } | null>(null);

  // Inspector & modal states
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  // Block list view: whatever the grown-up last chose (remembered in this browser), except
  // that on smaller screens it goes slim while a block's settings are open (see autoSlim).
  const [slimPreferred, setSlimPreferred] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sb.blocksSlim') === '1';
    } catch {
      return false;
    }
  });
  const [fullWhileEditing, setFullWhileEditing] = useState(false);
  useEffect(() => {
    if (!isInspectorOpen) setFullWhileEditing(false);
  }, [isInspectorOpen]);
  // Auto-slim while editing: only when the window is tight on room, and only if the
  // grown-up hasn't switched it off (remembered in this browser).
  const ROOMY_WIDTH = 1600;
  const [autoSlim, setAutoSlim] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sb.autoSlim') !== '0';
    } catch {
      return true;
    }
  });
  const handleToggleAutoSlim = (on: boolean) => {
    setAutoSlim(on);
    setFullWhileEditing(false);
    try {
      localStorage.setItem('sb.autoSlim', on ? '1' : '0');
    } catch {
      /* private window: just not remembered */
    }
  };
  const [isRoomy, setIsRoomy] = useState(() => typeof window === 'undefined' || window.innerWidth >= ROOMY_WIDTH);
  useEffect(() => {
    const onResize = () => setIsRoomy(window.innerWidth >= ROOMY_WIDTH);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const autoSlimNow = isInspectorOpen && autoSlim && !isRoomy;
  const isSidebarSlim = autoSlimNow ? !fullWhileEditing : slimPreferred;
  const handleToggleSidebarSlim = () => {
    if (autoSlimNow) {
      setFullWhileEditing((v) => !v);
      return;
    }
    const next = !slimPreferred;
    setSlimPreferred(next);
    try {
      localStorage.setItem('sb.blocksSlim', next ? '1' : '0');
    } catch {
      /* private window: just not remembered */
    }
  };
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [printDone, setPrintDone] = useState<PrintDoneKind | null>(null);
  const dismissPrintDone = useCallback(() => setPrintDone(null), []);
  const [isMyWorksheetsOpen, setIsMyWorksheetsOpen] = useState(false);

  // Drag and drop state
  const [activeDragItem, setActiveDragItem] = useState<{
    type: 'library-block' | 'slot-block' | 'planner-activity' | 'planner-item';
    blockId: string;
    /** Planner drags: what the drag card shows */
    label?: string;
    picture?: string;
  } | null>(null);

  // Planner pages: the selected activity, whether the planner panel is open, and the
  // "What are you making?" chooser (for New or Add page)
  const [plannerSel, setPlannerSel] = useState<{ pageId: string; itemId: string } | null>(null);
  const [isPlannerPanelOpen, setIsPlannerPanelOpen] = useState(false);
  const [makeChooser, setMakeChooser] = useState<'new' | 'add' | null>(null);

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 180, tolerance: 6 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);
  // Placed blocks are big, so they target whatever is under the pointer (a slot, a page
  // thumbnail, or nothing when off the page). Library cards keep the forgiving box overlap.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const underPointer = pointerWithin(args);
    // Placed planner cards too, so letting go just off the page removes them, as with blocks.
    const moving = args.active.data.current as { type?: string } | undefined;
    if (underPointer.length || isSlotBlockDrag(moving) || moving?.type === 'planner-item') return underPointer;
    return rectIntersection(args);
  }, []);

  // Always-current copy of the worksheet, so updates never work from a stale value
  // and history can be recorded outside React's state updater (which may run twice).
  const worksheetRef = useRef(worksheet);

  const setWorksheetNow = useCallback((next: Worksheet) => {
    worksheetRef.current = next;
    setWorksheet(next);
  }, []);

  // A share link has been read into state at this point. Remove it from the address bar
  // so refreshing later loads the latest autosaved work, not the original link.
  useEffect(() => {
    clearShareHash();
  }, []);

  // Autosave to localStorage on worksheet update
  useEffect(() => {
    saveWorksheetToStorage(worksheet);
  }, [worksheet]);

  // Open a whole worksheet (from the account, or a new one) with a clean undo history.
  const openWorksheet = useCallback(
    (next: Worksheet) => {
      setWorksheetNow(next);
      setHistory([]);
      setFuture([]);
      setActivePageIndex(0);
      setSelectedSlotRef(null);
      setIsInspectorOpen(false);
    },
    [setWorksheetNow]
  );

  // Save to the signed-in account a moment after each change.
  const accountSync = useAccountSync({
    worksheet,
    startedFresh: startedFreshRef.current,
    onOpenWorksheet: openWorksheet,
  });


  const handleSignOut = useCallback(async () => {
    await accountSync.saveNow();
    await signOut();
    // This browser's copy belongs to the account that just signed out.
    clearWorksheetStorage();
  }, [accountSync, signOut]);

  // Helper to push state changes with history
  const updateWorksheet = useCallback(
    (updater: (prev: Worksheet) => Worksheet) => {
      const prev = worksheetRef.current;
      const next = applyNameDate({ ...updater(prev), updatedAt: Date.now() });
      setHistory((h) => [...h.slice(-19), prev]);
      setFuture([]);
      setWorksheetNow(next);
      return next;
    },
    [setWorksheetNow]
  );

  // ---------------------------------------------------------------- Save and Open
  // Saved worksheets live in the account when signed in (always, on the website), or in
  // this browser when sign-in is off. Saving is free and unlimited.
  const librarySource: LibrarySource = accountSync.active ? 'account' : 'browser';
  const savedKey = (ws: Worksheet) => `${ws.id}:${ws.updatedAt}`;
  // Browser library: which version of the open worksheet is saved there.
  const [browserSavedKey, setBrowserSavedKey] = useState<string | null>(() =>
    isInBrowserLibrary(worksheet.id) ? savedKey(worksheet) : null
  );
  const [manualSave, setManualSave] = useState<'idle' | 'saving' | 'error'>('idle');
  const [isNamingSave, setIsNamingSave] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // Browser library: once a worksheet is saved, later changes keep it up to date.
  useEffect(() => {
    if (librarySource !== 'browser' || browserSavedKey === null) return;
    if (!isInBrowserLibrary(worksheet.id) || browserSavedKey === savedKey(worksheet)) return;
    const timer = setTimeout(async () => {
      if (await saveToLibrary('browser', worksheet)) setBrowserSavedKey(savedKey(worksheet));
    }, 800);
    return () => clearTimeout(timer);
  }, [worksheet, librarySource, browserSavedKey]);

  const saveState: SaveState = (() => {
    if (manualSave === 'saving') return 'saving';
    if (manualSave === 'error') return 'error';
    if (librarySource === 'account') {
      if (isUnnamed(worksheet)) return 'unsaved';
      if (accountSync.status === 'saving') return 'saving';
      if (accountSync.status === 'error') return 'error';
      return 'saved';
    }
    if (browserSavedKey === null || !isInBrowserLibrary(worksheet.id)) return 'unsaved';
    return browserSavedKey === savedKey(worksheet) ? 'saved' : 'saving';
  })();

  /** Save now, renaming first when a name is given. */
  const saveWorksheet = useCallback(
    async (name?: string) => {
      let ws = worksheetRef.current;
      if (name && name !== ws.title) ws = updateWorksheet((prev) => ({ ...prev, title: name }));
      setManualSave('saving');
      const ok = await saveToLibrary(librarySource, ws);
      if (ok && librarySource === 'account') accountSync.markSaved(ws);
      if (ok && librarySource === 'browser') setBrowserSavedKey(savedKey(ws));
      setManualSave(ok ? 'idle' : 'error');
      if (ok) trackEvent('worksheet_saved', { pageCount: ws.pages.length });
    },
    [librarySource, accountSync, updateWorksheet]
  );

  const handleSave = useCallback(() => {
    if (isUnnamed(worksheetRef.current)) setIsNamingSave(true);
    else saveWorksheet();
  }, [saveWorksheet]);

  // Ctrl or Cmd + S saves, like any other app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  /** Before switching worksheets, make sure the open one is saved where it lives. */
  const flushCurrent = useCallback(async () => {
    if (librarySource === 'account') await accountSync.saveNow();
    else if (isInBrowserLibrary(worksheetRef.current.id)) await saveToLibrary('browser', worksheetRef.current);
  }, [librarySource, accountSync]);

  // ---------------------------------------------------------------- Leaving a worksheet
  // New, opening another worksheet, or picking a template all leave the open worksheet.
  // If it has never been saved and has been changed, ask first: Save / Don't save / Cancel.
  // A saved worksheet keeps saving on its own, so leaving it never asks.
  const hasUnsavedWork = saveState === 'unsaved' && worksheet.updatedAt !== worksheet.createdAt;
  const [leavePrompt, setLeavePrompt] = useState<{ name: string; run: (discard: boolean) => void } | null>(null);
  const afterSaveRef = useRef<(() => void) | null>(null);

  const guardLeave = (run: (discard: boolean) => void) => {
    if (hasUnsavedWork) setLeavePrompt({ name: isUnnamed(worksheet) ? 'Untitled worksheet' : worksheet.title, run });
    else run(false);
  };

  /** Save the worksheet being left, or (Don't save) drop the copy auto-saved to the account. */
  const leaveCurrent = async (discard: boolean) => {
    if (!discard) return flushCurrent();
    if (librarySource === 'account') await deleteFromLibrary('account', worksheetRef.current.id);
  };

  const handleOpenSaved = (id: string) =>
    guardLeave(async (discard) => {
      await leaveCurrent(discard);
      const loaded = await loadFromLibrary(librarySource, id);
      if (!loaded) return;
      openWorksheet(loaded);
      if (librarySource === 'account') accountSync.markSaved(loaded);
      else setBrowserSavedKey(savedKey(loaded));
      setManualSave('idle');
      setIsMyWorksheetsOpen(false);
    });

  const handleNewWorksheet = () => setMakeChooser('new');

  // Closing the tab with unsaved work: the browser shows its own "Leave site?" warning.
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedWork]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setFuture((f) => [worksheetRef.current, ...f]);
    setWorksheetNow(previous);
    setActivePageIndex((idx) => Math.min(idx, previous.pages.length - 1));
  }, [history, setWorksheetNow]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, worksheetRef.current]);
    setWorksheetNow(next);
    setActivePageIndex((idx) => Math.min(idx, next.pages.length - 1));
  }, [future, setWorksheetNow]);

  // Active page safe access
  const activePage = worksheet.pages[activePageIndex] || worksheet.pages[0];

  // Currently selected slot and its block definition
  const selectedSlot = activePage.slots.find((s) => s.id === selectedSlotRef?.slotId) || null;
  const selectedBlockDef = selectedSlot?.block ? getBlockById(selectedSlot.block.blockId) || null : null;

  // Add a block to the first empty slot on a page.
  // If the page is full, never overwrite an activity: start a new page right after it.
  // Either way the page that receives the block is the one shown.
  const addBlockToPage = useCallback(
    (targetIdx: number, blockId: string) => {
      const current = worksheetRef.current;
      const pageIdx = Math.max(0, Math.min(targetIdx, current.pages.length - 1));
      const page = current.pages[pageIdx];
      const emptySlot = page.slots.find((s) => s.block === null);

      if (emptySlot) {
        updateWorksheet((prev) => ({
          ...prev,
          pages: prev.pages.map((p, idx) =>
            idx !== pageIdx
              ? p
              : {
                  ...p,
                  slots: p.slots.map((s) =>
                    s.id === emptySlot.id ? { ...s, block: createBlockInstance(blockId) } : s
                  ),
                }
          ),
        }));
        setActivePageIndex(pageIdx);
        trackEvent('block_added', { blockId, pageIndex: pageIdx });
      } else {
        const slots = createSlotsForPreset(page.layout);
        slots[0].block = createBlockInstance(blockId);
        const newPage: Page = {
          id: `page_${Date.now()}`,
          title: page.title,
          layout: page.layout,
          showDateName: page.showDateName,
          slots,
        };
        updateWorksheet((prev) => {
          const pages = [...prev.pages];
          pages.splice(pageIdx + 1, 0, newPage);
          return { ...prev, pages };
        });
        setActivePageIndex(pageIdx + 1);
        trackEvent('page_added', { pageCount: current.pages.length + 1 });
        trackEvent('block_added', { blockId, pageIndex: pageIdx + 1 });
      }
    },
    [updateWorksheet]
  );

  // Tap + in the library: add to the page that is open.
  const handleAddBlockToActivePage = useCallback(
    (blockId: string) => {
      addBlockToPage(activePageIndex, blockId);
      // Close mobile drawer if open
      setIsMobileSidebarOpen(false);
    },
    [activePageIndex, addBlockToPage]
  );

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data && data.type === 'library-block') {
      setActiveDragItem({
        type: 'library-block',
        blockId: data.blockId,
      });
    } else if (isSlotBlockDrag(data)) {
      setActiveDragItem({ type: 'slot-block', blockId: data.blockId });
    } else if (data && (data.type === 'planner-activity' || data.type === 'planner-item')) {
      setActiveDragItem({ type: data.type, blockId: '', label: data.label, picture: data.picture });
    }
  };

  /** Move (or swap) a placed block, and keep the settings panel on the block it was showing. */
  const movePlacedBlock = (drag: SlotBlockDrag, target: { pageId: string; slotId: string }) => {
    const source = { pageId: drag.sourcePageId, slotId: drag.sourceSlotId };
    updateWorksheet((prev) => moveBlock(prev, source, target));
    setSelectedSlotRef((sel) => {
      if (!sel) return sel;
      if (sel.pageId === source.pageId && sel.slotId === source.slotId) return target;
      if (sel.pageId === target.pageId && sel.slotId === target.slotId) return source;
      return sel;
    });
    trackEvent('block_moved', { blockId: drag.blockId });
  };

  // A placed block dragged off the page and let go asks before it is removed.
  const [dragOffPage, setDragOffPage] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ name: string; title?: string; remove: () => void } | null>(null);
  const isOffPage = (event: DragMoveEvent | DragEndEvent) => {
    if (event.over) return false; // over a slot or a page thumbnail
    const start = event.activatorEvent as PointerEvent | TouchEvent;
    const point = 'touches' in start ? start.touches[0] ?? start.changedTouches[0] : start;
    if (!point) return false;
    const now = pointerNow() ?? { x: point.clientX + event.delta.x, y: point.clientY + event.delta.y };
    const { x, y } = now;
    const page = document.querySelector('[data-worksheet-page]')?.getBoundingClientRect();
    if (!page) return false;
    return x < page.left || x > page.right || y < page.top || y > page.bottom;
  };
  const handleDragMove = (event: DragMoveEvent) => {
    const moving = event.active.data.current;
    if (!isSlotBlockDrag(moving) && moving?.type !== 'planner-item') return;
    const off = isOffPage(event);
    setDragOffPage((prev) => (prev === off ? prev : off));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveDragItem(null);
    setDragOffPage(false);

    // Planner activities: dropped on a planner page, they land where the pointer is
    // (a time, a day, a spot in the list, or a side). A placed one dragged off the page
    // is removed (Undo brings it back).
    const pdata = active.data.current as { type?: string; activityId?: string; pageId?: string; itemId?: string; taskId?: string } | undefined;
    if (pdata?.type === 'planner-activity' || pdata?.type === 'planner-item') {
      const target = over?.data.current as { type?: string; pageId?: string } | undefined;
      if (target?.type === 'planner-target' && target.pageId) {
        const point = pagePoint(event);
        if (point) dropOnPlanner(target.pageId, point, pdata);
      } else if (pdata.type === 'planner-item' && !over && isOffPage(event) && pdata.pageId && pdata.itemId) {
        // Let go off the page: ask first, like a worksheet block. A task pulled out of a
        // block takes just that task away.
        const pageId = pdata.pageId;
        const itemId = pdata.itemId;
        const taskId = pdata.taskId;
        const planner = worksheetRef.current.pages.find((pg) => pg.id === pageId)?.planner;
        const item = planner?.items.find((i) => i.id === itemId);
        const task = item && taskId ? tasksOf(item).find((t) => t.id === taskId) : undefined;
        setPendingRemove(
          taskId
            ? {
                title: 'Remove this task?',
                name: task?.label || 'This task',
                remove: () => updatePlanner(pageId, (p) => takeOut(p, itemId, taskId)?.planner ?? p),
              }
            : { name: item?.label || 'This activity', remove: () => removePlannerItem(pageId, itemId) }
        );
      }
      return;
    }

    // Placed block let go off the page: remove it.
    if (!over) {
      const dragged = active.data.current;
      if (isSlotBlockDrag(dragged) && isOffPage(event)) {
        const { sourcePageId, sourceSlotId } = dragged;
        setPendingRemove({
          name: getBlockById(dragged.blockId)?.displayName || 'This activity',
          remove: () => handleDeleteBlock(sourcePageId, sourceSlotId),
        });
      }
      return;
    }

    const overData = over.data.current;
    const activeData = active.data.current;

    // A placed block dragged to another slot: move it, or swap with the block there.
    if (isSlotBlockDrag(activeData)) {
      if (overData?.type === 'slot-target') {
        const page = worksheetRef.current.pages.find((p) => p.id === overData.pageId);
        const slot = page?.slots.find((s) => s.id === overData.slotId);
        if (!slot) return;
        const kind = dropKind(activeData, overData.pageId, slot);
        if (kind === 'move' || kind === 'swap') movePlacedBlock(activeData, { pageId: overData.pageId, slotId: slot.id });
      } else if (overData?.type === 'page-thumb') {
        const page = worksheetRef.current.pages.find((p) => p.id === overData.pageId);
        const free = page ? firstFreeSlot(page, activeData) : null;
        if (page && free) movePlacedBlock(activeData, { pageId: page.id, slotId: free.id });
      }
      return;
    }

    // Dropped on a page in the pages panel: goes in that page's next empty space.
    if (overData && overData.type === 'page-thumb' && activeData && activeData.type === 'library-block') {
      const idx = worksheetRef.current.pages.findIndex((p) => p.id === overData.pageId);
      if (idx !== -1) addBlockToPage(idx, activeData.blockId);
      return;
    }

    if (overData && overData.type === 'slot-target' && activeData && activeData.type === 'library-block') {
      const { pageId, slotId } = overData;
      const blockId = activeData.blockId;

      updateWorksheet((prev) => {
        const newPages = prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            slots: p.slots.map((s) =>
              s.id === slotId ? { ...s, block: createBlockInstance(blockId) } : s
            ),
          };
        });
        return { ...prev, pages: newPages };
      });

      trackEvent('block_added', { blockId, size: overData.size });
    }
  };


  // ---------------------------------------------------------------- Planner pages
  /** Change one planner page; every change goes through undo like the rest of the builder */
  const updatePlanner = useCallback(
    (pageId: string, fn: (p: PlannerData) => PlannerData) => {
      updateWorksheet((prev) => ({
        ...prev,
        pages: prev.pages.map((pg) => (pg.id === pageId && pg.planner ? { ...pg, planner: fn(pg.planner) } : pg)),
      }));
    },
    [updateWorksheet]
  );

  /** Where the pointer was let go, in page points on the open page */
  const pagePoint = (event: DragEndEvent): { x: number; y: number } | null => {
    // Where the pointer actually is (start + delta can be off by the drag's start distance)
    const start = event.activatorEvent as PointerEvent | TouchEvent;
    const pt = 'touches' in start ? start.touches[0] ?? start.changedTouches[0] : start;
    const now = pointerNow() ?? (pt ? { x: pt.clientX + event.delta.x, y: pt.clientY + event.delta.y } : null);
    const surface = document.querySelector('[data-page-surface]') as HTMLElement | null;
    if (!now || !surface) return null;
    const rect = surface.getBoundingClientRect();
    const scale = rect.width / surface.offsetWidth;
    return { x: (now.x - rect.left) / scale, y: (now.y - rect.top) / scale };
  };

  const dropOnPlanner = (pageId: string, point: { x: number; y: number }, drag: { type?: string; activityId?: string; itemId?: string; taskId?: string }) => {
    const ws = worksheetRef.current;
    const page = ws.pages.find((p) => p.id === pageId);
    if (!page?.planner) return;
    // A task pulled out of a block: place it as if the block never had it
    const pulled = drag.type === 'planner-item' && drag.taskId && drag.itemId ? takeOut(page.planner, drag.itemId, drag.taskId) : null;
    const planner = pulled?.planner ?? page.planner;
    const moving = pulled ? undefined : drag.type === 'planner-item' ? planner.items.find((i) => i.id === drag.itemId) : undefined;
    const item = pulled?.item ?? moving ?? (drag.activityId ? itemFromActivity(drag.activityId) : undefined);
    if (!item) return;
    const g = plannerGeometry(ws.pageSize, page.showDateName, planner);
    const target = dropTarget(g, planner, point.x, point.y - GRAB_TOP, item.minutes ?? STEP, moving?.id);
    const placed = placeItem(planner, item, target);
    updatePlanner(pageId, () => placed);
    // A task moved within or into a block: keep that block selected, so its tasks can
    // keep being rearranged (the block's id follows whichever task leads it)
    if (pulled && target.kind === 'day' && target.join) {
      const block = blockOf(placed, item.id);
      if (block) setPlannerSel({ pageId, itemId: block.id });
    }
    if (!moving) trackEvent('planner_activity_added', { activity: drag.activityId, kind: planner.kind });
  };

  const removePlannerItem = useCallback(
    (pageId: string, itemId: string) => {
      updatePlanner(pageId, (p) => ({ ...p, items: p.items.filter((i) => i.id !== itemId) }));
      setPlannerSel((sel) => (sel?.itemId === itemId ? null : sel));
    },
    [updatePlanner]
  );

  /** Tap + on an activity: it goes where the view puts new things */
  const handleAddActivity = useCallback(
    (activityId: string) => {
      const page = worksheetRef.current.pages[activePageIndex];
      if (!page?.planner) return;
      const selected = plannerSel && plannerSel.pageId === page.id ? page.planner.items.find((i) => i.id === plannerSel.itemId) : undefined;
      updatePlanner(page.id, (p) => addItem(p, itemFromActivity(activityId), selected?.day));
      setIsMobileSidebarOpen(false);
      trackEvent('planner_activity_added', { activity: activityId, kind: page.planner.kind });
    },
    [activePageIndex, plannerSel, updatePlanner]
  );

  /** Make your own: a blank activity, opened straight away to type its name */
  const handleAddCustomActivity = useCallback(() => {
    const page = worksheetRef.current.pages[activePageIndex];
    if (!page?.planner) return;
    const item: PlannerItem = { id: newItemId(), label: 'My activity', picture: 'ph:Star', minutes: 30 };
    updatePlanner(page.id, (p) => addItem(p, item));
    setPlannerSel({ pageId: page.id, itemId: item.id });
    setIsPlannerPanelOpen(true);
    setIsMobileSidebarOpen(false);
  }, [activePageIndex, updatePlanner]);

  const handleChangePlannerKind = useCallback(
    (pageId: string, kind: PlannerKind) => {
      const page = worksheetRef.current.pages.find((p) => p.id === pageId);
      if (!page?.planner || (page.planner.kind === kind && page.planner.kindChosen !== false)) return;
      // A title still on the old view's default follows the switch ("My day" -> "My week")
      const oldDefault = KIND_LABELS[page.planner.kind].title;
      updateWorksheet((prev) => ({
        ...prev,
        pages: prev.pages.map((pg) =>
          pg.id === pageId && pg.planner
            ? { ...pg, title: pg.title === oldDefault ? KIND_LABELS[kind].title : pg.title, planner: switchKind(pg.planner, kind) }
            : pg
        ),
      }));
      trackEvent('planner_view_changed', { kind });
    },
    [updateWorksheet]
  );

  /** Move the selected activity up or down its list (checklist) or its day (week) */
  const handleMovePlannerItem = useCallback(
    (dir: -1 | 1) => {
      if (!plannerSel) return;
      updatePlanner(plannerSel.pageId, (p) => {
        const items = [...p.items];
        const idx = items.findIndex((i) => i.id === plannerSel.itemId);
        if (idx === -1) return p;
        // Checklist order (day and week activities are ordered by their times)
        const sameList = (_i: PlannerItem) => true;
        let j = idx + dir;
        while (j >= 0 && j < items.length && !sameList(items[j])) j += dir;
        if (j < 0 || j >= items.length) return p;
        [items[idx], items[j]] = [items[j], items[idx]];
        return { ...p, items };
      });
    },
    [plannerSel, updatePlanner]
  );

  // Selection never outlives the page it was on
  useEffect(() => {
    const page = worksheet.pages[activePageIndex];
    if (plannerSel && (!page || page.id !== plannerSel.pageId)) setPlannerSel(null);
    if (!page?.planner) setIsPlannerPanelOpen(false);
  }, [activePageIndex, worksheet.pages, plannerSel]);

  /** New document or new page, from "What are you making?" */
  const handleMakeChoice = (choice: MakeChoice) => {
    const mode = makeChooser;
    setMakeChooser(null);
    if (mode === 'add') {
      const n = worksheetRef.current.pages.length + 1;
      const newPage: Page =
        choice === 'worksheet'
          ? { id: `page_${Date.now()}`, title: `Page ${n}`, layout: '2-half', showDateName: true, slots: createSlotsForPreset('2-half') }
          : createPlannerPage('day', n, false);
      updateWorksheet((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
      setActivePageIndex(worksheetRef.current.pages.length - 1);
      trackEvent('page_added', { pageCount: n, kind: choice });
      return;
    }
    guardLeave(async (discard) => {
      await leaveCurrent(discard);
      const blank = createBlankWorksheet(worksheetRef.current.pageSize);
      if (choice !== 'worksheet') {
        const page = createPlannerPage('day', 1, false);
        blank.pages = [page];
        blank.title = 'Untitled worksheet';
      }
      openWorksheet(blank);
      setBrowserSavedKey(null);
      setManualSave('idle');
      setIsMyWorksheetsOpen(false);
      trackEvent('worksheet_new', { kind: choice });
    });
  };

  // Slot selection and opening settings
  const handleSelectSlot = useCallback(
    (pageId: string, slot: Slot) => {
      setSelectedSlotRef({ pageId, slotId: slot.id });
      if (slot.block) {
        setIsInspectorOpen(true);
      }
    },
    []
  );

  const handleOpenSettings = useCallback(
    (pageId: string, slot: Slot) => {
      setSelectedSlotRef({ pageId, slotId: slot.id });
      setIsInspectorOpen(true);
    },
    []
  );

  // Block settings update
  const handleUpdateBlockSettings = useCallback(
    (newSettings: Record<string, any>) => {
      if (!selectedSlotRef) return;
      const { pageId, slotId } = selectedSlotRef;

      updateWorksheet((prev) => {
        const newPages = prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            slots: p.slots.map((s) => {
              if (s.id !== slotId || !s.block) return s;
              return {
                ...s,
                block: {
                  ...s.block,
                  settings: newSettings,
                },
              };
            }),
          };
        });
        return { ...prev, pages: newPages };
      });
    },
    [selectedSlotRef, updateWorksheet]
  );

  // Character update
  const handleUpdateBlockCharacter = useCallback(
    (charConfig: { id: CharacterId; corner: any } | null) => {
      if (!selectedSlotRef) return;
      const { pageId, slotId } = selectedSlotRef;

      updateWorksheet((prev) => {
        const newPages = prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            slots: p.slots.map((s) => {
              if (s.id !== slotId || !s.block) return s;
              return {
                ...s,
                block: {
                  ...s.block,
                  character: charConfig,
                },
              };
            }),
          };
        });
        return { ...prev, pages: newPages };
      });
    },
    [selectedSlotRef, updateWorksheet]
  );

  // Delete block from slot
  const handleDeleteBlock = useCallback(
    (pageId: string, slotId: string) => {
      updateWorksheet((prev) => {
        const newPages = prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            slots: p.slots.map((s) => (s.id === slotId ? { ...s, block: null } : s)),
          };
        });
        return { ...prev, pages: newPages };
      });

      if (selectedSlotRef?.slotId === slotId) {
        setIsInspectorOpen(false);
      }
      trackEvent('block_removed', { blockId: slotId });
    },
    [selectedSlotRef, updateWorksheet]
  );

  // Page management: Add page asks what kind (worksheet or a planner)
  const handleAddPage = useCallback(() => setMakeChooser('add'), []);

  const handleDeletePage = useCallback(
    (pageIdxToDelete: number) => {
      if (worksheet.pages.length <= 1) return; // Keep at least one page

      updateWorksheet((prev) => ({
        ...prev,
        pages: prev.pages.filter((_, idx) => idx !== pageIdxToDelete),
      }));

      setActivePageIndex((prevIdx) => Math.max(0, Math.min(prevIdx, worksheet.pages.length - 2)));
      trackEvent('page_deleted', { pageCount: worksheet.pages.length - 1 });
    },
    [updateWorksheet, worksheet.pages.length]
  );

  const handleMovePage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= worksheet.pages.length) return;
      updateWorksheet((prev) => {
        const pages = [...prev.pages];
        const [moved] = pages.splice(fromIndex, 1);
        pages.splice(toIndex, 0, moved);
        return { ...prev, pages };
      });
      setActivePageIndex(toIndex);
    },
    [updateWorksheet, worksheet.pages.length]
  );

  // Duplicate a page and put the copy right after it. Every activity gets its own new id,
  // so changing the copy never changes the original.
  const handleDuplicatePage = useCallback(
    (pageIdx: number) => {
      const source = worksheetRef.current.pages[pageIdx];
      if (!source) return;
      const stamp = Date.now();
      const copy: Page = {
        ...(JSON.parse(JSON.stringify(source)) as Page),
        id: `page_${stamp}`,
      };
      copy.slots = copy.slots.map((s, i) =>
        s.block
          ? {
              ...s,
              block: {
                ...s.block,
                instanceId: `inst_${stamp}_${i}_${Math.random().toString(36).slice(2, 7)}`,
              },
            }
          : s
      );
      updateWorksheet((prev) => {
        const pages = [...prev.pages];
        pages.splice(pageIdx + 1, 0, copy);
        return { ...prev, pages };
      });
      setActivePageIndex(pageIdx + 1);
      trackEvent('page_added', { pageCount: worksheetRef.current.pages.length + 1 });
    },
    [updateWorksheet]
  );

  // Change page layout preset.
  // Blocks keep their order. If the new layout has fewer slots, the extra blocks
  // move onto new pages (same layout) right after this one instead of being deleted.
  const handleChangePageLayout = useCallback(
    (pageId: string, newPreset: PageLayoutPreset) => {
      const current = worksheetRef.current;
      const pageIdx = current.pages.findIndex((p) => p.id === pageId);
      if (pageIdx === -1) return;
      const page = current.pages[pageIdx];

      const existingBlocks = page.slots
        .map((s) => s.block)
        .filter((b): b is BlockInstance => Boolean(b));
      const slotsPerPage = createSlotsForPreset(newPreset).length;

      const chunks: BlockInstance[][] = [];
      for (let i = 0; i < Math.max(existingBlocks.length, 1); i += slotsPerPage) {
        chunks.push(existingBlocks.slice(i, i + slotsPerPage));
      }

      const rebuiltPages: Page[] = chunks.map((blocks, chunkIdx) => {
        const slots = createSlotsForPreset(newPreset);
        blocks.forEach((block, i) => {
          slots[i].block = block;
        });
        return {
          ...page,
          id: chunkIdx === 0 ? page.id : `page_${Date.now()}_${chunkIdx}`,
          layout: newPreset,
          slots,
        };
      });

      updateWorksheet((prev) => {
        const pages = [...prev.pages];
        pages.splice(pageIdx, 1, ...rebuiltPages);
        return { ...prev, pages };
      });

      // The selected slot id may not exist in the new layout
      setSelectedSlotRef(null);
      setIsInspectorOpen(false);

      trackEvent('page_layout_changed', { layout: newPreset });
      if (rebuiltPages.length > 1) {
        trackEvent('page_added', { pageCount: current.pages.length + rebuiltPages.length - 1 });
      }
    },
    [updateWorksheet]
  );

  // Change page title
  const handleChangePageTitle = useCallback(
    (pageId: string, title: string) => {
      updateWorksheet((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
      }));
    },
    [updateWorksheet]
  );

  // Change page size (Letter / A4)
  const handleTogglePageSize = useCallback(
    (newSize: PageSizeId) => {
      updateWorksheet((prev) => ({ ...prev, pageSize: newSize }));
    },
    [updateWorksheet]
  );

  // Copy share link.
  // Only the clipboard gets the link. The address bar is left alone, so a later
  // refresh keeps loading the latest autosave instead of this snapshot.
  const handleCopyShareLink = useCallback(() => {
    const fullUrl = buildShareUrl(worksheet);
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl).catch((err) => {
      console.warn('Clipboard write failed:', err);
    });
  }, [worksheet]);

  // Load a template.
  // Goes through history so Undo brings back the worksheet the parent was working on.
  const handleSelectTemplate = (template: TemplateItem) =>
    guardLeave(async (discard) => {
      await leaveCurrent(discard);
      const cloned = JSON.parse(JSON.stringify(template.worksheet)) as Worksheet;
      cloned.id = `ws_${Date.now()}`;

      updateWorksheet(() => cloned);
      setBrowserSavedKey(null);
      setManualSave('idle');
      setActivePageIndex(0);
      setIsTemplateModalOpen(false);
      setSelectedSlotRef(null);
      setIsInspectorOpen(false);

      trackEvent('template_opened', {
        templateId: template.id,
        pageCount: cloned.pages.length,
      });
    });

  // PDF Export
  const handleDownloadPdf = useCallback(async () => {
    setIsExportingPdf(true);
    try {
      await exportWorksheetToPdf(worksheet, {
        onSuccess: () => {
          setIsExportingPdf(false);
          setPrintDone('pdf');
        },
        onError: () => {
          setIsExportingPdf(false);
          // Fallback to print dialog
          printWorksheetNative(worksheet, () => {
            setPrintDone('print');
          });
        },
      });
    } catch {
      setIsExportingPdf(false);
    }
  }, [worksheet]);

  // Native Print
  const handlePrintNative = useCallback(() => {
    printWorksheetNative(worksheet, () => {
      setPrintDone('print');
    });
  }, [worksheet]);

  const draggedBlockDef = activeDragItem ? getBlockById(activeDragItem.blockId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveDragItem(null);
        setDragOffPage(false);
      }}
    >
      <div id="worksheet-builder-app" className="flex flex-col h-screen w-screen bg-[#F2F2E2] overflow-hidden">
        {/* Interactive Shell (Hidden during Print) */}
        <div id="app-interactive-shell" className="flex flex-col h-full w-full">
          {/* Top Bar */}
          <TopBar
            saveState={saveState}
            onSave={handleSave}
            onOpen={() => setIsMyWorksheetsOpen(true)}
            onNew={handleNewWorksheet}
            worksheetName={isUnnamed(worksheet) ? null : worksheet.title}
            onRename={() => setIsRenaming(true)}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
            onCopyShareLink={handleCopyShareLink}
            onDownloadPdf={handleDownloadPdf}
            onPrintNative={handlePrintNative}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isExportingPdf={isExportingPdf}
            account={
              accountSync.active && user
                ? {
                    email: user.email ?? '',
                    syncStatus: accountSync.status,
                    onSignOut: handleSignOut,
                  }
                : null
            }
          />

          {/* Main App Workspace: Sidebar + Canvas */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Left Block Library */}
            {activePage.planner ? (
              <PlannerLibrary
                kind={activePage.planner.kind}
                onAddActivity={handleAddActivity}
                onAddCustom={handleAddCustomActivity}
                isOpenOnMobile={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                slim={isSidebarSlim}
                onToggleSlim={handleToggleSidebarSlim}
              />
            ) : (
              <Sidebar
                onAddBlock={handleAddBlockToActivePage}
                isOpenOnMobile={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                slim={isSidebarSlim}
                onToggleSlim={handleToggleSidebarSlim}
              />
            )}

            {/* Pages panel: every page, top to bottom */}
            <PagesPanel
              pages={worksheet.pages}
              activePageIndex={activePageIndex}
              pageSize={worksheet.pageSize}
              onSelectPageIndex={setActivePageIndex}
              onAddPage={handleAddPage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onMovePage={handleMovePage}
            />

            {/* Central Canvas Preview */}
            <WorksheetCanvas
              pages={worksheet.pages}
              activePageIndex={activePageIndex}
              pageSize={worksheet.pageSize}
              onTogglePageSize={handleTogglePageSize}
              nameDate={worksheet.nameDate ?? 'all'}
              onChangeNameDate={(mode) => updateWorksheet((prev) => ({ ...prev, nameDate: mode }))}
              selectedSlot={
                selectedSlot && selectedSlotRef
                  ? { pageId: selectedSlotRef.pageId, slot: selectedSlot }
                  : null
              }
              onSelectSlot={(pageId, slot) => handleSelectSlot(pageId, slot)}
              onSelectPageIndex={setActivePageIndex}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
              onMovePage={handleMovePage}
              onChangePageLayout={handleChangePageLayout}
              onChangePageTitle={handleChangePageTitle}
              onDeleteBlock={handleDeleteBlock}
              onOpenSettings={(pageId, slot) => handleOpenSettings(pageId, slot)}
              selectedPlannerItemId={plannerSel?.itemId ?? null}
              onSelectPlannerItem={(pageId, itemId) => {
                setPlannerSel({ pageId, itemId });
                setIsPlannerPanelOpen(true);
              }}
              onPlannerBackground={() => {
                setPlannerSel(null);
                setIsPlannerPanelOpen(false);
              }}
              onChangePlannerKind={handleChangePlannerKind}
              onResizePlannerItem={(pageId, itemId, minutes) =>
                // Longer: the activities after it slide later
                updatePlanner(pageId, (p) => ({ ...p, items: flow(p, p.items.map((i) => (i.id === itemId ? { ...i, minutes } : i))) }))
              }
              onOpenPlannerSettings={() => {
                setPlannerSel(null);
                setIsPlannerPanelOpen(true);
              }}
            />

            {/* Planner settings (planner pages) */}
            {activePage.planner && (
              <PlannerDrawer
                isOpen={isPlannerPanelOpen}
                onClose={() => {
                  setIsPlannerPanelOpen(false);
                  setPlannerSel(null);
                }}
                planner={activePage.planner}
                item={plannerSel ? activePage.planner.items.find((i) => i.id === plannerSel.itemId) ?? null : null}
                onUpdateItem={(patch) =>
                  plannerSel &&
                  updatePlanner(plannerSel.pageId, (p) => {
                    const items = p.items.map((i) => (i.id === plannerSel.itemId ? { ...i, ...patch } : i));
                    // A new time or length: the activities after it slide along
                    return { ...p, items: 'start' in patch || 'minutes' in patch || 'day' in patch ? flow(p, items) : items };
                  })
                }
                onSetTasks={(tasks) => {
                  if (!plannerSel) return;
                  const { pageId, itemId } = plannerSel;
                  if (!tasks.length) return removePlannerItem(pageId, itemId);
                  // The first task leads the block: the card takes its id, words and icon
                  updatePlanner(pageId, (p) => ({
                    ...p,
                    items: p.items.map((i) =>
                      i.id === itemId ? { ...i, id: tasks[0].id, label: tasks[0].label, picture: tasks[0].picture, also: tasks.length > 1 ? tasks.slice(1) : undefined } : i
                    ),
                  }));
                  setPlannerSel({ pageId, itemId: tasks[0].id });
                }}
                onSplit={() => {
                  if (!plannerSel) return;
                  const { pageId, itemId } = plannerSel;
                  updatePlanner(pageId, (p) => splitBlock(p, itemId));
                }}
                onMoveItem={handleMovePlannerItem}
                onRemoveItem={() => plannerSel && removePlannerItem(plannerSel.pageId, plannerSel.itemId)}
                onUpdatePlanner={(patch) => updatePlanner(activePage.id, (p) => normalize({ ...p, ...patch }))}
                onChangeKind={(kind) => handleChangePlannerKind(activePage.id, kind)}
                onClearAll={() => updatePlanner(activePage.id, (p) => ({ ...p, items: [] }))}
                onResetExample={() => updatePlanner(activePage.id, (p) => ({ ...samplePlanner(p.kind) }))}
                showDateName={activePage.showDateName}
                onToggleDateName={(on) =>
                  updateWorksheet((prev) => ({ ...prev, pages: prev.pages.map((pg) => (pg.id === activePage.id ? { ...pg, showDateName: on } : pg)) }))
                }
              />
            )}

            {/* Block Settings Inspector Drawer */}
            <BlockSettingsDrawer
              isOpen={isInspectorOpen}
              onClose={() => setIsInspectorOpen(false)}
              autoSlim={autoSlim}
              onToggleAutoSlim={handleToggleAutoSlim}
              slot={selectedSlot}
              pageId={selectedSlotRef?.pageId || null}
              blockDef={selectedBlockDef}
              instance={selectedSlot?.block || null}
              onUpdateSettings={handleUpdateBlockSettings}
              onUpdateCharacter={handleUpdateBlockCharacter}
              onRemoveBlock={() => {
                if (selectedSlotRef) {
                  handleDeleteBlock(selectedSlotRef.pageId, selectedSlotRef.slotId);
                }
              }}
            />
          </div>
        </div>

        {/* Hidden Container For Browser Printing & DOM vector SVG scraping */}
        <PrintContainer worksheet={worksheet} />

        {/* Drag Overlay Ghost */}
        <DragOverlay modifiers={[followPointer]}>
          {activeDragItem && (activeDragItem.type === 'planner-activity' || activeDragItem.type === 'planner-item') && (
            <div className={`w-56 bg-white border-2 ${dragOffPage ? 'border-[#E52311]' : 'border-[#009BD9]'} rounded-xl p-2 shadow-2xl opacity-95 select-none pointer-events-none flex items-center gap-2.5`}>
              {dragOffPage ? <Trash2 className="w-5 h-5 text-[#E52311] shrink-0 m-2.5" /> : <PictureThumb picture={activeDragItem.picture ?? 'ph:Star'} size={40} />}
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-[#2D2200] truncate">{dragOffPage ? 'Release to remove' : activeDragItem.label}</h4>
                <p className="text-xs text-[#6B5838] truncate">{activeDragItem.type === 'planner-item' ? 'Move it, or drag off the page to remove' : 'Drop it on the planner'}</p>
              </div>
            </div>
          )}
          {draggedBlockDef && dragOffPage && (
            <div className="w-64 bg-white border-2 border-[#E52311] rounded-xl p-3 shadow-2xl select-none pointer-events-none scale-105 flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-[#E52311] shrink-0" />
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-[#2D2200] truncate">Release to remove</h4>
                <p className="text-xs text-[#6B5838] truncate">{draggedBlockDef.displayName}</p>
              </div>
            </div>
          )}
          {draggedBlockDef && !dragOffPage && (
            <div className="w-64 bg-white border-2 border-[#009BD9] rounded-xl p-3 shadow-2xl opacity-90 select-none pointer-events-none scale-105">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5F45]">
                {draggedBlockDef.category}
              </span>
              <h4 className="text-sm font-extrabold text-[#2D2200]">
                {draggedBlockDef.displayName}
              </h4>
              <p className="text-xs text-[#6B5838] truncate">
                {activeDragItem?.type === 'slot-block' ? 'Move, swap, or drag off the page to remove' : 'Drop into any slot'}
              </p>
            </div>
          )}
        </DragOverlay>

        {/* Ask before removing a block dragged off the page */}
        {pendingRemove && (
          <RemoveBlockConfirm
            name={pendingRemove.name}
            title={pendingRemove.title}
            onNo={() => setPendingRemove(null)}
            onYes={() => {
              pendingRemove.remove();
              setPendingRemove(null);
            }}
          />
        )}

        {/* What are you making? (New, Add page) */}
        {makeChooser && (
          <WhatAreYouMaking mode={makeChooser} pageSize={worksheet.pageSize} onChoose={handleMakeChoice} onClose={() => setMakeChooser(null)} />
        )}

        {/* Templates Gallery Modal */}
        <TemplateGalleryModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={handleSelectTemplate}
        />

        {/* Worksheets saved to the account */}
        <MyWorksheetsModal
          isOpen={isMyWorksheetsOpen}
          currentId={worksheet.id}
          onClose={() => setIsMyWorksheetsOpen(false)}
          onOpen={handleOpenSaved}
          onNew={handleNewWorksheet}
          onRenamed={(id, name) => {
            // Renamed the open worksheet: show the new name without counting it as an edit.
            if (id === worksheetRef.current.id) setWorksheetNow({ ...worksheetRef.current, title: name });
          }}
          source={librarySource}
        />

        {/* Rename from the worksheet name in the top bar. Renaming an unsaved worksheet saves it too. */}
        {isRenaming && (
          <SaveWorksheetDialog
            mode="rename"
            initialName={isUnnamed(worksheet) ? '' : worksheet.title}
            onCancel={() => setIsRenaming(false)}
            onSave={(name) => {
              setIsRenaming(false);
              if (saveState === 'unsaved') saveWorksheet(name);
              else updateWorksheet((prev) => ({ ...prev, title: name }));
            }}
          />
        )}

        {/* Leaving an unsaved worksheet: Save / Don't save / Cancel */}
        {leavePrompt && (
          <SaveFirstDialog
            name={leavePrompt.name}
            onCancel={() => setLeavePrompt(null)}
            onDiscard={() => {
              const { run } = leavePrompt;
              setLeavePrompt(null);
              run(true);
            }}
            onSave={() => {
              const { run } = leavePrompt;
              setLeavePrompt(null);
              afterSaveRef.current = () => run(false);
              if (isUnnamed(worksheetRef.current)) setIsNamingSave(true);
              else saveWorksheet().then(() => {
                afterSaveRef.current?.();
                afterSaveRef.current = null;
              });
            }}
          />
        )}

        {/* First Save: name the worksheet */}
        {isNamingSave && (
          <SaveWorksheetDialog
            initialName={isUnnamed(worksheet) ? '' : worksheet.title}
            onCancel={() => {
              setIsNamingSave(false);
              afterSaveRef.current = null;
            }}
            onSave={async (name) => {
              setIsNamingSave(false);
              await saveWorksheet(name);
              // Saving before New, Open or a template: carry on with it now.
              afterSaveRef.current?.();
              afterSaveRef.current = null;
            }}
          />
        )}

        {/* Quiet confirmation after a PDF download or print */}
        <PrintDoneToast
          kind={printDone}
          onDismiss={dismissPrintDone}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
        />

        {/* Branded tooltips for every control that has a title */}
        <TooltipLayer />
      </div>
    </DndContext>
  );
}
