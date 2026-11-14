/**
 * @license
 * Sunshine Brigade Worksheet Builder - Flash card panel
 *
 * The left panel on a flash card page: pick a set (letters, numbers, picture words,
 * feelings, shapes), its options, the order, and tick the cards to print.
 */

import React from 'react';
import { CardDeck, CardSet } from '../types';
import { X, Shuffle } from '../components/icons';
import { allCards, CARD_SETS, CARD_THEMES, SET_INFO } from './cardModel';
import { CHILD_NAMES } from '../blocks/FeelingsBlock';

const field = 'w-full px-3 py-2 text-sm font-medium text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9]';
const seg = (on: boolean) => `flex-1 px-2 py-1.5 text-xs font-bold rounded-md transition-all ${on ? 'bg-white text-[#2D2200] shadow-xs' : 'text-[#6B5838] hover:text-[#2D2200]'}`;

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="block text-xs font-bold uppercase tracking-wider text-[#6B5838] mb-1.5">{children}</span>;

function Segments<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex items-center bg-[#F2F2E2] p-1 rounded-lg gap-1">
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)} className={seg(value === o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Toggle: React.FC<{ checked: boolean; onChange: (on: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
    <span className="text-sm font-bold text-[#2D2200]">{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-[#009BD9]" />
  </label>
);

export const CardsPanel: React.FC<{
  deck: CardDeck;
  onUpdate: (patch: Partial<CardDeck>) => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}> = ({ deck: d, onUpdate, isOpenOnMobile, onCloseMobile }) => {
  const cards = allCards(d);
  const skip = new Set(d.skip ?? []);
  const toggleCard = (id: string, on: boolean) => {
    const next = new Set(skip);
    if (on) next.delete(id);
    else next.add(id);
    onUpdate({ skip: next.size ? [...next] : undefined });
  };

  return (
    <>
      {isOpenOnMobile && <div className="fixed inset-0 bg-[#2D2200]/40 z-40 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 lg:w-84 shrink-0 bg-[#FAF8F0] border-r border-[#E2DEC9] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-[#E2DEC9] bg-white flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-[#2D2200]">Flash cards</h2>
          <button onClick={onCloseMobile} title="Close" className="lg:hidden p-1.5 text-[#6B5838] hover:text-[#2D2200] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* The set */}
          <div>
            <Label>Cards</Label>
            <div className="space-y-1.5">
              {CARD_SETS.map((s: CardSet) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => s !== d.set && onUpdate({ set: s, skip: undefined, shuffle: undefined })}
                  aria-pressed={d.set === s}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all ${
                    d.set === s ? 'border-[#2D2200] bg-white shadow-[3px_3px_0_#2D2200]' : 'border-[#E2DEC9] bg-white hover:border-[#2D2200]'
                  }`}
                >
                  <span className="block text-sm font-extrabold text-[#2D2200]">{SET_INFO[s].label}</span>
                  <span className="block text-[11px] text-[#6B5838] leading-snug">{SET_INFO[s].blurb}</span>
                </button>
              ))}
            </div>
          </div>

          {/* The set's own options */}
          <div className="space-y-3">
            {d.set === 'letters' && (
              <>
                <div>
                  <Label>Letters</Label>
                  <Segments
                    label="Capitals or small letters"
                    value={d.letterCase ?? 'both'}
                    onChange={(v) => onUpdate({ letterCase: v })}
                    options={[
                      { v: 'both', label: 'Aa' },
                      { v: 'upper', label: 'A' },
                      { v: 'lower', label: 'a' },
                    ]}
                  />
                </div>
                <Toggle label="A picture for each letter" checked={d.letterPictures !== false} onChange={(on) => onUpdate({ letterPictures: on })} />
              </>
            )}
            {d.set === 'numbers' && (
              <>
                <div>
                  <Label>Numbers</Label>
                  <Segments
                    label="Which numbers"
                    value={d.range ?? '1-10'}
                    onChange={(v) => onUpdate({ range: v, skip: undefined })}
                    options={[
                      { v: '1-10', label: '1–10' },
                      { v: '0-10', label: '0–10' },
                      { v: '1-20', label: '1–20' },
                    ]}
                  />
                </div>
                <div>
                  <Label>Count with</Label>
                  <Segments
                    label="Count with"
                    value={d.countWith ?? 'pictures'}
                    onChange={(v) => onUpdate({ countWith: v })}
                    options={[
                      { v: 'pictures', label: 'Pictures' },
                      { v: 'dots', label: 'Ten-frame dots' },
                    ]}
                  />
                </div>
              </>
            )}
            {d.set === 'pictures' && (
              <div>
                <Label>Theme</Label>
                <select value={d.theme ?? 'animals'} onChange={(e) => onUpdate({ theme: e.target.value, skip: undefined })} className={field}>
                  {CARD_THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {d.set === 'feelings' && (
              <>
                <div>
                  <Label>Faces</Label>
                  <Segments
                    label="Faces"
                    value={d.faces ?? 'emoji'}
                    onChange={(v) => onUpdate({ faces: v, skip: undefined })}
                    options={[
                      { v: 'emoji', label: 'Emoji (17)' },
                      { v: 'kids', label: 'Children (9)' },
                    ]}
                  />
                </div>
                {d.faces === 'kids' && (
                  <div>
                    <Label>Child</Label>
                    <select value={d.child ?? 'mix'} onChange={(e) => onUpdate({ child: e.target.value })} className={field}>
                      <option value="mix">A mix of children</option>
                      {Object.entries(CHILD_NAMES)
                        .sort((a, b) => a[1].localeCompare(b[1]))
                        .map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <Toggle label="Show the words" checked={d.words !== false} onChange={(on) => onUpdate({ words: on })} />
          </div>

          {/* Order */}
          <div>
            <Label>Order</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ shuffle: undefined })}
                aria-pressed={!d.shuffle}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border ${!d.shuffle ? 'border-[#2D2200] bg-white text-[#2D2200]' : 'border-[#E2DEC9] bg-white text-[#6B5838] hover:border-[#2D2200]'}`}
              >
                In order
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ shuffle: 1 + Math.floor(Math.random() * 1e9) })}
                aria-pressed={!!d.shuffle}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg border ${d.shuffle ? 'border-[#2D2200] bg-white text-[#2D2200]' : 'border-[#E2DEC9] bg-white text-[#6B5838] hover:border-[#2D2200]'}`}
              >
                <Shuffle className="w-3.5 h-3.5" /> {d.shuffle ? 'Mix again' : 'Mixed up'}
              </button>
            </div>
          </div>

          {/* Which cards */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>
                Which cards ({cards.length - cards.filter((c) => skip.has(c.id)).length} of {cards.length})
              </Label>
              <div className="flex gap-2 text-[11px] font-bold">
                <button type="button" onClick={() => onUpdate({ skip: undefined })} className="text-[#009BD9] hover:underline">
                  All
                </button>
                <button type="button" onClick={() => onUpdate({ skip: cards.map((c) => c.id) })} className="text-[#009BD9] hover:underline">
                  None
                </button>
              </div>
            </div>
            <div className="bg-white border border-[#E2DEC9] rounded-xl divide-y divide-[#F2F2E2]">
              {cards.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-[#FAF8F0]">
                  <input type="checkbox" checked={!skip.has(c.id)} onChange={(e) => toggleCard(c.id, e.target.checked)} className="w-4 h-4 accent-[#009BD9]" />
                  <span className="text-sm font-semibold text-[#2D2200] capitalize">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
