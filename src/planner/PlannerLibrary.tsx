/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner activity library
 *
 * The left panel while a planner page is open, in the same shell as the block library:
 * search, activities grouped by time of day, drag one onto the page or tap + to add it.
 * "Make your own" adds a blank activity and opens it to type a name and pick a picture.
 */

import React, { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus, Search, X, PanelLeftClose, PanelLeftOpen, Pencil } from 'lucide-react';
import { Picture } from '../blocks/pictures';
import { ACTIVITIES, ACTIVITY_GROUPS, PlannerActivity } from './activities';
import { PlannerKind } from '../types';

const minutesLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

/** A picture drawn into its own small SVG, for cards and pickers */
export const PictureThumb: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
    <Picture name={name} cx={50} cy={50} size={100} />
  </svg>
);

const ActivityCard: React.FC<{ activity: PlannerActivity; onAdd: (id: string) => void; slim: boolean; showLength: boolean }> = ({
  activity,
  onAdd,
  slim,
  showLength,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `planner-activity-${activity.id}`,
    data: { type: 'planner-activity', activityId: activity.id, label: activity.label, picture: activity.picture },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
      className={`group flex items-center gap-2.5 bg-white border border-[#E2DEC9] rounded-xl hover:border-[#2D2200] hover:shadow-[2px_2px_0_#2D2200] transition-all select-none ${slim ? 'p-2 lg:p-1.5' : 'p-2'}`}
    >
      <div className={`${slim ? 'lg:hidden' : ''}`}>
        <PictureThumb name={activity.picture} size={40} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[#2D2200] truncate">{activity.label}</p>
        {showLength && <p className={`text-[11px] text-[#6B5838] ${slim ? 'lg:hidden' : ''}`}>{minutesLabel(activity.minutes)}</p>}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onAdd(activity.id)}
        title="Add to the page"
        aria-label={`Add ${activity.label}`}
        className="p-1.5 rounded-lg text-[#2D2200] hover:bg-[#F2B800] shrink-0"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export const PlannerLibrary: React.FC<{
  kind: PlannerKind;
  onAddActivity: (activityId: string) => void;
  onAddCustom: () => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  slim?: boolean;
  onToggleSlim?: () => void;
}> = ({ kind, onAddActivity, onAddCustom, isOpenOnMobile, onCloseMobile, slim = false, onToggleSlim }) => {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ACTIVITIES.filter((a) => a.label.toLowerCase().includes(q) || a.picture.includes(q)) : ACTIVITIES;
  }, [query]);
  const hideWhenSlim = slim ? 'lg:hidden' : '';

  return (
    <>
      {isOpenOnMobile && <div className="fixed inset-0 bg-[#2D2200]/40 z-40 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 ${slim ? 'lg:w-42' : 'lg:w-84'} shrink-0 bg-[#FAF8F0] border-r border-[#E2DEC9] flex flex-col transition-[transform,width] duration-200 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`p-4 border-b border-[#E2DEC9] bg-white ${slim ? 'lg:p-3' : ''}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-extrabold text-[#2D2200] truncate">
              {slim ? (
                <>
                  <span className="lg:hidden">Routine activities</span>
                  <span className="hidden lg:inline">Activities</span>
                </>
              ) : (
                'Routine activities'
              )}
            </h2>
            {onToggleSlim && (
              <button
                type="button"
                onClick={onToggleSlim}
                title={slim ? 'Show full details' : 'Slim view: more room for your page'}
                aria-pressed={slim}
                className="hidden lg:inline-flex p-1.5 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] rounded-lg shrink-0"
              >
                {slim ? <PanelLeftOpen className="w-4.5 h-4.5" /> : <PanelLeftClose className="w-4.5 h-4.5" />}
              </button>
            )}
            <button onClick={onCloseMobile} title="Close the activity list" className="lg:hidden p-1.5 text-[#6B5838] hover:text-[#2D2200] rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A39C8E]" />
            <input
              type="text"
              placeholder={slim ? 'Search' : 'Search activities...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs font-medium text-[#2D2200] bg-[#FAF8F0] border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9] focus:bg-white placeholder:text-[#A39C8E]"
            />
            {query && (
              <button onClick={() => setQuery('')} title="Clear the search" className="absolute right-2.5 top-2.5 text-[#A39C8E] hover:text-[#2D2200]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 ${slim ? 'lg:p-3 lg:space-y-4' : ''}`}>
          <div className={`${hideWhenSlim} bg-[#FFF9E6] border border-[#F2B800]/30 rounded-xl p-3 text-xs text-[#6B5838] leading-relaxed`}>
            <span className="font-bold text-[#2D2200]">Tip: </span>
            {kind === 'day'
              ? 'Drag an activity to the time it happens, or tap + to add it after the last one.'
              : kind === 'week'
              ? 'Drag an activity onto a day, or tap + to add it to Monday.'
              : kind === 'checklist'
              ? 'Drag an activity into the list, or tap + to add it at the end.'
              : 'Drag an activity onto First or Then, or tap + to fill the next one.'}
          </div>

          <button
            type="button"
            onClick={onAddCustom}
            className="w-full flex items-center gap-2.5 p-2 border-2 border-dashed border-[#A39C8E] rounded-xl text-left hover:border-[#2D2200] hover:bg-white transition-colors"
          >
            <span className="w-10 h-10 shrink-0 rounded-lg bg-[#F2F2E2] flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#2D2200]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-[#2D2200]">Make your own</span>
              <span className={`block text-[11px] text-[#6B5838] ${hideWhenSlim}`}>Your words, any picture</span>
            </span>
          </button>

          {ACTIVITY_GROUPS.map((group) => {
            const list = shown.filter((a) => a.group === group.id);
            if (!list.length) return null;
            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5838]">{group.label}</h3>
                  <span className="text-[11px] font-semibold tabular-nums text-[#6B5F45]">{list.length}</span>
                </div>
                <div className={`space-y-2 ${slim ? 'lg:space-y-1.5' : ''}`}>
                  {list.map((a) => (
                    <ActivityCard key={a.id} activity={a} onAdd={onAddActivity} slim={slim} showLength={kind === 'day'} />
                  ))}
                </div>
              </div>
            );
          })}
          {shown.length === 0 && (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-sm font-bold text-[#2D2200]">No activities found</p>
              <p className="text-xs text-[#6B5838]">Try another word, or make your own.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
