/**
 * @license
 * Sunshine Brigade Worksheet Builder - Picture Library
 *
 * Artwork: the Krea reference set (version 0.5), stored as vector shapes in
 * pictureArt.ts. A picture with no drawing yet prints as the template-grid placeholder.
 * To change a picture, redraw it and re-export it under the same name; every block that
 * uses it updates.
 *
 * Ink Style rules followed here:
 * - White fills with fat ink outlines, so children can colour every picture in.
 * - Only the page inks: Ink #2D2200 and Paper #FFFFFF (Trace #B6B2A6 for "shadow" mode).
 */

import React from 'react';
import { PICTURE_LINE, PICTURE_SHAPES } from './pictureArt';
import { ArtPlaceholder } from './placeholder';

const INK = '#2D2200';
const PAPER = '#FFFFFF';
const TRACE = '#B6B2A6';

/** Colours and stroke a drawing should use, in its own 100 x 100 units. */
interface ArtStyle {
  F: string; // fill (paper areas)
  S: string; // ink (outlines and solid details)
  W: number; // thinnest allowed line, in the drawing's 100-unit box
}

type Art = (c: ArtStyle) => React.ReactNode;

/**
 * Builds a drawing from its Affinity shapes. The drawn lines already have their own
 * weight (PICTURE_LINE); when the page needs a heavier line than that, every shape gets
 * an ink stroke of the difference, which thickens each line evenly on both sides
 * (paper shapes give up half the stroke inward, ink shapes gain half outward).
 */
function fromShapes(name: string): Art {
  const { p, k } = PICTURE_SHAPES[name];
  const own = PICTURE_LINE[name] ?? 1.4;
  return (c) => {
    const extra = Math.max(0, c.W - own);
    const stroke = extra > 0 ? { stroke: c.S, strokeWidth: extra, strokeLinejoin: 'round' as const } : { stroke: 'none' };
    return (
      <>
        <path d={p} fill={c.F} fillRule="evenodd" {...stroke} />
        <path d={k} fill={c.S} fillRule="evenodd" {...stroke} />
      </>
    );
  };
}

/** Pictures known by an older name */
const ALIASES: Record<string, string> = { icecream: 'ice-cream' };

export const PICTURE_ART: Record<string, Art> = Object.fromEntries([
  ...Object.keys(PICTURE_SHAPES).map((name) => [name, fromShapes(name)]),
  ...Object.entries(ALIASES).map(([alias, name]) => [alias, fromShapes(name)]),
]);

/** True when a picture has its redrawn art (otherwise it prints as a placeholder). */
export const hasPictureArt = (name: string) => name in PICTURE_ART;

/** Name, label and first sound for each picture (used by the sound and rhyme blocks).
 *  An empty sound keeps a picture out of Beginning sounds (long vowels and blends confuse early phonics). */
export const PICTURES: Record<string, { label: string; sound: string }> = {
  acorn: { label: 'acorn', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  alligator: { label: 'alligator', sound: 'a' },
  ambulance: { label: 'ambulance', sound: 'a' },
  ant: { label: 'ant', sound: 'a' },
  apple: { label: 'apple', sound: 'a' },
  backpack: { label: 'backpack', sound: 'b' },
  ball: { label: 'ball', sound: 'b' },
  balloon: { label: 'balloon', sound: 'b' },
  banana: { label: 'banana', sound: 'b' },
  barn: { label: 'barn', sound: 'b' },
  bat: { label: 'bat', sound: 'b' },
  bathtub: { label: 'bathtub', sound: 'b' },
  bear: { label: 'bear', sound: 'b' },
  bed: { label: 'bed', sound: 'b' },
  bee: { label: 'bee', sound: 'b' },
  bell: { label: 'bell', sound: 'b' },
  bike: { label: 'bike', sound: 'b' },
  bird: { label: 'bird', sound: 'b' },
  boat: { label: 'boat', sound: 'b' },
  bone: { label: 'bone', sound: 'b' },
  book: { label: 'book', sound: 'b' },
  boots: { label: 'boots', sound: 'b' },
  bowl: { label: 'bowl', sound: 'b' },
  box: { label: 'box', sound: 'b' },
  bread: { label: 'bread', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  broccoli: { label: 'broccoli', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  bubbles: { label: 'bubbles', sound: 'b' },
  bug: { label: 'bug', sound: 'b' },
  bus: { label: 'bus', sound: 'b' },
  butterfly: { label: 'butterfly', sound: 'b' },
  cake: { label: 'cake', sound: 'c' },
  camel: { label: 'camel', sound: 'c' },
  car: { label: 'car', sound: 'c' },
  carrot: { label: 'carrot', sound: 'c' },
  cat: { label: 'cat', sound: 'c' },
  chair: { label: 'chair', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  cheese: { label: 'cheese', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  cherry: { label: 'cherry', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  chick: { label: 'chick', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  clock: { label: 'clock', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  cloud: { label: 'cloud', sound: '' }, // "cl" blend
  coat: { label: 'coat', sound: 'c' },
  cookie: { label: 'cookie', sound: 'c' },
  corn: { label: 'corn', sound: 'c' },
  cow: { label: 'cow', sound: 'c' },
  crab: { label: 'crab', sound: '' }, // "cr" blend
  cup: { label: 'cup', sound: 'c' },
  deer: { label: 'deer', sound: 'd' },
  digger: { label: 'digger', sound: 'd' },
  dish: { label: 'dish', sound: 'd' },
  dog: { label: 'dog', sound: 'd' },
  doll: { label: 'doll', sound: 'd' },
  dolphin: { label: 'dolphin', sound: 'd' },
  door: { label: 'door', sound: 'd' },
  dress: { label: 'dress', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  drum: { label: 'drum', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  duck: { label: 'duck', sound: 'd' },
  egg: { label: 'egg', sound: 'e' },
  elephant: { label: 'elephant', sound: 'e' },
  fan: { label: 'fan', sound: 'f' },
  fire: { label: 'fire', sound: 'f' },
  'fire-truck': { label: 'fire truck', sound: 'f' },
  fish: { label: 'fish', sound: 'f' },
  flower: { label: 'flower', sound: '' }, // "fl" blend
  fork: { label: 'fork', sound: 'f' },
  fox: { label: 'fox', sound: 'f' },
  frog: { label: 'frog', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  gift: { label: 'gift', sound: 'g' },
  giraffe: { label: 'giraffe', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  goat: { label: 'goat', sound: 'g' },
  grapes: { label: 'grapes', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  guitar: { label: 'guitar', sound: 'g' },
  hat: { label: 'hat', sound: 'h' },
  heart: { label: 'heart', sound: 'h' },
  hedgehog: { label: 'hedgehog', sound: 'h' },
  helicopter: { label: 'helicopter', sound: 'h' },
  hen: { label: 'hen', sound: 'h' },
  hippo: { label: 'hippo', sound: 'h' },
  horse: { label: 'horse', sound: 'h' },
  house: { label: 'house', sound: 'h' },
  'ice-cream': { label: 'ice cream', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  iguana: { label: 'iguana', sound: 'i' },
  jam: { label: 'jam', sound: 'j' },
  jar: { label: 'jar', sound: 'j' },
  jellyfish: { label: 'jellyfish', sound: 'j' },
  jet: { label: 'jet', sound: 'j' },
  kangaroo: { label: 'kangaroo', sound: 'k' },
  key: { label: 'key', sound: 'k' },
  kite: { label: 'kite', sound: 'k' },
  lamb: { label: 'lamb', sound: 'l' },
  lamp: { label: 'lamp', sound: 'l' },
  leaf: { label: 'leaf', sound: 'l' },
  lemon: { label: 'lemon', sound: 'l' },
  lion: { label: 'lion', sound: 'l' },
  log: { label: 'log', sound: 'l' },
  milk: { label: 'milk', sound: 'm' },
  mitten: { label: 'mitten', sound: 'm' },
  monkey: { label: 'monkey', sound: 'm' },
  moon: { label: 'moon', sound: 'm' },
  mountain: { label: 'mountain', sound: 'm' },
  mouse: { label: 'mouse', sound: 'm' },
  mug: { label: 'mug', sound: 'm' },
  nest: { label: 'nest', sound: 'n' },
  net: { label: 'net', sound: 'n' },
  nut: { label: 'nut', sound: 'n' },
  octopus: { label: 'octopus', sound: 'o' },
  orange: { label: 'orange', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  otter: { label: 'otter', sound: 'o' },
  owl: { label: 'owl', sound: '' }, // vowel blend: left out of beginning sounds
  paintbrush: { label: 'paintbrush', sound: 'p' },
  pan: { label: 'pan', sound: 'p' },
  panda: { label: 'panda', sound: 'p' },
  pants: { label: 'pants', sound: 'p' },
  parrot: { label: 'parrot', sound: 'p' },
  pear: { label: 'pear', sound: 'p' },
  peas: { label: 'peas', sound: 'p' },
  piano: { label: 'piano', sound: 'p' },
  pig: { label: 'pig', sound: 'p' },
  pizza: { label: 'pizza', sound: 'p' },
  plane: { label: 'plane', sound: '' }, // "pl" blend
  'polar-bear': { label: 'polar bear', sound: 'p' },
  'police-car': { label: 'police car', sound: 'p' },
  potato: { label: 'potato', sound: 'p' },
  puddle: { label: 'puddle', sound: 'p' },
  pumpkin: { label: 'pumpkin', sound: 'p' },
  puzzle: { label: 'puzzle', sound: 'p' },
  quilt: { label: 'quilt', sound: 'q' },
  rabbit: { label: 'rabbit', sound: 'r' },
  'rain-cloud': { label: 'rain cloud', sound: 'r' },
  rainbow: { label: 'rainbow', sound: 'r' },
  rock: { label: 'rock', sound: 'r' },
  rocket: { label: 'rocket', sound: 'r' },
  'sand-pail': { label: 'sand pail', sound: 's' },
  sandcastle: { label: 'sandcastle', sound: 's' },
  sandwich: { label: 'sandwich', sound: 's' },
  scooter: { label: 'scooter', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  seal: { label: 'seal', sound: 's' },
  shark: { label: 'shark', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  sheep: { label: 'sheep', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  shell: { label: 'shell', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  shirt: { label: 'shirt', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  shoes: { label: 'shoes', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  slide: { label: 'slide', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  snail: { label: 'snail', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  snake: { label: 'snake', sound: '' }, // "sn" blend
  snowflake: { label: 'snowflake', sound: '' }, // "sn" blend
  snowman: { label: 'snowman', sound: '' }, // "sn" blend
  soap: { label: 'soap', sound: 's' },
  sock: { label: 'sock', sound: 's' },
  spider: { label: 'spider', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  spoon: { label: 'spoon', sound: '' }, // "sp" blend
  sprout: { label: 'sprout', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  squirrel: { label: 'squirrel', sound: 's' },
  star: { label: 'star', sound: '' }, // "st" blend
  starfish: { label: 'starfish', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  strawberry: { label: 'strawberry', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  sun: { label: 'sun', sound: 's' },
  sunflower: { label: 'sunflower', sound: 's' },
  sunglasses: { label: 'sunglasses', sound: 's' },
  swimsuit: { label: 'swimsuit', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  swing: { label: 'swing', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  table: { label: 'table', sound: 't' },
  'teddy-bear': { label: 'teddy bear', sound: 't' },
  tent: { label: 'tent', sound: 't' },
  tiger: { label: 'tiger', sound: 't' },
  tomato: { label: 'tomato', sound: 't' },
  toothbrush: { label: 'toothbrush', sound: 't' },
  towel: { label: 'towel', sound: 't' },
  tractor: { label: 'tractor', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  train: { label: 'train', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  tree: { label: 'tree', sound: '' }, // "tr" blend
  truck: { label: 'truck', sound: '' }, // blend, digraph or vowel that isn't short: left out of Beginning sounds
  turtle: { label: 'turtle', sound: 't' },
  van: { label: 'van', sound: 'v' },
  vase: { label: 'vase', sound: 'v' },
  violin: { label: 'violin', sound: 'v' },
  watermelon: { label: 'watermelon', sound: 'w' },
  waves: { label: 'waves', sound: 'w' },
  web: { label: 'web', sound: 'w' },
  whale: { label: 'whale', sound: 'w' },
  window: { label: 'window', sound: 'w' },
  worm: { label: 'worm', sound: 'w' },
  yak: { label: 'yak', sound: 'y' },
  yarn: { label: 'yarn', sound: 'y' },
  'yo-yo': { label: 'yo yo', sound: 'y' },
  zebra: { label: 'zebra', sound: 'z' },
  icecream: { label: 'ice cream', sound: '' }, // older name for ice-cream, kept so saved worksheets still open
};

export type PictureName = keyof typeof PICTURES;
export const PICTURE_NAMES = Object.keys(PICTURES) as PictureName[];

interface PictureProps {
  name: string;
  /** Centre of the picture in the parent's units */
  cx: number;
  cy: number;
  /** Width and height of the square the picture fits in */
  size: number;
  /** "line": white fill to colour in. "shadow": solid Trace colour silhouette (cut and glue targets). */
  mode?: 'line' | 'shadow';
  /** Mirror left to right */
  flip?: boolean;
}

/** Thinnest line a picture may print with (the Ink Style minimum). */
const MIN_LINE_PT = 1.5;

/**
 * Draws one picture from the library. Lines print as drawn, except that at small sizes
 * they are thickened evenly so none drops below the 1.5pt Ink Style minimum (a heavier
 * target clogs the detailed drawings, like the nest and the dish).
 */
export const Picture: React.FC<PictureProps> = ({ name, cx, cy, size, mode = 'line', flip = false }) => {
  const art = PICTURE_ART[name];
  const scale = size / 100;
  if (!art) {
    if (!(name in PICTURES)) return null;
    return (
      <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})`}>
        <ArtPlaceholder label={PICTURES[name].label} line={0.75 / scale} />
      </g>
    );
  }
  const minLine = MIN_LINE_PT / scale;
  const style: ArtStyle =
    mode === 'shadow'
      ? { F: TRACE, S: TRACE, W: minLine }
      : { F: PAPER, S: INK, W: minLine };
  const flipTransform = flip ? ' translate(100 0) scale(-1 1)' : '';
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})${flipTransform}`}>
      {art(style)}
    </g>
  );
};
