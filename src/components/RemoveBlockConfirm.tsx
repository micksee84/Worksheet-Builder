/**
 * @license
 * Sunshine Brigade Worksheet Builder - "Remove this block?" confirmation
 *
 * Shown when a placed block is dragged off the page and let go. Drawn in the app rather
 * than with window.confirm, which looks out of place and is blocked in some embeds.
 * "No" has focus first, so Enter or Escape keeps the block.
 */

import React, { useEffect, useRef } from 'react';
import { Trash2 } from './icons';

interface RemoveBlockConfirmProps {
  name: string;
  onYes: () => void;
  onNo: () => void;
}

export const RemoveBlockConfirm: React.FC<RemoveBlockConfirmProps> = ({ name, onYes, onNo }) => {
  const noRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    noRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onNo();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNo]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D2200]/40" onClick={onNo}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-block-title"
        aria-describedby="remove-block-text"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white border-[3px] border-[#2D2200] rounded-[20px] shadow-[6px_6px_0_#2D2200] p-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FDECEA] text-[#E52311] grid place-items-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 id="remove-block-title" className="text-lg font-extrabold text-[#2D2200]">
              Remove this block?
            </h2>
            <p id="remove-block-text" className="text-sm text-[#6B5838] mt-1">
              {name} will be taken off the page.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={noRef}
            type="button"
            onClick={onNo}
            className="min-h-11 px-5 rounded-full border-[1.5px] border-[#2D2200] bg-white text-sm font-extrabold text-[#2D2200] shadow-[3px_3px_0_#2D2200] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#2D2200]"
          >
            No, keep it
          </button>
          <button
            type="button"
            onClick={onYes}
            className="min-h-11 px-5 rounded-full bg-[#E52311] text-sm font-extrabold text-white hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#2D2200]"
          >
            Yes, remove
          </button>
        </div>
      </div>
    </div>
  );
};
