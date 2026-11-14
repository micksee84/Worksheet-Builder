/**
 * @license
 * Sunshine Brigade Worksheet Builder - Picture library helpers
 *
 * How blocks choose pictures: by theme, kind, size or sound, from pictures that have
 * their redrawn art (placeholders are never picked at random), never putting two
 * look-alike shadows side by side.
 */

import type { SettingsFieldSchema } from '../types';
import type { SeededRandom } from '../utils/seededRandom';
import { hasPictureArt, PICTURES } from './pictures';
import { LOOKALIKES, PICTURE_TAGS, PictureTag, PictureTheme, RHYME_FAMILIES, TRIPS } from './pictureTags';

/** Every picture with its redrawn art and tags */
export const DRAWN: string[] = Object.keys(PICTURE_TAGS).filter(hasPictureArt);

export const tagOf = (name: string): PictureTag | undefined => PICTURE_TAGS[name];
export const labelOf = (name: string) => PICTURES[name]?.label ?? name.replace(/-/g, ' ');

export const THEMES: { value: PictureTheme; label: string }[] = [
  { value: 'farm', label: 'On the farm' },
  { value: 'wild', label: 'Wild animals' },
  { value: 'woodland', label: 'Pets and woodland' },
  { value: 'ocean', label: 'In the ocean' },
  { value: 'garden', label: 'Garden, nature and weather' },
  { value: 'food', label: 'Food' },
  { value: 'home', label: 'At home' },
  { value: 'clothes', label: 'Clothes' },
  { value: 'toys', label: 'Toys, music and play' },
  { value: 'go', label: 'Things that go' },
  { value: 'winter', label: 'Winter' },
  { value: 'christmas', label: 'Christmas' },
];

/** The shared "Pictures" setting: a theme, or everything mixed */
export const themeSetting = (key = 'pictureTheme', label = 'Pictures'): SettingsFieldSchema => ({
  key,
  label,
  type: 'select',
  options: [{ label: 'Mixed (all themes)', value: 'mixed' }, ...THEMES.map((t) => ({ label: t.label, value: t.value }))],
});

/** Drawn pictures in a theme ("mixed" or unknown = all of them), optionally filtered */
export function picturesIn(theme: string | undefined, filter?: (tag: PictureTag, name: string) => boolean): string[] {
  const all = THEMES.some((t) => t.value === theme);
  return DRAWN.filter((n) => {
    const tag = PICTURE_TAGS[n];
    return (!all || tag.t === theme) && (!filter || filter(tag, n));
  });
}

const LOOK = new Set(LOOKALIKES.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
/** True when two pictures' shadows are too alike to tell apart */
export const tooAlike = (a: string, b: string) => LOOK.has(`${a}|${b}`);

/**
 * Up to `count` pictures from a pool, in random order, none of them look-alikes
 * of each other (or of anything in `avoid`).
 */
export function pickDistinct(rand: SeededRandom, pool: readonly string[], count: number, avoid: readonly string[] = []): string[] {
  const out: string[] = [];
  for (const name of rand.shuffle(pool)) {
    if (out.length >= count) break;
    if ([...out, ...avoid].some((o) => o === name || tooAlike(o, name))) continue;
    out.push(name);
  }
  return out;
}

/** Rhyming pairs where both pictures are drawn */
export function rhymePairs(): [string, string][] {
  const pairs: [string, string][] = [];
  for (const fam of RHYME_FAMILIES) {
    const drawn = fam.filter(hasPictureArt);
    for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) pairs.push([drawn[i], drawn[j]]);
  }
  return pairs;
}

/** Index of a picture's rhyme family, or -1 */
export const rhymeFamily = (name: string) => RHYME_FAMILIES.findIndex((f) => f.includes(name));

/** Who goes where, keyed "traveller-goal" (plus older keys saved worksheets use) */
export const TRIP_PAIRS: Record<string, [string, string]> = Object.fromEntries([
  ...TRIPS.filter(([a, b]) => hasPictureArt(a) && hasPictureArt(b)).map(([a, b]) => [`${a}-${b}`, [a, b] as [string, string]]),
  ['boat-fish', ['fish', 'boat'] as [string, string]],
]);
export const TRIP_KEYS = Object.keys(TRIP_PAIRS);

/** "Who goes where" menu entries, like "Rabbit to carrot" */
export const tripOptions = () =>
  TRIP_KEYS.map((key) => {
    const [a, b] = TRIP_PAIRS[key];
    const name = labelOf(a);
    return { label: `${name[0].toUpperCase()}${name.slice(1)} to ${labelOf(b)}`, value: key };
  });
