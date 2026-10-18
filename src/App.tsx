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
} from './utils/storage';
import {
  encodeWorksheetToHash,
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
        title: 'Sunshine Pre-Writing & Letters',
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
  // Main worksheet state
  const [worksheet, setWorksheet] = useState<Worksheet>(() => {
    // 1. Try URL hash first
    const fromHash = decodeWorksheetFromHash();
    if (fromHash) return fromHash;
    // 2. Try localStorage next
    const fromStorage = loadWorksheetFromStorage();
    if (fromStorage) return fromStorage;
    // 3. Fallback to initial
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

  // Autosave to localStorage on worksheet update
  useEffect(() => {
    saveWorksheetToStorage(worksheet);
  }, [worksheet]);

  // Helper to push state changes with history
  const updateWorksheet = useCallback(
    (updater: (prev: Worksheet) => Worksheet) => {
      setWorksheet((prev) => {
        const next = updater(prev);
        // Push previous to history
        setHistory((h) => [...h.slice(-20), prev]);
        setFuture([]);
        return {
          ...next,
          updatedAt: Date.now(),
        };
      });
    },
    []
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setFuture((f) => [worksheet, ...f]);
    setWorksheet(previous);
  }, [history, worksheet]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, worksheet]);
    setWorksheet(next);
  }, [future, worksheet]);

  // Active page safe access
  const activePage = worksheet.pages[activePageIndex] || worksheet.pages[0];

  // Currently selected slot and its block definition
  const selectedSlot = activePage.slots.find((s) => s.id === selectedSlotRef?.slotId) || null;
  const selectedBlockDef = selectedSlot?.block ? getBlockById(selectedSlot.block.blockId) || null : null;

  // Add block to first available slot on active page
  const handleAddBlockToActivePage = useCallback(
    (blockId: string) => {
      let placed = false;

      updateWorksheet((prev) => {
        const newPages = prev.pages.map((p, pIdx) => {
          if (pIdx !== activePageIndex) return p;

          // Find first empty slot
          const emptySlot = p.slots.find((s) => s.block === null);
          if (emptySlot) {
            placed = true;
            return {
              ...p,
              slots: p.slots.map((s) =>
                s.id === emptySlot.id
                  ? { ...s, block: createBlockInstance(blockId) }
                  : s
              ),
            };
          }

          // If no empty slot, replace the first slot
          placed = true;
          return {
            ...p,
            slots: p.slots.map((s, idx) =>
              idx === 0 ? { ...s, block: createBlockInstance(blockId) } : s
            ),
          };
        });

        return { ...prev, pages: newPages };
      });

      trackEvent('block_added', { blockId, pageIndex: activePageIndex });

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
        title: `Worksheet Activity ${newPageNumber}`,
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

  // Change page layout preset
  const handleChangePageLayout = useCallback(
    (pageId: string, newPreset: PageLayoutPreset) => {
      updateWorksheet((prev) => {
        const newPages = prev.pages.map((p) => {
          if (p.id !== pageId) return p;

          const newSlots = createSlotsForPreset(newPreset);
          // Preserve existing blocks as far as possible
          const existingBlocks = p.slots.map((s) => s.block).filter(Boolean);

          newSlots.forEach((slot, idx) => {
            if (existingBlocks[idx]) {
              slot.block = existingBlocks[idx];
            }
          });

          return {
            ...p,
            layout: newPreset,
            slots: newSlots,
          };
        });
        return { ...prev, pages: newPages };
      });

      trackEvent('page_layout_changed', { layout: newPreset });
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

  // Copy share link
  const handleCopyShareLink = useCallback(() => {
    const hash = encodeWorksheetToHash(worksheet);
    const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard.writeText(fullUrl).catch((err) => {
      console.warn('Clipboard write failed:', err);
    });
    // Update browser URL hash without reload
    window.history.replaceState(null, '', hash);
  }, [worksheet]);

  // Load a template
  const handleSelectTemplate = useCallback(
    (template: TemplateItem) => {
      const cloned = JSON.parse(JSON.stringify(template.worksheet)) as Worksheet;
      cloned.id = `ws_${Date.now()}`;
      cloned.updatedAt = Date.now();

      setWorksheet(cloned);
      setActivePageIndex(0);
      setIsTemplateModalOpen(false);
      setSelectedSlotRef(null);
      setIsInspectorOpen(false);

      trackEvent('template_opened', {
        templateId: template.id,
        pageCount: cloned.pages.length,
      });
    },
    []
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#009BD9]">
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

        {/* Post-Download / Print Donation Prompt */}
        <DonationToast
          isVisible={showDonationToast}
          onDismiss={() => setShowDonationToast(false)}
        />
      </div>
    </DndContext>
  );
}
