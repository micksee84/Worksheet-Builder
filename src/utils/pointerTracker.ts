/**
 * @license
 * Sunshine Brigade Worksheet Builder - Pointer tracker
 *
 * Where the pointer is right now, in screen coordinates. Drags work out drop points from
 * this rather than from dnd-kit's start point plus delta: the sensors only start a drag
 * after the pointer has moved a little, so start + delta can be off by that much, and on
 * a planner's small cards that is enough to land on the wrong card.
 */

let last: { x: number; y: number } | null = null;

if (typeof window !== 'undefined') {
  const track = (e: PointerEvent | TouchEvent) => {
    const pt = 'touches' in e ? e.touches[0] ?? e.changedTouches[0] : e;
    if (pt) last = { x: pt.clientX, y: pt.clientY };
  };
  window.addEventListener('pointermove', track, { capture: true, passive: true });
  window.addEventListener('pointerdown', track, { capture: true, passive: true });
  window.addEventListener('touchmove', track, { capture: true, passive: true });
}

/** The pointer's last known screen position, or null before it has moved */
export const pointerNow = () => last;
