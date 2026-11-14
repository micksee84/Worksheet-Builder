/**
 * @license
 * Sunshine Brigade Worksheet Builder - Flash card pages (drawing)
 *
 * Draws a flash card page: the cards in a grid, touching, with dashed cut lines between
 * them and around the outside (a pair of scissors marks where to start). Fold-over cards
 * have a lighter dotted fold line down the middle, front on the left, back on the right:
 * folded over, the back reads the right way up. Ink Style: ink on white only.
 */

import React from 'react';
import { PageSizeId, Page } from '../types';
import { Picture } from '../blocks/pictures';
import { HandArtBox } from '../blocks/handArt';
import { PlannerIcon } from '../planner/plannerIcons';
import { Box, CardFace, cardSheet, pageCards } from './cardModel';

const INK = '#2D2200';
const TRACE = '#B6B2A6';
const FONT = 'Nunito, sans-serif';

/** A font size that fits text across a width */
const fit = (text: string, width: number, max: number, perChar = 0.6) => Math.max(6, Math.min(max, width / (Math.max(1, text.length) * perChar)));

/** Things to count: in rows of five, like a ten frame, or as dots in ten frames */
const Count: React.FC<{ n: number; art: string; box: Box }> = ({ n, art, box }) => {
  if (art === 'dots') {
    // Ten frames: one for up to 10, two stacked for more
    const frames = n > 10 ? 2 : 1;
    const cell = Math.min(box.w / 5, box.h / (frames * 2 + (frames - 1) * 0.4));
    const fw = cell * 5;
    const fh = cell * 2;
    const total = frames * fh + (frames - 1) * cell * 0.4;
    const x0 = box.x + (box.w - fw) / 2;
    const y0 = box.y + (box.h - total) / 2;
    return (
      <g>
        {Array.from({ length: frames }, (_, f) => {
          const fy = y0 + f * (fh + cell * 0.4);
          return (
            <g key={f}>
              {Array.from({ length: 10 }, (_, i) => {
                const cx = x0 + (i % 5) * cell + cell / 2;
                const cy = fy + Math.floor(i / 5) * cell + cell / 2;
                const filled = f * 10 + i < n;
                return (
                  <g key={i}>
                    <rect x={cx - cell / 2} y={cy - cell / 2} width={cell} height={cell} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} />
                    {filled && <circle cx={cx} cy={cy} r={cell * 0.32} fill={INK} />}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  }
  if (n === 0) return null;
  const cols = Math.min(n, 5);
  const rows = Math.ceil(n / 5);
  const size = Math.min(box.w / cols, box.h / rows) * 0.88;
  const gx = box.w / cols;
  const gy = Math.min(box.h / rows, size / 0.88);
  const top = box.y + (box.h - gy * rows) / 2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const r = Math.floor(i / 5);
        const inRow = Math.min(5, n - r * 5);
        // Each row centred, so a short last row sits in the middle
        const left = box.x + (box.w - gx * inRow) / 2;
        return <HandArtBox key={i} id={art} cx={left + (i % 5) * gx + gx / 2} cy={top + r * gy + gy / 2} size={size} />;
      })}
    </g>
  );
};

/** One face of a card, filling its box: big text on top, the picture or things to count, the word at the bottom */
const Face: React.FC<{ face: CardFace; box: Box }> = ({ face, box }) => {
  const pad = Math.min(box.w, box.h) * 0.09;
  const inner = { x: box.x + pad, y: box.y + pad, w: box.w - pad * 2, h: box.h - pad * 2 };
  const parts: { kind: 'big' | 'picture' | 'count' | 'word'; weight: number }[] = [];
  if (face.big) parts.push({ kind: 'big', weight: face.picture || face.count ? 1 : 3 });
  if (face.picture) parts.push({ kind: 'picture', weight: 2.6 });
  if (face.count) parts.push({ kind: 'count', weight: 3.2 });
  if (face.word) parts.push({ kind: 'word', weight: parts.length ? 0.6 : 2 });
  const total = parts.reduce((a, p) => a + p.weight, 0);
  let y = inner.y;
  return (
    <g>
      {parts.map((p) => {
        const h = (inner.h * p.weight) / total;
        const b = { x: inner.x, y, w: inner.w, h };
        y += h;
        if (p.kind === 'big') {
          const size = fit(face.big!, b.w, b.h * 0.95, 0.66);
          return (
            <text key="big" x={b.x + b.w / 2} y={b.y + b.h / 2 + size * 0.36} textAnchor="middle" fill={INK} fontSize={size} fontWeight={900} fontFamily={FONT}>
              {face.big}
            </text>
          );
        }
        if (p.kind === 'word') {
          const size = fit(face.word!, b.w, Math.min(b.h * 0.8, 44), 0.56);
          return (
            <text key="word" x={b.x + b.w / 2} y={b.y + b.h / 2 + size * 0.36} textAnchor="middle" fill={INK} fontSize={size} fontWeight={800} fontFamily={FONT}>
              {face.word}
            </text>
          );
        }
        if (p.kind === 'count') return <Count key="count" n={face.count!.n} art={face.count!.art} box={b} />;
        const size = Math.min(b.w, b.h);
        const pic = face.picture!;
        return pic.startsWith('hand:') ? (
          <HandArtBox key="pic" id={pic.slice(5)} cx={b.x + b.w / 2} cy={b.y + b.h / 2} size={size} />
        ) : (
          <Picture key="pic" name={pic} cx={b.x + b.w / 2} cy={b.y + b.h / 2} size={size} />
        );
      })}
    </g>
  );
};

/** Both sides on one face (one-sided cards) */
const together = (front: CardFace, back: CardFace): CardFace => ({
  big: front.big ?? back.big,
  picture: front.picture ?? back.picture,
  count: front.count ?? back.count,
  word: front.word ?? back.word,
});

export const CardPageContent: React.FC<{ page: Page; pageSize: PageSizeId }> = ({ page, pageSize }) => {
  const d = page.cards!;
  const sheet = cardSheet(pageSize, page);
  const cards = pageCards(d);
  const noWord = (f: CardFace): CardFace => (d.words === false ? { ...f, word: undefined } : f);
  const { area } = sheet;
  return (
    <g className="flash-cards">
      {cards.map((c, i) => {
        const slot = sheet.slots[i];
        if (!slot) return null;
        return slot.back ? (
          <g key={c.id}>
            <Face face={noWord(c.front)} box={slot.front} />
            <Face face={noWord(c.back)} box={slot.back} />
          </g>
        ) : (
          <Face key={c.id} face={noWord(together(c.front, c.back))} box={slot.front} />
        );
      })}
      {/* Fold lines: lighter and dotted, so they don't read as cuts */}
      {sheet.folds.map((l, i) => (
        <line key={`f${i}`} x1={l.x1} y1={l.y1 + 6} x2={l.x2} y2={l.y2 - 6} stroke={TRACE} strokeWidth={1.25} strokeDasharray="1.5 4" strokeLinecap="round" />
      ))}
      {sheet.folds.length > 0 && (
        <text x={sheet.folds[0].x1} y={area.y - 5} textAnchor="middle" fill={TRACE} fontSize={8} fontWeight={800} fontFamily={FONT}>
          fold
        </text>
      )}
      {/* Cut lines: one dashed line between neighbours, and the outline */}
      {sheet.cuts.map((l, i) => (
        <line key={`c${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={INK} strokeWidth={0.9} strokeDasharray="6 4" />
      ))}
      {/* Scissors: start cutting here */}
      <rect x={area.x + 8} y={area.y - 7} width={16} height={14} fill="#FFFFFF" />
      <PlannerIcon name="Scissors" cx={area.x + 16} cy={area.y} size={13} />
    </g>
  );
};
