/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner page drawing
 *
 * Draws a planner (day timeline, week, checklist or first–then board) inside the page's
 * header and footer, in the Ink Style: ink outlines on white, guide lines in the light
 * guide colour, pictures from the picture library. Pure SVG, so it prints and exports as
 * sharply as the worksheets.
 */

import React from 'react';
import { PageSizeId, PlannerData, PlannerItem } from '../types';
import { PlannerGraphic } from './plannerIcons';
import { FRAME_STROKE } from '../utils/spacing';
import { plannerGeometry, ItemBox, PlannerGeometry } from './plannerLayout';
import { DAY_PARTS, hourLabel, lengthLabel, STEP, timeLabel, visibleItems } from './plannerModel';

const INK = '#2D2200';
const GUIDE = '#DDD9C4';
const TRACE = '#B6B2A6';
const FONT = 'Nunito, sans-serif';

/** Font size that keeps `text` inside `width` (Nunito ExtraBold averages about 0.56 em a letter) */
const fit = (text: string, width: number, max: number, min = 7) => Math.max(min, Math.min(max, width / (Math.max(1, text.length) * 0.56)));

const Tick: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <rect x={x} y={y} width={size} height={size} rx={size * 0.22} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
);

/** One activity card: picture on the left, words and time beside it */
function RowCard({ it, b, p, big = false }: { it: PlannerItem; b: ItemBox; p: PlannerData; big?: boolean }) {
  const pad = Math.min(6, b.h * 0.12);
  const pic = Math.max(10, Math.min(b.h - pad * 2, big ? 72 : 56));
  const tickSize = p.showTicks ? Math.min(b.h - pad * 2, big ? 34 : 18) : 0;
  const textX = b.x + pad + pic + 8;
  const textW = b.w - (textX - b.x) - (tickSize ? tickSize + 10 : 6);
  const showTime = p.showTimes && p.kind === 'day' && it.start !== undefined;
  const time = showTime ? `${timeLabel(it.start!)}–${timeLabel(it.start! + (it.minutes ?? STEP))}` : '';
  const twoLines = showTime && b.h >= 34;
  const size = fit(it.label, textW, big ? 24 : Math.min(15, b.h * 0.62), 4);
  const cy = b.y + b.h / 2;
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(10, b.h / 3)} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
      <PlannerGraphic picture={it.picture} cx={b.x + pad + pic / 2} cy={cy} size={pic} />
      <text x={textX} y={twoLines ? cy - 2 : cy + size * 0.36} fill={INK} fontSize={size} fontWeight={800} fontFamily={FONT}>
        {it.label}
      </text>
      {showTime && (
        <text
          x={twoLines ? textX : b.x + b.w - (tickSize ? tickSize + 12 : 8)}
          y={twoLines ? cy + 11 : cy + 3.5}
          textAnchor={twoLines ? 'start' : 'end'}
          fill={INK}
          fontSize={Math.min(9, b.h * 0.62)}
          fontWeight={700}
          fontFamily={FONT}
        >
          {time}
        </text>
      )}
      {tickSize > 0 && <Tick x={b.x + b.w - tickSize - pad - 2} y={cy - tickSize / 2} size={tickSize} />}
    </g>
  );
}

/** A card for the week view, sized by its length: picture over words when there's room,
 * picture beside words when short, and just the picture on a 15-minute sliver. */
function StackCard({ it, b, p }: { it: PlannerItem; b: ItemBox; p: PlannerData }) {
  const len = p.showTimes ? `${timeLabel(it.start ?? 0)} · ${lengthLabel(it.minutes ?? STEP)}` : '';
  const rx = Math.min(8, b.h / 3);
  const frame = <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={rx} fill="#FFFFFF" stroke={INK} strokeWidth={b.h < 20 ? 1 : 1.25} />;
  if (b.h < 20) {
    // A sliver: the picture alone, with the words if they fit beside it
    const pic = Math.max(6, b.h - 3);
    const textX = b.x + 3 + pic + 3;
    const size = fit(it.label, b.x + b.w - textX - 3, Math.min(8, b.h * 0.62), 4);
    return (
      <g>
        {frame}
        <PlannerGraphic picture={it.picture} cx={b.x + 2 + pic / 2} cy={b.y + b.h / 2} size={pic} />
        {size >= 4.5 && (
          <text x={textX} y={b.y + b.h / 2 + size * 0.36} fill={INK} fontSize={size} fontWeight={800} fontFamily={FONT}>
            {it.label}
          </text>
        )}
      </g>
    );
  }
  if (b.h < 56) {
    const pic = Math.max(8, Math.min(b.h - 6, 26));
    const tick = p.showTicks ? Math.min(10, b.h - 8) : 0;
    const textX = b.x + 4 + pic + 4;
    const twoLines = len && b.h >= 30;
    const size = fit(it.label, b.x + b.w - textX - tick - 4, 9, 5);
    const cy = b.y + b.h / 2;
    return (
      <g>
        {frame}
        <PlannerGraphic picture={it.picture} cx={b.x + 3 + pic / 2} cy={cy} size={pic} />
        <text x={textX} y={twoLines ? cy - 1 : cy + size * 0.36} fill={INK} fontSize={size} fontWeight={800} fontFamily={FONT}>
          {it.label}
        </text>
        {twoLines && (
          <text x={textX} y={cy + 8} fill={INK} fontSize={6} fontWeight={700} fontFamily={FONT}>
            {len}
          </text>
        )}
        {tick > 0 && <Tick x={b.x + b.w - tick - 3} y={cy - tick / 2} size={tick} />}
      </g>
    );
  }
  const labelH = 13;
  const tagH = len ? 9 : 0; // the time sits between the picture and the words
  const tick = p.showTicks ? 11 : 0;
  const pic = Math.max(10, Math.min(b.h - labelH - tagH - 8, b.w - 12, 56));
  const picY = b.y + (b.h - labelH - tagH - pic) / 2;
  return (
    <g>
      {frame}
      <PlannerGraphic picture={it.picture} cx={b.x + b.w / 2} cy={picY + pic / 2} size={pic} />
      {len && (
        <text x={b.x + b.w / 2} y={b.y + b.h - 6 - labelH + 1} textAnchor="middle" fill={INK} fontSize={6.5} fontWeight={700} fontFamily={FONT}>
          {len}
        </text>
      )}
      <text
        x={b.x + b.w / 2 - tick / 2}
        y={b.y + b.h - 6}
        textAnchor="middle"
        fill={INK}
        fontSize={fit(it.label, b.w - 8 - tick, 10, 6)}
        fontWeight={800}
        fontFamily={FONT}
      >
        {it.label}
      </text>
      {tick > 0 && <Tick x={b.x + b.w - tick - 4} y={b.y + 4} size={tick} />}
    </g>
  );
}

/** A start time for the rail: 7 am, 7:30, 12 pm */
const railTime = (m: number) => (m % 60 === 0 ? hourLabel(m / 60) : timeLabel(m));

/**
 * The day's rail: each activity's start time beside its card, and a sunrise, sun or moon
 * beside the first activity of the morning, afternoon and evening.
 */
function Rail({ g, p }: { g: PlannerGeometry; p: PlannerData }) {
  const col = g.timeCol!;
  const list = visibleItems(p);
  const boxes = new Map(g.items.map((b) => [b.id, b]));
  const seen = new Set<string>();
  return (
    <g>
      {list.map((it) => {
        const b = boxes.get(it.id);
        if (!b) return null;
        const hour = (it.start ?? 0) / 60;
        const part = [...DAY_PARTS].reverse().find((pt) => hour >= pt.from)!;
        const first = !seen.has(part.key);
        seen.add(part.key);
        const size = Math.min(9.5, Math.max(6.5, b.h * 0.5));
        return (
          <g key={it.id}>
            <text x={col.x} y={b.y + size + 1} fill={INK} fontSize={size} fontWeight={800} fontFamily={FONT}>
              {railTime(it.start ?? 0)}
            </text>
            {first && <PlannerGraphic picture={part.icon} cx={col.x + col.w - 7} cy={b.y + size * 0.6 + 1} size={12} />}
          </g>
        );
      })}
    </g>
  );
}

export const PlannerPageContent: React.FC<{ planner: PlannerData; pageSize: PageSizeId; showDateName: boolean }> = ({
  planner: p,
  pageSize,
  showDateName,
}) => {
  const g = plannerGeometry(pageSize, showDateName, p);
  const byId = new Map(p.items.map((i) => [i.id, i]));

  if (p.kind === 'day') {
    return (
      <g className="planner-day">
        <Rail g={g} p={p} />
        {g.items.map((b) => byId.get(b.id) && <RowCard key={b.id} it={byId.get(b.id)!} b={b} p={p} />)}
      </g>
    );
  }

  if (p.kind === 'week') {
    return (
      <g className="planner-week">
        {g.columns!.map((c) => (
          <g key={c.day}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={FRAME_STROKE} />
            <line x1={c.x} y1={c.y + g.headerH!} x2={c.x + c.w} y2={c.y + g.headerH!} stroke={INK} strokeWidth={1.5} />
            <text x={c.x + c.w / 2} y={c.y + 20} textAnchor="middle" fill={INK} fontSize={fit(c.label, c.w - 8, 12)} fontWeight={900} fontFamily={FONT}>
              {c.label}
            </text>
          </g>
        ))}
        {g.items.map((b) => byId.get(b.id) && <StackCard key={b.id} it={byId.get(b.id)!} b={b} p={p} />)}
      </g>
    );
  }

  if (p.kind === 'checklist') {
    return (
      <g className="planner-checklist">
        {g.rowBoxes!.map((r, i) => {
          const item = g.items[i] && byId.get(g.items[i].id);
          if (item) return null;
          // Spare rows: dashed, to draw or write in another step
          return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={10} fill="none" stroke={TRACE} strokeWidth={1.5} strokeDasharray="6 6" />;
        })}
        {g.items.map((b) => byId.get(b.id) && <RowCard key={b.id} it={byId.get(b.id)!} b={b} p={p} big />)}
      </g>
    );
  }

  // First–then
  const panels = g.panels!;
  const arrowX = (panels[0].x + panels[0].w + panels[1].x) / 2;
  const arrowY = g.area.y + g.area.h / 2;
  return (
    <g className="planner-first-then">
      {panels.map((pn) => {
        const box = g.items.find((b) => byId.get(b.id)?.side === pn.side);
        const it = box && byId.get(box.id);
        const pic = Math.min(pn.w - 60, pn.h - 150);
        return (
          <g key={pn.side}>
            <rect x={pn.x} y={pn.y} width={pn.w} height={pn.h} rx={16} fill="#FFFFFF" stroke={INK} strokeWidth={FRAME_STROKE} />
            <text x={pn.x + pn.w / 2} y={pn.y + 48} textAnchor="middle" fill={INK} fontSize={34} fontWeight={900} fontFamily={FONT}>
              {pn.side === 'first' ? 'First' : 'Then'}
            </text>
            {it ? (
              <>
                <PlannerGraphic picture={it.picture} cx={pn.x + pn.w / 2} cy={pn.y + 70 + pic / 2} size={pic} />
                <text x={pn.x + pn.w / 2} y={pn.y + pn.h - 28} textAnchor="middle" fill={INK} fontSize={fit(it.label, pn.w - 40, 28)} fontWeight={800} fontFamily={FONT}>
                  {it.label}
                </text>
              </>
            ) : (
              <rect x={pn.x + 30} y={pn.y + 70} width={pn.w - 60} height={pn.h - 130} rx={12} fill="none" stroke={TRACE} strokeWidth={1.5} strokeDasharray="6 6" />
            )}
          </g>
        );
      })}
      <path
        d={`M ${arrowX - 16} ${arrowY} L ${arrowX + 14} ${arrowY} M ${arrowX + 3} ${arrowY - 12} L ${arrowX + 15} ${arrowY} L ${arrowX + 3} ${arrowY + 12}`}
        fill="none"
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};
