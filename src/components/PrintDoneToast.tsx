/**
 * @license
 * Sunshine Brigade Worksheet Builder - Print / PDF confirmation
 * A quiet, dismissible note after a PDF download or print. No asks, no upsell:
 * it confirms the worksheet is on its way and offers templates as a next step.
 * Never blocks or delays printing. Closes itself after a few seconds.
 */

import React, { useEffect } from 'react';
import { BookOpen, Download, Printer, X } from 'lucide-react';

export type PrintDoneKind = 'print' | 'pdf';

interface PrintDoneToastProps {
  kind: PrintDoneKind | null;
  onDismiss: () => void;
  onOpenTemplates: () => void;
}

const COPY: Record<PrintDoneKind, { title: string; message: string }> = {
  print: {
    title: 'Off to the printer',
    message: 'Have fun with it. Need another one? Start from a template.',
  },
  pdf: {
    title: 'Your PDF is ready',
    message: 'Print it whenever you like. Need another one? Start from a template.',
  },
};

const AUTO_CLOSE_MS = 8000;

export const PrintDoneToast: React.FC<PrintDoneToastProps> = ({
  kind,
  onDismiss,
  onOpenTemplates,
}) => {
  useEffect(() => {
    if (!kind) return;
    const t = window.setTimeout(onDismiss, AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [kind, onDismiss]);

  if (!kind) return null;

  const { title, message } = COPY[kind];
  const Icon = kind === 'pdf' ? Download : Printer;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm bg-white border-[1.5px] border-[#2D2200] rounded-[20px] shadow-[4px_4px_0_#2D2200] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl bg-[#F2B800] border-[1.5px] border-[#2D2200] text-[#2D2200] flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-extrabold text-[#2D2200] leading-snug pt-0.5">{title}</h4>
            <button
              onClick={onDismiss}
              className="-mt-1 -mr-1 p-1.5 text-[#6B5F45] hover:text-[#2D2200] rounded-lg transition-colors focus-visible:outline-[3px] focus-visible:outline focus-visible:outline-[#009BD9] focus-visible:outline-offset-2"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#4A4030] mt-1 leading-relaxed">{message}</p>

          <button
            onClick={() => {
              onDismiss();
              onOpenTemplates();
            }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2D2200] bg-white border-[1.5px] border-[#2D2200] rounded-full transition-all hover:bg-[#F2B800] hover:-translate-x-px hover:-translate-y-px active:bg-[#009BD9] active:translate-x-px active:translate-y-px focus-visible:outline-[3px] focus-visible:outline focus-visible:outline-[#009BD9] focus-visible:outline-offset-[3px]"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Browse templates</span>
          </button>
        </div>
      </div>
    </div>
  );
};
