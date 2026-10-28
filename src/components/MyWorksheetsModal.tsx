/**
 * @license
 * Sunshine Brigade Worksheet Builder - My worksheets
 * Worksheets saved to the signed-in account: open one, start a new one, or delete one.
 */

import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Plus, Trash2, FileText } from 'lucide-react';
import {
  SavedWorksheetSummary,
  deleteAccountWorksheet,
  listAccountWorksheets,
} from '../utils/cloudWorksheets';

interface MyWorksheetsModalProps {
  isOpen: boolean;
  currentId: string;
  onClose: () => void;
  onOpen: (id: string) => void;
  onNew: () => void;
}

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const MyWorksheetsModal: React.FC<MyWorksheetsModalProps> = ({
  isOpen,
  currentId,
  onClose,
  onOpen,
  onNew,
}) => {
  const [items, setItems] = useState<SavedWorksheetSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setItems(null);
    setFailed(false);
    setConfirmDeleteId(null);
    listAccountWorksheets().then((list) => {
      if (cancelled) return;
      if (list === null) setFailed(true);
      else setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    const ok = await deleteAccountWorksheet(id);
    if (ok) setItems((prev) => prev?.filter((w) => w.id !== id) ?? prev);
    setConfirmDeleteId(null);
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
              My worksheets
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
              Your saved worksheets will show up here. Every change saves on its own.
            </p>
          )}

          {items?.map((ws) => {
            const isCurrent = ws.id === currentId;
            const confirming = confirmDeleteId === ws.id;
            return (
              <div
                key={ws.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-[20px] border-[1.5px] border-[#2D2200] ${
                  isCurrent ? 'bg-[#FAF8F0]' : 'bg-white'
                }`}
              >
                <FileText className="w-5 h-5 text-[#2D2200] shrink-0" aria-hidden="true" />
                <button
                  onClick={() => onOpen(ws.id)}
                  disabled={isCurrent}
                  className="flex-1 min-w-0 text-left disabled:cursor-default"
                >
                  <span className="block font-extrabold text-[#2D2200] truncate">{ws.title}</span>
                  <span className="block text-xs text-[#6B5F45]">
                    {ws.pageCount} {ws.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                    {isCurrent ? 'Open now' : `Edited ${dateFormat.format(ws.updatedAt)}`}
                  </span>
                </button>

                {!isCurrent &&
                  (confirming ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDelete(ws.id)}
                        className="px-3 min-h-[36px] rounded-full bg-[#2D2200] text-white text-xs font-extrabold"
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
                    <button
                      onClick={() => setConfirmDeleteId(ws.id)}
                      aria-label={`Delete ${ws.title}`}
                      title="Delete this worksheet"
                      className="p-2 text-[#6B5F45] hover:text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
