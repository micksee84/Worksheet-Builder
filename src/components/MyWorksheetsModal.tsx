/**
 * @license
 * Sunshine Brigade Worksheet Builder - Open a worksheet
 * Saved worksheets (the Open button): open one, start a new one, rename one, or delete one.
 * Each shows its page count, when it was created and when it was last updated.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, FolderOpen, Plus, Trash2, FileText, Pencil } from 'lucide-react';
import {
  LibrarySource,
  SavedWorksheetSummary,
  deleteFromLibrary,
  listLibrary,
  renameInLibrary,
} from '../utils/worksheetLibrary';

interface MyWorksheetsModalProps {
  isOpen: boolean;
  currentId: string;
  onClose: () => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** Called after a worksheet is renamed here, so the open one can show its new name. */
  onRenamed: (id: string, name: string) => void;
  /** Where saved worksheets live: the account, or this browser when sign-in is off. */
  source: LibrarySource;
}

const timeFormat = new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' });
const dayYearFormat = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });

/** "Today, 11:32 a.m.", "Yesterday, 4:05 p.m.", "Nov 3" or "Nov 3, 2025". */
function friendlyDate(ms: number, withTime: boolean): string {
  if (!ms) return 'unknown';
  const d = new Date(ms);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  const time = withTime ? `, ${timeFormat.format(d)}` : '';
  if (days === 0) return `Today${time}`;
  if (days === 1) return `Yesterday${time}`;
  return d.getFullYear() === now.getFullYear() ? dayFormat.format(d) : dayYearFormat.format(d);
}

export const MyWorksheetsModal: React.FC<MyWorksheetsModalProps> = ({
  isOpen,
  currentId,
  onClose,
  onOpen,
  onNew,
  onRenamed,
  source,
}) => {
  const [items, setItems] = useState<SavedWorksheetSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setItems(null);
    setFailed(false);
    setConfirmDeleteId(null);
    setRenamingId(null);
    setProblem(null);
    listLibrary(source).then((list) => {
      if (cancelled) return;
      if (list === null) setFailed(true);
      else setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, source]);

  useEffect(() => {
    if (renamingId) renameRef.current?.select();
  }, [renamingId]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    const ok = await deleteFromLibrary(source, id);
    if (ok) setItems((prev) => prev?.filter((w) => w.id !== id) ?? prev);
    else setProblem("Couldn't delete that worksheet just now. Check your connection and try again.");
    setConfirmDeleteId(null);
  };

  const startRename = (ws: SavedWorksheetSummary) => {
    setConfirmDeleteId(null);
    setProblem(null);
    setRenamingId(ws.id);
    setDraftName(ws.title);
  };

  const handleRename = async (id: string) => {
    const name = draftName.trim().slice(0, 80);
    const current = items?.find((w) => w.id === id);
    if (!name || name === current?.title) {
      setRenamingId(null);
      return;
    }
    const renamed = await renameInLibrary(source, id, name);
    if (renamed) {
      setItems((prev) => prev?.map((w) => (w.id === id ? { ...w, title: name } : w)) ?? prev);
      onRenamed(id, name);
      setRenamingId(null);
    } else {
      setProblem("Couldn't rename that worksheet just now. Check your connection and try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2200]/50 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-worksheets-title"
    >
      <div className="bg-white border-[3px] border-[#2D2200] rounded-[24px] w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b-[1.5px] border-[#2D2200] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-[#2D2200]" aria-hidden="true" />
            <h2 id="my-worksheets-title" className="text-lg font-extrabold text-[#2D2200]">
              Open a worksheet
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-3 px-4 min-h-[56px] rounded-[20px] border-[1.5px] border-dashed border-[#2D2200] text-left font-extrabold text-[#2D2200] hover:bg-[#FAF8F0] transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Start a new worksheet
          </button>

          {problem && (
            <p role="alert" className="px-2 py-2 text-sm font-bold text-[#2D2200]">
              {problem}
            </p>
          )}

          {failed && (
            <p className="px-2 py-4 text-sm font-bold text-[#2D2200]">
              We couldn't load your worksheets just now. Check your connection and try again.
            </p>
          )}

          {!failed && items === null && (
            <p className="px-2 py-4 text-sm text-[#6B5F45]" aria-busy="true">
              Finding your worksheets...
            </p>
          )}

          {items && items.length === 0 && (
            <p className="px-2 py-4 text-sm text-[#6B5F45]">
              Worksheets you save will show up here. Click Save in the top bar to save this one.
            </p>
          )}

          {items?.map((ws) => {
            const isCurrent = ws.id === currentId;
            const confirming = confirmDeleteId === ws.id;
            const renaming = renamingId === ws.id;
            return (
              <div
                key={ws.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-[20px] border-[1.5px] border-[#2D2200] ${
                  isCurrent ? 'bg-[#FAF8F0]' : 'bg-white'
                }`}
              >
                <FileText className="w-5 h-5 text-[#2D2200] shrink-0" aria-hidden="true" />

                {renaming ? (
                  <form
                    className="flex-1 min-w-0 flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRename(ws.id);
                    }}
                  >
                    <label htmlFor={`rename-${ws.id}`} className="sr-only">
                      New name for {ws.title}
                    </label>
                    <input
                      id={`rename-${ws.id}`}
                      ref={renameRef}
                      value={draftName}
                      maxLength={80}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setRenamingId(null);
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm font-bold text-[#2D2200] border-[1.5px] border-[#2D2200] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009BD9]"
                    />
                    <button
                      type="submit"
                      disabled={!draftName.trim()}
                      className="px-3 min-h-[36px] rounded-full bg-[#2D2200] text-white text-xs font-extrabold disabled:opacity-40 shrink-0"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="px-3 min-h-[36px] rounded-full border-[1.5px] border-[#2D2200] text-xs font-extrabold text-[#2D2200] shrink-0"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => onOpen(ws.id)}
                      disabled={isCurrent}
                      className="flex-1 min-w-0 text-left disabled:cursor-default"
                      title={isCurrent ? 'This worksheet is open now' : `Open ${ws.title}`}
                    >
                      <span className="block font-extrabold text-[#2D2200] truncate">
                        {ws.title}
                        {isCurrent && <span className="ml-2 text-xs font-bold text-[#6B5F45]">Open now</span>}
                      </span>
                      <span className="block text-xs text-[#6B5F45] tabular-nums">
                        {ws.pageCount} {ws.pageCount === 1 ? 'page' : 'pages'} · Created{' '}
                        {friendlyDate(ws.createdAt, false)} · Updated {friendlyDate(ws.updatedAt, true)}
                      </span>
                    </button>

                    {confirming ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-[#2D2200] hidden sm:inline">Delete for good?</span>
                        <button
                          onClick={() => handleDelete(ws.id)}
                          className="px-3 min-h-[36px] rounded-full bg-[#E52311] text-white text-xs font-extrabold"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 min-h-[36px] rounded-full border-[1.5px] border-[#2D2200] text-xs font-extrabold text-[#2D2200]"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => startRename(ws)}
                          aria-label={`Rename ${ws.title}`}
                          title="Rename this worksheet"
                          className="p-2 text-[#6B5F45] hover:text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              setRenamingId(null);
                              setConfirmDeleteId(ws.id);
                            }}
                            aria-label={`Delete ${ws.title}`}
                            title="Delete this worksheet"
                            className="p-2 text-[#6B5F45] hover:text-[#E52311] hover:bg-[#FDECEA] rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {source === 'browser' && (
            <p className="px-2 pt-1 text-xs text-[#6B5F45]">Saved in this browser only, because sign-in is off here.</p>
          )}
        </div>
      </div>
    </div>
  );
};
