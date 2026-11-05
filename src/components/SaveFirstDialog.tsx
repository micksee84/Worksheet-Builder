/**
 * @license
 * Sunshine Brigade Worksheet Builder - "Save first?" before leaving a worksheet
 *
 * Shown when starting a new worksheet, opening another one or picking a template while
 * the open worksheet has changes that were never saved. Saved worksheets keep saving on
 * their own, so they never see this. Cancel is focused first, so Enter or Escape stays put.
 */

import React, { useEffect, useRef } from 'react';
import { Save } from 'lucide-react';

interface SaveFirstDialogProps {
  name: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const SaveFirstDialog: React.FC<SaveFirstDialogProps> = ({ name, onSave, onDiscard, onCancel }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const btn =
    'min-h-11 px-4 rounded-full text-sm font-extrabold hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#2D2200]';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D2200]/40" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-first-title"
        aria-describedby="save-first-text"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border-[3px] border-[#2D2200] rounded-[20px] shadow-[6px_6px_0_#2D2200] p-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF5CC] text-[#2D2200] grid place-items-center shrink-0">
            <Save className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 id="save-first-title" className="text-lg font-extrabold text-[#2D2200] break-words">
              Save “{name}” first?
            </h2>
            <p id="save-first-text" className="text-sm text-[#6B5838] mt-1">
              It hasn't been saved yet. If you don't save it, your changes will be lost.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`${btn} border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] shadow-[3px_3px_0_#2D2200]`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className={`${btn} border-[1.5px] border-[#2D2200] bg-white text-[#2D2200] shadow-[3px_3px_0_#2D2200]`}
          >
            Don't save
          </button>
          <button type="button" onClick={onSave} className={`${btn} bg-[#2D2200] text-white`}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
