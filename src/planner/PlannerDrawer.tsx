/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner settings panel
 *
 * The same docked panel as block settings, for planner pages. Two modes:
 * - an activity is selected: its words, picture, and when or where it goes
 * - nothing selected (Settings, or a click on the page): the planner's own options
 * Changes show on the page straight away, like block settings.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Trash2, Settings, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Search, RotateCcw } from '../components/icons';
import { GroupTask, PlannerData, PlannerItem, PlannerKind } from '../types';
import { GraphicThumb, ICON_NAMES, PLANNER_ICONS } from './plannerIcons';
import { daysShown, GROUP_MAX, hourLabel, KIND_LABELS, lengthLabel, MAX_MINUTES, STEP, tasksOf, timeLabel } from './plannerModel';

/** Two tasks trade places */
const swap = (list: GroupTask[], a: number, b: number) => {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
};

const field = 'w-full px-3.5 py-2.5 text-sm font-medium text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9] transition-all';
const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div className="space-y-0.5">
    <label className="text-sm font-bold text-[#2D2200]">{children}</label>
    {hint && <p className="text-xs text-[#6B5838]">{hint}</p>}
  </div>
);
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#009BD9] focus:ring-[#009BD9] border-[#C4BEB0]" />
    <span>
      <span className="block text-sm font-bold text-[#2D2200]">{label}</span>
      {hint && <span className="block text-xs text-[#6B5838]">{hint}</span>}
    </span>
  </label>
);

/** The icon picker: all planner icons, searchable by the words people use ("teeth", "tv") */
const IconPicker: React.FC<{ value: string; onChange: (picture: string) => void }> = ({ value, onChange }) => {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term
      ? ICON_NAMES.filter((n) => n.toLowerCase().includes(term) || PLANNER_ICONS[n].words.includes(term))
      : ICON_NAMES;
  }, [q]);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A39C8E]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an icon (teeth, bath, park...)" className={`${field} pl-9 py-2 text-xs`} />
      </div>
      <div className="grid grid-cols-6 gap-1.5 max-h-60 overflow-y-auto p-0.5">
        {list.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(`ph:${n}`)}
            title={PLANNER_ICONS[n].words.split(' ')[0]}
            aria-label={PLANNER_ICONS[n].words.split(' ')[0]}
            aria-pressed={value === `ph:${n}`}
            className={`aspect-square rounded-lg bg-white border flex items-center justify-center ${
              value === `ph:${n}` ? 'border-[3px] border-[#009BD9] bg-[#009BD9]/5' : 'border-[#E2DEC9] hover:border-[#2D2200]'
            }`}
          >
            <GraphicThumb picture={`ph:${n}`} size={30} />
          </button>
        ))}
        {list.length === 0 && <p className="col-span-6 text-xs text-[#6B5838] py-4 text-center">No icon for that yet. Try another word.</p>}
      </div>
    </div>
  );
};

export const PlannerDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  planner: PlannerData | null;
  item: PlannerItem | null;
  onUpdateItem: (patch: Partial<PlannerItem>) => void;
  onMoveItem: (dir: -1 | 1) => void;
  onRemoveItem: () => void;
  /** Daily routine blocks: set the block's tasks (first one leads), or split it into cards */
  onSetTasks?: (tasks: GroupTask[]) => void;
  onSplit?: () => void;
  onUpdatePlanner: (patch: Partial<PlannerData>) => void;
  onChangeKind: (kind: PlannerKind) => void;
  onClearAll: () => void;
  onResetExample: () => void;
  showDateName: boolean;
  onToggleDateName: (on: boolean) => void;
}> = ({
  isOpen,
  onClose,
  planner,
  item,
  onUpdateItem,
  onMoveItem,
  onRemoveItem,
  onSetTasks,
  onSplit,
  onUpdatePlanner,
  onChangeKind,
  onClearAll,
  onResetExample,
  showDateName,
  onToggleDateName,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = Boolean(isOpen && planner);

  // Close on a click outside or Escape, like block settings. Clicking another activity
  // (or Settings) keeps it open and switches what it shows.
  useEffect(() => {
    if (!visible) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!panelRef.current || !target || panelRef.current.contains(target)) return;
      if (target.closest?.('[data-opens-settings]')) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, onClose]);

  if (!visible || !planner) return null;
  const kind = planner.kind;
  // A daily routine card holding several tasks
  const tasks = item ? tasksOf(item) : [];
  const block = kind === 'day' && tasks.length > 1;
  const hours = Array.from({ length: 25 }, (_, h) => h);
  const times: number[] = [];
  for (let t = planner.startHour * 60; t < planner.endHour * 60; t += STEP) times.push(t);
  // Every 15 minutes, up to 7 hours
  const lengths = Array.from({ length: MAX_MINUTES / STEP }, (_, i) => (i + 1) * STEP);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={item ? `${item.label} settings` : 'Planner settings'}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[55vh] rounded-t-2xl border-t shadow-2xl md:static md:inset-auto md:z-auto md:max-h-none md:h-full md:w-[340px] lg:w-[360px] md:flex-none md:rounded-none md:border-t-0 md:border-l md:shadow-none bg-white border-[#E2DEC9] flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DEC9] bg-[#FAF8F0]">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B5F45]">
            Planner • {KIND_LABELS[kind].label}
          </span>
          <h2 className="text-xl font-extrabold text-[#2D2200] truncate">{item ? (block ? tasks.map((t) => t.label).join(' + ') : item.label || 'Activity') : 'Planner settings'}</h2>
        </div>
        <button onClick={onClose} className="p-2 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] rounded-lg" title="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {item ? (
          <>
            {block ? (
              <div className="space-y-2">
                <Label>Tasks in this block</Label>
                {tasks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-1.5">
                    <GraphicThumb picture={t.picture} size={28} />
                    <input
                      value={t.label}
                      maxLength={40}
                      onChange={(e) => onSetTasks?.(tasks.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))}
                      className={`${field} py-1.5`}
                    />
                    <button type="button" title="Move left (earlier in the block)" disabled={i === 0} onClick={() => onSetTasks?.(swap(tasks, i, i - 1))} className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" title="Move right (later in the block)" disabled={i === tasks.length - 1} onClick={() => onSetTasks?.(swap(tasks, i, i + 1))} className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" title="Remove from this block" onClick={() => onSetTasks?.(tasks.filter((x) => x.id !== t.id))} className="p-1.5 text-[#6B5838] hover:text-[#D94A38]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-[#6B5838]">
                  {tasks.length < GROUP_MAX ? `Drag another task onto this card to add it (up to ${GROUP_MAX}). ` : ''}On the page, drag a task between the others to reorder, or out of the card to make it its own.
                </p>
                <button type="button" onClick={onSplit} className="w-full py-2 text-xs font-bold text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg hover:border-[#2D2200]">
                  Split into separate cards
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Words</Label>
                <input value={item.label} maxLength={40} onChange={(e) => onUpdateItem({ label: e.target.value })} className={field} placeholder="e.g. Brush teeth" />
                {kind === 'day' && <p className="text-[11px] text-[#6B5838]">Drag another task onto this card to do them together in one block.</p>}
              </div>
            )}

            {(kind === 'day' || kind === 'week') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Starts at</Label>
                  <select value={item.start ?? times[0]} onChange={(e) => onUpdateItem({ start: Number(e.target.value) })} className={`${field} cursor-pointer`}>
                    {times.map((t) => (
                      <option key={t} value={t}>{`${timeLabel(t)} ${t < 720 ? 'am' : 'pm'}`}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>How long</Label>
                  <select value={item.minutes ?? STEP} onChange={(e) => onUpdateItem({ minutes: Number(e.target.value) })} className={`${field} cursor-pointer`}>
                    {lengths.map((m) => (
                      <option key={m} value={m}>{lengthLabel(m)}</option>
                    ))}
                  </select>
                </div>
                <p className="col-span-2 text-[11px] text-[#6B5838] -mt-1">Or drag the bottom edge of the card on the page.</p>
              </div>
            )}

            {kind === 'week' && (
              <div className="space-y-1.5">
                <Label>Day</Label>
                <select value={item.day ?? 'mon'} onChange={(e) => onUpdateItem({ day: e.target.value as PlannerItem['day'] })} className={`${field} cursor-pointer`}>
                  {daysShown(planner).map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
            )}

            {kind === 'first-then' && (
              <div className="space-y-1.5">
                <Label>Side</Label>
                <div className="flex gap-2">
                  {(['first', 'then'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => onUpdateItem({ side })}
                      aria-pressed={item.side === side}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border ${item.side === side ? 'bg-[#2D2200] text-white border-[#2D2200]' : 'bg-white text-[#2D2200] border-[#E2DEC9] hover:border-[#2D2200]'}`}
                    >
                      {side === 'first' ? 'First' : 'Then'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kind === 'checklist' && (
              <div className="flex gap-2">
                <button type="button" onClick={() => onMoveItem(-1)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg hover:border-[#2D2200]">
                  <ArrowUp className="w-3.5 h-3.5" /> Move up
                </button>
                <button type="button" onClick={() => onMoveItem(1)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg hover:border-[#2D2200]">
                  <ArrowDown className="w-3.5 h-3.5" /> Move down
                </button>
              </div>
            )}

            {!block && (
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <IconPicker value={item.picture} onChange={(picture) => onUpdateItem({ picture })} />
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-[#6B5838] leading-relaxed">{KIND_LABELS[kind].blurb}</p>
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5838] flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                Planner settings
              </h3>
            </div>
            <div className="space-y-1.5">
              <Label hint="Your activities stay when you switch.">Show as</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(KIND_LABELS) as PlannerKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onChangeKind(k)}
                    aria-pressed={kind === k}
                    className={`py-2 text-sm font-bold rounded-lg border ${kind === k ? 'bg-[#2D2200] text-white border-[#2D2200]' : 'bg-white text-[#2D2200] border-[#E2DEC9] hover:border-[#2D2200]'}`}
                  >
                    {KIND_LABELS[k].label}
                  </button>
                ))}
              </div>
            </div>

            {(kind === 'day' || kind === 'week') && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Day starts</Label>
                    <select value={planner.startHour} onChange={(e) => onUpdatePlanner({ startHour: Math.min(Number(e.target.value), planner.endHour - 1) })} className={`${field} cursor-pointer`}>
                      {hours.slice(0, 24).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Day ends</Label>
                    <select value={planner.endHour} onChange={(e) => onUpdatePlanner({ endHour: Math.max(Number(e.target.value), planner.startHour + 1) })} className={`${field} cursor-pointer`}>
                      {hours.slice(1).map((h) => <option key={h} value={h}>{h === 24 ? 'midnight' : hourLabel(h)}</option>)}
                    </select>
                  </div>
                </div>
                <Toggle checked={planner.showTimes} onChange={(showTimes) => onUpdatePlanner({ showTimes })} label="Show times on activities" hint={kind === 'week' ? 'Like 9:00 · 1 h, on cards with room.' : 'Like 7:30–8:00. Hours always show down the side.'} />
              </>
            )}
            {kind === 'week' && (
              <Toggle checked={planner.weekdaysOnly} onChange={(weekdaysOnly) => onUpdatePlanner({ weekdaysOnly })} label="Weekdays only" hint="Monday to Friday, with more room for each day." />
            )}

            {kind !== 'first-then' && (
              <Toggle checked={planner.showTicks} onChange={(showTicks) => onUpdatePlanner({ showTicks })} label="Tick boxes" hint="A box beside each activity to tick when it's done." />
            )}
            <Toggle checked={showDateName} onChange={onToggleDateName} label="Name and date line" hint="Under the title, to write on." />

            <div className="pt-4 border-t border-[#E2DEC9] flex flex-col gap-2">
              <button type="button" onClick={onResetExample} className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg hover:border-[#2D2200]">
                <RotateCcw className="w-3.5 h-3.5" /> Start again from the example
              </button>
              <button type="button" onClick={onClearAll} className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#E52311] bg-white border border-[#E2DEC9] rounded-lg hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" /> Clear all activities
              </button>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#E2DEC9] bg-[#FAF8F0] flex items-center justify-between gap-3">
        {item ? (
          <button onClick={onRemoveItem} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#E52311] hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" /> Remove activity
          </button>
        ) : (
          <span />
        )}
        <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-white bg-[#2D2200] hover:bg-[#F2B800] hover:text-[#2D2200] rounded-lg transition-colors">
          Done
        </button>
      </div>
    </div>
  );
};
