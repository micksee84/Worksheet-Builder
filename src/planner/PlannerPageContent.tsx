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
import { Picture } from '../blocks/pictures';
import { FRAME_STROKE } from '../utils/spacing';
import { plannerGeometry, ItemBox } from './plannerLayout';
import { hourLabel, STEP, timeLabel } from './plannerModel';

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
  const size = fit(it.label, textW, big ? 24 : Math.min(15, b.h * 0.5));
  const cy = b.y + b.h / 2;
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(10, b.h / 3)} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
      <Picture name={it.picture} cx={b.x + pad + pic / 2} cy={cy} size={pic} />
      <text x={textX} y={twoLines ? cy - 2 : cy + size * 0.36} fill={INK} fontSize={size} fontWeight={800} fontFamily={FONT}>
        {it.label}
      </text>
      {showTime && (
        <text
          x={twoLines ? textX : b.x + b.w - (tickSize ? tickSize + 12 : 8)}
          y={twoLines ? cy + 11 : cy + 3.5}
          textAnchor={twoLines ? 'start' : 'end'}
          fill={INK}
          fontSize={9}
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

/** A small card for the week view: picture on top, words underneath */
function StackCard({ it, b, p }: { it: PlannerItem; b: ItemBox; p: PlannerData }) {
  // A busy day: short cards, so the picture sits beside the words instead
  if (b.h < 50) {
    const pic = Math.max(8, b.h - 6);
    const tick = p.showTicks ? Math.min(10, b.h - 8) : 0;
    const textX = b.x + 4 + pic + 4;
    return (
      <g>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(8, b.h / 3)} fill="#FFFFFF" stroke={INK} strokeWidth={1.25} />
        <Picture name={it.picture} cx={b.x + 3 + pic / 2} cy={b.y + b.h / 2} size={pic} />
        <text x={textX} y={b.y + b.h / 2 + 3} fill={INK} fontSize={fit(it.label, b.x + b.w - textX - tick - 6, 9, 5.5)} fontWeight={800} fontFamily={FONT}>
          {it.label}
        </text>
        {tick > 0 && <Tick x={b.x + b.w - tick - 3} y={b.y + b.h / 2 - tick / 2} size={tick} />}
      </g>
    );
  }
  const labelH = 13;
  const tick = p.showTicks ? 11 : 0;
  const pic = Math.max(10, Math.min(b.h - labelH - 8, b.w - 12));
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
      <Picture name={it.picture} cx={b.x + b.w / 2} cy={b.y + 4 + pic / 2} size={pic} />
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

export const PlannerPageContent: React.FC<{ planner: PlannerData; pageSize: PageSizeId; showDateName: boolean }> = ({
  planner: p,
  pageSize,
  showDateName,
}) => {
  const g = plannerGeometry(pageSize, showDateName, p);
  const byId = new Map(p.items.map((i) => [i.id, i]));

  if (p.kind === 'day') {
    const rowH = g.rowH!;
    const rows = (p.endHour - p.startHour) * (60 / STEP);
    const trackX = g.area.x + g.timeCol!.w;
    return (
      <g className="planner-day">
        {Array.from({ length: rows + 1 }, (_, r) => {
          const y = g.area.y + r * rowH;
          const onHour = r % (60 / STEP) === 0;
          return (
            <g key={r}>
              <line
                x1={onHour ? trackX - 4 : trackX + 6}
                y1={y}
                x2={g.area.x + g.area.w}
                y2={y}
                stroke={GUIDE}
                strokeWidth={onHour ? 1.25 : 0.75}
                strokeDasharray={onHour ? undefined : '3 4'}
              />
              {onHour && r < rows && (
                <text x={g.area.x} y={y + 11} fill={INK} fontSize={10} fontWeight={800} fontFamily={FONT}>
                  {hourLabel(p.startHour + r / (60 / STEP))}
                </text>
              )}
            </g>
          );
        })}
        {g.items.map((b) => byId.get(b.id) && <RowCard key={b.id} it={byId.get(b.id)!} b={b} p={p} />)}
      </g>
    );
  }

  if (p.kind === 'week') {
    return (
      <g className="planner-week">
        {g.columns!.map((c) => (
          <g key={c.day}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={12} fill="#FFFFFF" stroke={INK} strokeWidth={FRAME_STROKE} />
            <line x1={c.x} y1={c.y + g.headerH!} x2={c.x + c.w} y2={c.y + g.headerH!} stroke={INK} strokeWidth={1.5} />
            <text x={c.x + c.w / 2} y={c.y + 20} textAnchor="middle" fill={INK} fontSize={fit(c.label, c.w - 10, 13)} fontWeight={900} fontFamily={FONT}>
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
                <Picture name={it.picture} cx={pn.x + pn.w / 2} cy={pn.y + 70 + pic / 2} size={pic} />
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
