/**
 * @license
 * Sunshine Brigade Worksheet Builder - "What are you making?"
 *
 * One simple start for everything the builder makes: a worksheet or a planner. Shown for
 * New (a fresh document) and Add page (another page in this one). A planner's type (day,
 * week, checklist, first-then) is picked on the planner page itself.
 */

import React, { useEffect, useMemo } from 'react';
import { X } from '../components/icons';
import { Page, PageSizeId } from '../types';
import { pageDims } from '../config/appConfig';
import { WorksheetPageSvg } from '../components/WorksheetPageSvg';
import { createSlotsForPreset } from '../utils/layoutPresets';
import { createPlannerPage, samplePlanner } from './plannerModel';

export type MakeChoice = 'worksheet' | 'planner';

const CHOICES: { id: MakeChoice; title: string; blurb: string }[] = [
  { id: 'worksheet', title: 'Worksheet', blurb: 'Puzzles, tracing, counting and more, in activity blocks.' },
  { id: 'planner', title: 'Planner', blurb: 'A daily routine, week plan, checklist or first–then board, in pictures.' },
];

export const Mini: React.FC<{ page: Page; pageSize: PageSizeId; size?: number }> = ({ page, pageSize, size = 132 }) => {
  const d = pageDims(pageSize, page);
  const box = size;
  const scale = box / Math.max(d.width, d.height);
  return (
    <div className="flex items-center justify-center" style={{ width: box, height: box }}>
      <div className="relative bg-white shadow-md" style={{ width: d.width * scale, height: d.height * scale }}>
        <div style={{ width: d.width, height: d.height, transform: `scale(${scale})`, transformOrigin: 'top left' }} className="absolute top-0 left-0 pointer-events-none">
          <WorksheetPageSvg page={page} pageIndex={0} pageSize={pageSize} isInteractive={true} />
        </div>
      </div>
    </div>
  );
};

export const WhatAreYouMaking: React.FC<{
  mode: 'new' | 'add';
  pageSize: PageSizeId;
  onChoose: (choice: MakeChoice) => void;
  onClose: () => void;
}> = ({ mode, pageSize, onChoose, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const previews = useMemo(() => {
    const worksheet: Page = { id: 'preview_ws', title: 'Page 1', layout: '2-half', showDateName: true, slots: createSlotsForPreset('2-half') };
    return {
      worksheet,
      // An example day, so the card shows what a planner looks like
      planner: { ...createPlannerPage('day', 0), id: 'preview_planner', planner: samplePlanner('day') },
    } as Record<MakeChoice, Page>;
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-[#2D2200]/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={mode === 'new' ? 'What are you making?' : 'Add a page'}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF8F0] rounded-2xl border-2 border-[#2D2200] shadow-[6px_6px_0_#2D2200] w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DEC9] bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-extrabold text-[#2D2200]">{mode === 'new' ? 'What are you making today?' : 'What kind of page?'}</h2>
            <p className="text-xs text-[#6B5838]">
              {mode === 'new' ? 'Pick one to start. You can add other kinds of pages to it later.' : 'Worksheets and planners can go in the same document.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] rounded-lg" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChoose(c.id)}
              className="group flex flex-col items-center gap-3 p-3 bg-white border-2 border-[#E2DEC9] rounded-xl text-center hover:border-[#2D2200] hover:shadow-[3px_3px_0_#2D2200] focus:outline-none focus-visible:border-[#009BD9] transition-all"
            >
              <Mini page={previews[c.id]} pageSize={pageSize} size={180} />
              <span>
                <span className="block text-sm font-extrabold text-[#2D2200]">{c.title}</span>
                <span className="block text-[11px] text-[#6B5838] leading-snug mt-0.5">{c.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
