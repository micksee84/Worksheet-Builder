/**
 * @license
 * Sunshine Brigade Worksheet Builder - Name a worksheet on its first Save
 *
 * Shown the first time a worksheet is saved (while it still has a starter name), so it
 * can be found again under Open. After that, Save saves straight away.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Save } from './icons';

interface SaveWorksheetDialogProps {
  initialName: string;
  /** 'save' on a first Save; 'rename' from the worksheet name in the top bar. */
  mode?: 'save' | 'rename';
  onSave: (name: string) => void;
  onCancel: () => void;
}

export const SaveWorksheetDialog: React.FC<SaveWorksheetDialogProps> = ({ initialName, mode = 'save', onSave, onCancel }) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const clean = name.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D2200]/40" onClick={onCancel}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-worksheet-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) onSave(clean.slice(0, 80));
        }}
        className="w-full max-w-sm bg-white border-[3px] border-[#2D2200] rounded-[20px] shadow-[6px_6px_0_#2D2200] p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF5CC] text-[#2D2200] grid place-items-center shrink-0">
            <Save className="w-5 h-5" />
          </div>
          <h2 id="save-worksheet-title" className="text-lg font-extrabold text-[#2D2200]">
            {mode === 'rename' ? 'Rename your worksheet' : 'Save your worksheet'}
          </h2>
        </div>
        <label htmlFor="save-worksheet-name" className="block mt-5 text-sm font-bold text-[#2D2200]">
          Name
        </label>
        <input
          id="save-worksheet-name"
          ref={inputRef}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="For example, Letter A week"
          className="mt-1.5 w-full px-3.5 py-2.5 text-sm font-medium text-[#2D2200] bg-white border-[1.5px] border-[#2D2200] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009BD9]"
        />
        <p className="mt-2 text-xs text-[#6B5838]">
          {mode === 'rename' ? 'This is the name you see under Open.' : "You'll find it under Open. Changes after this save on their own."}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 px-5 rounded-full border-[1.5px] border-[#2D2200] bg-white text-sm font-extrabold text-[#2D2200] shadow-[3px_3px_0_#2D2200] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-transform"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!clean}
            className="min-h-11 px-5 rounded-full bg-[#2D2200] text-sm font-extrabold text-white disabled:opacity-40 hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-transform"
          >
            {mode === 'rename' ? 'Rename' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};
