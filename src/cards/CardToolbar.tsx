/**
 * @license
 * Sunshine Brigade Worksheet Builder - Flash card toolbar
 *
 * The bar above a flash card page: how many cards a page, fold-over or one-sided, and
 * which cards this page holds, with a button that adds pages for the rest of the deck.
 */

import React from 'react';
import { CardDeck, Page } from '../types';
import { Plus } from '../components/icons';
import { cardsPerPage, deckCards } from './cardModel';

const seg = (on: boolean) => `px-2 py-1 text-[11px] font-bold rounded-md transition-all ${on ? 'bg-white text-[#2D2200] shadow-xs' : 'text-[#6B5838] hover:text-[#2D2200]'}`;

export const CardToolbar: React.FC<{ page: Page; pages: Page[]; onUpdate: (patch: Partial<CardDeck>) => void; onAddPages: () => void }> = ({ page, pages, onUpdate, onAddPages }) => {
  const d = page.cards!;
  const total = deckCards(d).length;
  const per = cardsPerPage(d);
  const first = Math.min(d.from + 1, total);
  const last = Math.min(d.from + per, total);
  // Pages of this deck, and whether they cover every card
  const covered = Math.max(...pages.filter((p) => p.cards?.id === d.id).map((p) => p.cards!.from + cardsPerPage(p.cards!)));
  const missing = Math.max(0, Math.ceil((total - covered) / per));
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B5838] hidden sm:inline">Cards:</span>
        <div role="group" aria-label="Card size" className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] gap-1">
          {([
            { n: 4, tip: 'Big cards: 4 a page' },
            { n: 6, tip: 'Everyday cards: 6 a page' },
            { n: 9, tip: 'Small cards, like playing cards: 9 a page' },
          ] as const).map(({ n, tip }) => (
            <button key={n} type="button" title={tip} aria-pressed={d.perPage === n} onClick={() => onUpdate({ perPage: n })} className={seg(d.perPage === n)}>
              {n === 4 ? 'Big' : n === 6 ? 'Medium' : 'Small'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B5838] hidden xl:inline">Print:</span>
        <div role="group" aria-label="How the cards print" className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] gap-1">
          <button type="button" title="Front and back side by side: cut out, fold down the middle" aria-pressed={d.print === 'fold'} onClick={() => onUpdate({ print: 'fold' })} className={seg(d.print === 'fold')}>
            Fold-over
          </button>
          <button type="button" title="Everything on one side: just cut out" aria-pressed={d.print === 'single'} onClick={() => onUpdate({ print: 'single' })} className={seg(d.print === 'single')}>
            One-sided
          </button>
        </div>
      </div>
      <span className="text-[11px] font-bold text-[#6B5838] whitespace-nowrap hidden lg:inline">
        {total ? `Cards ${first}–${last} of ${total}` : 'No cards picked'}
      </span>
      {missing > 0 && (
        <button
          type="button"
          onClick={onAddPages}
          title="Add pages for the rest of the cards"
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-white bg-[#009BD9] rounded-lg hover:bg-[#0087BD] whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> {missing} more {missing === 1 ? 'page' : 'pages'} for the rest
        </button>
      )}
    </div>
  );
};
