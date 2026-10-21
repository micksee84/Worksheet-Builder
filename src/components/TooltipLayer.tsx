/**
 * @license
 * Sunshine Brigade Worksheet Builder - Tooltips
 *
 * One tooltip for the whole app. Any control with a `title` (or `data-tip`) gets a branded tooltip on
 * hover and on keyboard focus. The native `title` is moved to `data-tip` the first time the control is
 * hovered, so the browser's own grey tooltip never doubles up with ours.
 */

import React, { useEffect, useRef, useState } from 'react';

const SHOW_DELAY = 350; // ms before the first tooltip appears
const WARM_WINDOW = 600; // ms after one hides during which the next appears straight away
const GAP = 8;
const EDGE = 8;

type Tip = { text: string; x: number; y: number; place: 'below' | 'above' };

const findTarget = (el: EventTarget | null): HTMLElement | null => {
  const node = (el as HTMLElement | null)?.closest?.('[title], [data-tip]') as HTMLElement | null;
  if (!node) return null;
  // Leave text fields alone: their title is a hint, and a tooltip over the caret gets in the way.
  if (node.matches('input, textarea, select')) return null;
  const title = node.getAttribute('title');
  if (title) {
    node.setAttribute('data-tip', title);
    node.removeAttribute('title');
    if (!node.getAttribute('aria-label') && !node.textContent?.trim()) node.setAttribute('aria-label', title);
  }
  return node.getAttribute('data-tip') ? node : null;
};

export const TooltipLayer: React.FC = () => {
  const [tip, setTip] = useState<Tip | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastHidden = useRef(0);

  useEffect(() => {
    const place = (node: HTMLElement): Tip | null => {
      const text = node.getAttribute('data-tip');
      if (!text) return null;
      const r = node.getBoundingClientRect();
      const below = r.bottom + GAP + 40 < window.innerHeight;
      return { text, x: r.left + r.width / 2, y: below ? r.bottom + GAP : r.top - GAP, place: below ? 'below' : 'above' };
    };

    const show = (node: HTMLElement) => {
      window.clearTimeout(timer.current);
      target.current = node;
      const warm = Date.now() - lastHidden.current < WARM_WINDOW;
      timer.current = window.setTimeout(() => {
        if (target.current === node && node.isConnected) setTip(place(node));
      }, warm ? 0 : SHOW_DELAY);
    };

    const hide = () => {
      window.clearTimeout(timer.current);
      if (target.current) lastHidden.current = Date.now();
      target.current = null;
      setTip(null);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const node = findTarget(e.target);
      if (node === target.current) return;
      if (node) show(node);
      else hide();
    };
    const onOut = (e: PointerEvent) => {
      if (!target.current) return;
      const to = e.relatedTarget as Node | null;
      if (to && target.current.contains(to)) return;
      hide();
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      // Only for keyboard focus, so a click doesn't leave a tooltip hanging.
      if (!el?.matches?.(':focus-visible')) return;
      const node = findTarget(el);
      if (node) show(node);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  // Keep the tooltip inside the window horizontally once its width is known.
  const [shift, setShift] = useState(0);
  useEffect(() => {
    if (!tip || !tipRef.current) return setShift(0);
    const w = tipRef.current.offsetWidth;
    const left = tip.x - w / 2;
    const right = tip.x + w / 2;
    setShift(left < EDGE ? EDGE - left : right > window.innerWidth - EDGE ? window.innerWidth - EDGE - right : 0);
  }, [tip]);

  if (!tip) return null;
  return (
    <div
      ref={tipRef}
      role="tooltip"
      className="fixed z-[1000] pointer-events-none w-max max-w-[260px] px-2.5 py-1.5 rounded-lg bg-[#2D2200] text-white text-[12px] leading-snug font-bold shadow-[2px_2px_0_rgba(45,34,0,0.25)]"
      style={{
        left: tip.x + shift,
        top: tip.y,
        transform: `translate(-50%, ${tip.place === 'below' ? '0' : '-100%'})`,
      }}
    >
      {tip.text}
      <span
        className="absolute left-1/2 w-2 h-2 bg-[#2D2200] rotate-45"
        style={{
          marginLeft: -4 - shift,
          [tip.place === 'below' ? 'top' : 'bottom']: -4,
        }}
      />
    </div>
  );
};
