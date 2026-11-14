/**
 * @license
 * Sunshine Brigade Worksheet Builder - Flash cards
 *
 * A flash card page shows part of a deck: a set of cards (letters, numbers, picture words,
 * feelings or shapes) built from the builder's own art. Each card has a front (the picture,
 * letter or things to count) and a back (the word or answer). One-sided cards put both on
 * one face; fold-over cards print the back beside the front, to fold down the middle.
 *
 * Cards touch, so one dashed line cuts between two neighbours. Pages made from one deck
 * share its id: changing a setting on one changes them all.
 */

import { CardDeck, CardSet, Page, PageSizeId } from '../types';
import { DRAWN, labelOf, picturesIn, THEMES } from '../blocks/pictureLibrary';
import { PICTURES } from '../blocks/pictures';
import { CHILDREN, faceId, Feeling } from '../blocks/FeelingsBlock';
import { createRandom } from '../utils/seededRandom';
import { pageDims } from '../config/appConfig';
import { pageLayout } from '../utils/spacing';

/** What a card shows on one face */
export interface CardFace {
  /** Big text: a letter ("Aa") or a numeral */
  big?: string;
  /** A picture library name, or hand art ("hand:feeling-happy") */
  picture?: string;
  /** Things to count: how many, drawn with this hand art ("count-apple") or as dots */
  count?: { n: number; art: string | 'dots' };
  /** The word */
  word?: string;
}

export interface FlashCard {
  id: string;
  /** What the card is called in the card list */
  name: string;
  front: CardFace;
  back: CardFace;
}

export const SET_INFO: Record<CardSet, { label: string; blurb: string; title: string }> = {
  letters: { label: 'Letters', blurb: 'A to Z, each with a picture that starts with it', title: 'Letters' },
  numbers: { label: 'Numbers', blurb: 'Numerals with things to count', title: 'Numbers' },
  pictures: { label: 'Picture words', blurb: 'A picture and its word, by theme', title: 'Picture words' },
  feelings: { label: 'Feelings', blurb: 'Faces to name how we feel', title: 'Feelings' },
  shapes: { label: 'Shapes', blurb: 'Circle, square, triangle, star, heart', title: 'Shapes' },
};

export const CARD_SETS = Object.keys(SET_INFO) as CardSet[];

/** The picture for each letter: one children know, that starts with the letter's sound */
const LETTER_PICTURE: Record<string, string> = {
  a: 'apple', b: 'ball', c: 'cat', d: 'dog', e: 'egg', f: 'fish', g: 'goat', h: 'hat', i: 'iguana', j: 'jam',
  k: 'kite', l: 'lion', m: 'moon', n: 'nest', o: 'octopus', p: 'panda', q: 'quilt', r: 'rocket', s: 'sun',
  t: 'turtle', v: 'van', w: 'whale', y: 'yo-yo',
};

/** A drawn picture for a letter, or none yet (u, x and z have no art) */
function letterPicture(l: string): string | undefined {
  const pick = LETTER_PICTURE[l];
  if (pick && DRAWN.includes(pick)) return pick;
  return DRAWN.find((n) => PICTURES[n]?.sound === l);
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const COUNT_ART = ['count-apple', 'count-star', 'count-balloon', 'count-flower', 'count-heart'];

const EMOJI_FEELINGS: Feeling[] = ['happy', 'sad', 'angry', 'scared', 'surprised', 'calm', 'excited', 'worried', 'shy', 'tired', 'silly', 'yucky', 'loving', 'proud', 'bored', 'confused', 'grumpy'];
const KID_FEELINGS: Feeling[] = ['happy', 'angry', 'calm', 'excited', 'proud', 'loving', 'bored', 'confused', 'grumpy'];

/** The picture-word themes: every picture theme, plus all the animals */
export const CARD_THEMES = [{ value: 'animals', label: 'Animals (all)' }, ...THEMES];

/** Every card in a deck's set, in order, before skipping and shuffling */
export function allCards(d: CardDeck): FlashCard[] {
  switch (d.set) {
    case 'letters': {
      const pics = d.letterPictures !== false;
      return 'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => {
        const big = d.letterCase === 'upper' ? l.toUpperCase() : d.letterCase === 'lower' ? l : l.toUpperCase() + l;
        const pic = pics ? letterPicture(l) : undefined;
        return {
          id: l,
          name: `${l.toUpperCase()}${pic ? ` · ${labelOf(pic)}` : ''}`,
          front: { big },
          back: pic ? { picture: pic, word: labelOf(pic) } : { big },
        };
      });
    }
    case 'numbers': {
      const [lo, hi] = d.range === '0-10' ? [0, 10] : d.range === '1-20' ? [1, 20] : [1, 10];
      return Array.from({ length: hi - lo + 1 }, (_, i) => {
        const n = lo + i;
        const art = d.countWith === 'dots' ? 'dots' : COUNT_ART[n % COUNT_ART.length];
        return {
          id: `n${n}`,
          name: `${n} · ${NUMBER_WORDS[n]}`,
          front: { count: { n, art } },
          back: { big: String(n), word: NUMBER_WORDS[n] },
        };
      });
    }
    case 'pictures': {
      const theme = d.theme ?? 'animals';
      const names = theme === 'animals' ? picturesIn('mixed', (t) => t.k === 'animal') : picturesIn(theme);
      return names.map((n) => ({ id: n, name: labelOf(n), front: { picture: n }, back: { word: labelOf(n) } }));
    }
    case 'feelings': {
      const kids = d.faces === 'kids';
      const list = kids ? KID_FEELINGS : EMOJI_FEELINGS;
      return list.map((f, i) => ({
        id: f,
        name: f,
        front: { picture: `hand:${faceId(f, kids ? 'kids' : 'emoji', d.child ?? 'mix', i)}` },
        back: { word: f },
      }));
    }
    case 'shapes':
      return ['circle', 'square', 'triangle', 'star', 'heart'].map((s) => ({
        id: s,
        name: s,
        front: { picture: `hand:shape-${s}` },
        back: { word: s },
      }));
  }
}

/** The deck's cards in print order: unticked ones left out, shuffled if asked */
export function deckCards(d: CardDeck): FlashCard[] {
  const skip = new Set(d.skip ?? []);
  const cards = allCards(d).filter((c) => !skip.has(c.id));
  if (!d.shuffle) return cards;
  const rand = createRandom(d.shuffle);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand.next() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** How many cards fit on one page */
export const cardsPerPage = (d: CardDeck) => (d.print === 'fold' ? FOLD_ROWS[d.perPage] : d.perPage);
const FOLD_ROWS: Record<CardDeck['perPage'], number> = { 4: 2, 6: 3, 9: 4 };
const GRID: Record<CardDeck['perPage'], [number, number]> = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };

export interface Box { x: number; y: number; w: number; h: number }
export interface CardSlot {
  front: Box;
  /** Fold-over: the back, to the right of the front; the fold is the line between them */
  back?: Box;
}

export interface CardSheet {
  area: Box;
  slots: CardSlot[];
  /** Dashed lines to cut along: the outline and the lines between cards */
  cuts: { x1: number; y1: number; x2: number; y2: number }[];
  /** Fold-over: the fold down the middle of each card */
  folds: { x1: number; y1: number; x2: number; y2: number }[];
}

/** Where the cards go on a page: they fill the area under the title, touching */
export function cardSheet(pageSize: PageSizeId, page: Pick<Page, 'showDateName' | 'cards'>): CardSheet {
  const d = page.cards!;
  const dims = pageDims(pageSize);
  const L = pageLayout(pageSize, false, dims);
  const area = { x: L.left, y: L.contentTop, w: L.right - L.left, h: L.contentBottom - L.contentTop };
  const cuts: CardSheet['cuts'] = [];
  const folds: CardSheet['folds'] = [];
  const slots: CardSlot[] = [];
  const { x, y, w, h } = area;
  if (d.print === 'fold') {
    // Rows of front | back, each pair one card folded down the middle
    const rows = FOLD_ROWS[d.perPage];
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      slots.push({ front: { x, y: y + r * rh, w: w / 2, h: rh }, back: { x: x + w / 2, y: y + r * rh, w: w / 2, h: rh } });
      folds.push({ x1: x + w / 2, y1: y + r * rh, x2: x + w / 2, y2: y + (r + 1) * rh });
    }
    for (let r = 0; r <= rows; r++) cuts.push({ x1: x, y1: y + r * rh, x2: x + w, y2: y + r * rh });
    cuts.push({ x1: x, y1: y, x2: x, y2: y + h }, { x1: x + w, y1: y, x2: x + w, y2: y + h });
  } else {
    const [cols, rows] = GRID[d.perPage];
    const cw = w / cols;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push({ front: { x: x + c * cw, y: y + r * rh, w: cw, h: rh } });
    for (let r = 0; r <= rows; r++) cuts.push({ x1: x, y1: y + r * rh, x2: x + w, y2: y + r * rh });
    for (let c = 0; c <= cols; c++) cuts.push({ x1: x + c * cw, y1: y, x2: x + c * cw, y2: y + h });
  }
  return { area, slots, cuts, folds };
}

/** The cards one page shows */
export function pageCards(d: CardDeck): FlashCard[] {
  return deckCards(d).slice(d.from, d.from + cardsPerPage(d));
}

let deckCounter = 0;
export const newDeckId = () => `deck_${Date.now().toString(36)}_${(deckCounter++).toString(36)}`;

/** A new deck: letters, fold-over, 6 a page */
export function newDeck(set: CardSet = 'letters'): CardDeck {
  return { id: newDeckId(), set, perPage: 6, print: 'fold', from: 0, words: true, letterCase: 'both', letterPictures: true, range: '1-10', countWith: 'pictures', theme: 'animals', faces: 'emoji', child: 'mix' };
}

/** A new flash card page */
export function createCardPage(pageNumber: number, deck: CardDeck = newDeck()): Page {
  return {
    id: `page_${Date.now()}_${pageNumber}`,
    title: SET_INFO[deck.set].title,
    layout: '1-full',
    slots: [],
    showDateName: false,
    cards: deck,
  };
}

/** Which set a picture theme value names, for the panel */
export const themeLabel = (v: string) => CARD_THEMES.find((t) => t.value === v)?.label ?? v;

/** The children, for "one child or a mix" */
export const CARD_CHILDREN = CHILDREN;
