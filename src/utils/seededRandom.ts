/**
 * @license
 * Sunshine Brigade Worksheet Builder - Seeded Random
 * Blocks that shuffle or scatter things (answer order, shape hunt, mazes, spot the difference)
 * use this instead of Math.random(), seeded from the block instance and its settings.
 * The same block always draws the same way, so the preview, the print and the PDF match,
 * and a shared link opens to exactly the same sheet.
 */

/** Turns any string into a 32-bit seed (FNV-1a). */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export interface SeededRandom {
  /** Float in [0, 1) */
  next: () => number;
  /** Integer in [min, max] inclusive */
  int: (min: number, max: number) => number;
  /** One item from a list */
  pick: <T>(items: readonly T[]) => T;
  /** A shuffled copy of a list */
  shuffle: <T>(items: readonly T[]) => T[];
}

/** Mulberry32: small, fast and good enough for layouts. */
export function createRandom(seed: string | number): SeededRandom {
  let state = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)];
  const shuffle = <T,>(items: readonly T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return { next, int, pick, shuffle };
}

/**
 * Seed for a block: its instance id plus its settings, so changing a setting
 * (or pressing "Shuffle", which bumps the `variant` setting) gives a new layout.
 */
export function blockSeed(instanceId: string, settings: Record<string, unknown>): string {
  return `${instanceId}|${JSON.stringify(settings)}`;
}
