/**
 * @license
 * Sunshine Brigade Worksheet Builder
 * Root Application Component
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';

import {
  Worksheet,
  Page,
  Slot,
  PageLayoutPreset,
  BlockInstance,
  BlockDefinition,
  PageSizeId,
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
import { loadAccountWorksheet } from './utils/cloudWorksheets';
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
import { BlockSettingsDrawer } from './components/BlockSettingsDrawer';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { DonationToast } from './components/DonationToast';
import { PrintContainer } from './components/PrintContainer';
import { TooltipLayer } from './components/TooltipLayer';
import { MyWorksheetsModal } from './components/MyWorksheetsModal';

// Initial default blank/starter worksheet
function createInitialWorksheet(): Worksheet {
  return {
    id: `ws_${Date.now()}`,
    title: 'Sunshine Learning Fun',
    pageSize: 'letter',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: [
      {
        id: 'page_1',
        title: 'Lines and letters',
        layout: '2-half',
        showDateName: true,
        slots: [
          {
            id: 'slot-1',
            size: 'half',
            label: 'Top Half',
            block: createBlockInstance('line-tracing', { lineStyle: 'wave', lineCount: 4 }, {
              id: 'buddy',
              corner: 'top-right',
            }),
          },
          {
            id: 'slot-2',
            size: 'half',
            label: 'Bottom Half',
            block: createBlockInstance('letter-tracing', { letter: 'A', caseMode: 'both' }, {
              id: 'finn',
              corner: 'top-right',
            }),
          },
        ],
      },
    ],
  };
}

export default function App() {
  const { user, signOut } = useAuth();

  // True when nothing was saved in this browser and no share link was opened,
  // so a signed-in grown-up gets their latest worksheet from their account instead.
  const startedFreshRef = useRef(false);

  // Main worksheet state
  const [worksheet, setWorksheet] = useState<Worksheet>(() => {
    // 1. Try URL hash first
    const fromHash = decodeWorksheetFromHash();
    if (fromHash) return fromHash;
    // 2. Try localStorage next
    const fromStorage = loadWorksheetFromStorage();
    if (fromStorage) return fromStorage;
    // 3. Fallback to initial
    startedFreshRef.current = true;
    return createInitialWorksheet();
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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showDonationToast, setShowDonationToast] = useState(false);
  const [isMyWorksheetsOpen, setIsMyWorksheetsOpen] = useState(false);

  // Drag and drop state
  const [activeDragItem, setActiveDragItem] = useState<{
    type: 'library-block';
    blockId: string;
  } | null>(null);

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 180, tolerance: 6 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

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

  const handleOpenFromAccount = useCallback(
    async (id: string) => {
      await accountSync.saveNow();
      const loaded = await loadAccountWorksheet(id);
      if (!loaded) return;
      openWorksheet(loaded);
      accountSync.markSaved(loaded);
      setIsMyWorksheetsOpen(false);
    },
    [accountSync, openWorksheet]
  );

  const handleNewWorksheet = useCallback(async () => {
    await accountSync.saveNow();
    openWorksheet(createInitialWorksheet());
    setIsMyWorksheetsOpen(false);
  }, [accountSync, openWorksheet]);

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
      const next = { ...updater(prev), updatedAt: Date.now() };
      setHistory((h) => [...h.slice(-19), prev]);
      setFuture([]);
      setWorksheetNow(next);
      return next;
    },
    [setWorksheetNow]
  );

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

  // Add block to first empty slot on the active page.
  // If the page is full, never overwrite an activity: start a new page right after it.
  const handleAddBlockToActivePage = useCallback(
    (blockId: string) => {
      const current = worksheetRef.current;
      const pageIdx = Math.min(activePageIndex, current.pages.length - 1);
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

      // Close mobile drawer if open
      setIsMobileSidebarOpen(false);
    },
    [activePageIndex, updateWorksheet]
  );

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data && data.type === 'library-block') {
      setActiveDragItem({
        type: 'library-block',
        blockId: data.blockId,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveDragItem(null);

    if (!over) return;

    const overData = over.data.current;
    const activeData = active.data.current;

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

  // Page management
  const handleAddPage = useCallback(() => {
    updateWorksheet((prev) => {
      const newPageNumber = prev.pages.length + 1;
      const newPage: Page = {
        id: `page_${Date.now()}`,
        title: `Page ${newPageNumber}`,
        layout: '2-half',
        showDateName: true,
        slots: createSlotsForPreset('2-half'),
      };
      return {
        ...prev,
        pages: [...prev.pages, newPage],
      };
    });
    setActivePageIndex(worksheet.pages.length);
    trackEvent('page_added', { pageCount: worksheet.pages.length + 1 });
  }, [updateWorksheet, worksheet.pages.length]);

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

  // Change worksheet title
  const handleUpdateTitle = useCallback(
    (title: string) => {
      updateWorksheet((prev) => ({ ...prev, title }));
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
  const handleSelectTemplate = useCallback(
    (template: TemplateItem) => {
      const cloned = JSON.parse(JSON.stringify(template.worksheet)) as Worksheet;
      cloned.id = `ws_${Date.now()}`;

      updateWorksheet(() => cloned);
      setActivePageIndex(0);
      setIsTemplateModalOpen(false);
      setSelectedSlotRef(null);
      setIsInspectorOpen(false);

      trackEvent('template_opened', {
        templateId: template.id,
        pageCount: cloned.pages.length,
      });
    },
    [updateWorksheet]
  );

  // PDF Export
  const handleDownloadPdf = useCallback(async () => {
    setIsExportingPdf(true);
    try {
      await exportWorksheetToPdf(worksheet, {
        onSuccess: () => {
          setIsExportingPdf(false);
          setShowDonationToast(true);
        },
        onError: () => {
          setIsExportingPdf(false);
          // Fallback to print dialog
          printWorksheetNative(worksheet, () => {
            setShowDonationToast(true);
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
      setShowDonationToast(true);
    });
  }, [worksheet]);

  const draggedBlockDef = activeDragItem ? getBlockById(activeDragItem.blockId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div id="worksheet-builder-app" className="flex flex-col h-screen w-screen bg-[#F2F2E2] overflow-hidden">
        {/* Interactive Shell (Hidden during Print) */}
        <div id="app-interactive-shell" className="flex flex-col h-full w-full">
          {/* Top Bar */}
          <TopBar
            title={worksheet.title}
            onUpdateTitle={handleUpdateTitle}
            pageSize={worksheet.pageSize}
            onTogglePageSize={handleTogglePageSize}
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
                    onOpenMyWorksheets: () => setIsMyWorksheetsOpen(true),
                    onSignOut: handleSignOut,
                  }
                : null
            }
          />

          {/* Main App Workspace: Sidebar + Canvas */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Left Block Library */}
            <Sidebar
              onAddBlock={handleAddBlockToActivePage}
              isOpenOnMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Central Canvas Preview */}
            <WorksheetCanvas
              pages={worksheet.pages}
              activePageIndex={activePageIndex}
              pageSize={worksheet.pageSize}
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
            />

            {/* Block Settings Inspector Drawer */}
            <BlockSettingsDrawer
              isOpen={isInspectorOpen}
              onClose={() => setIsInspectorOpen(false)}
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
        <DragOverlay>
          {draggedBlockDef && (
            <div className="w-64 bg-white border-2 border-[#009BD9] rounded-xl p-3 shadow-2xl opacity-90 select-none pointer-events-none scale-105">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5F45]">
                {draggedBlockDef.category}
              </span>
              <h4 className="text-sm font-extrabold text-[#2D2200]">
                {draggedBlockDef.displayName}
              </h4>
              <p className="text-xs text-[#6B5838] truncate">
                Drop into any slot
              </p>
            </div>
          )}
        </DragOverlay>

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
          onOpen={handleOpenFromAccount}
          onNew={handleNewWorksheet}
        />

        {/* Post-Download / Print Donation Prompt */}
        <DonationToast
          isVisible={showDonationToast}
          onDismiss={() => setShowDonationToast(false)}
        />

        {/* Branded tooltips for every control that has a title */}
        <TooltipLayer />
      </div>
    </DndContext>
  );
}
