/**
 * @license
 * Sunshine Brigade Worksheet Builder - Picture Library
 *
 * PLACEHOLDER ART. These simple ink line drawings were made by Claude so the picture
 * blocks work today. Final art is hand-drawn by the Sunshine Brigade team: replace any
 * entry in PICTURE_ART below (same name, same 100 x 100 box) and every block that uses
 * it updates.
 *
 * Ink Style rules followed here:
 * - White fills with fat ink outlines, so children can colour every picture in.
 * - Only the page inks: Ink #2D2200 and Paper #FFFFFF (Trace #B6B2A6 for "shadow" mode).
 */

import React from 'react';

const INK = '#2D2200';
const PAPER = '#FFFFFF';
const TRACE = '#B6B2A6';

/** Colours and stroke a drawing should use, in its own 100 x 100 units. */
interface ArtStyle {
  F: string; // fill
  S: string; // outline
  D: string; // solid details (eyes, spots)
  W: number; // outline width
}

type Art = (c: ArtStyle) => React.ReactNode;

// Shorthand prop builders
const shape = (c: ArtStyle) => ({
  fill: c.F,
  stroke: c.S,
  strokeWidth: c.W,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});
const line = (c: ArtStyle, w = 1) => ({
  fill: 'none',
  stroke: c.S,
  strokeWidth: c.W * w,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});
const dot = (c: ArtStyle) => ({ fill: c.D, stroke: 'none' });

function starPoints(cx: number, cy: number, r: number, inner = 0.45): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * inner;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export const PICTURE_ART: Record<string, Art> = {
  apple: (c) => (
    <>
      <path d="M50 30 C30 16 8 30 14 58 C19 82 36 92 50 85 C64 92 81 82 86 58 C92 30 70 16 50 30 Z" {...shape(c)} />
      <path d="M50 30 Q51 18 58 10" {...line(c)} />
      <path d="M56 20 Q68 10 78 16 Q68 26 56 20 Z" {...shape(c)} />
    </>
  ),
  ball: (c) => (
    <>
      <circle cx="50" cy="52" r="36" {...shape(c)} />
      <path d="M15 46 Q50 30 85 46" {...line(c)} />
      <path d="M17 64 Q50 80 83 64" {...line(c)} />
      <path d="M50 16 Q36 52 50 88" {...line(c)} />
    </>
  ),
  cat: (c) => (
    <>
      <path d="M24 44 L26 14 L44 30 Z" {...shape(c)} />
      <path d="M76 44 L74 14 L56 30 Z" {...shape(c)} />
      <circle cx="50" cy="58" r="30" {...shape(c)} />
      <circle cx="39" cy="54" r="3.5" {...dot(c)} />
      <circle cx="61" cy="54" r="3.5" {...dot(c)} />
      <path d="M46 64 L54 64 L50 69 Z" {...dot(c)} />
      <path d="M50 69 Q44 76 38 72 M50 69 Q56 76 62 72" {...line(c, 0.7)} />
      <path d="M30 64 L12 60 M30 68 L12 70 M70 64 L88 60 M70 68 L88 70" {...line(c, 0.6)} />
    </>
  ),
  dog: (c) => (
    <>
      <circle cx="50" cy="54" r="28" {...shape(c)} />
      <path d="M26 36 Q10 40 14 66 Q24 70 28 56 Z" {...shape(c)} />
      <path d="M74 36 Q90 40 86 66 Q76 70 72 56 Z" {...shape(c)} />
      <circle cx="40" cy="50" r="3.5" {...dot(c)} />
      <circle cx="60" cy="50" r="3.5" {...dot(c)} />
      <ellipse cx="50" cy="62" rx="7" ry="5" {...dot(c)} />
      <path d="M50 67 Q44 76 38 72 M50 67 Q56 76 62 72" {...line(c, 0.7)} />
    </>
  ),
  egg: (c) => <path d="M50 12 C30 12 18 44 18 62 C18 80 32 90 50 90 C68 90 82 80 82 62 C82 44 70 12 50 12 Z" {...shape(c)} />,
  fish: (c) => (
    <>
      <path d="M72 50 L92 32 L90 68 Z" {...shape(c)} />
      <ellipse cx="44" cy="50" rx="32" ry="20" {...shape(c)} />
      <circle cx="28" cy="46" r="3.5" {...dot(c)} />
      <path d="M48 36 Q56 50 48 64" {...line(c, 0.7)} />
    </>
  ),
  hat: (c) => (
    <>
      <path d="M30 72 L33 30 Q50 22 67 30 L70 72 Z" {...shape(c)} />
      <ellipse cx="50" cy="74" rx="40" ry="9" {...shape(c)} />
      <path d="M31 60 Q50 66 69 60" {...line(c)} />
    </>
  ),
  kite: (c) => (
    <>
      <path d="M50 70 Q38 80 48 86 Q58 92 46 98" {...line(c)} />
      <path d="M50 8 L78 38 L50 70 L22 38 Z" {...shape(c)} />
      <path d="M50 8 L50 70 M22 38 L78 38" {...line(c, 0.8)} />
    </>
  ),
  leaf: (c) => (
    <>
      <path d="M18 82 C16 42 46 16 86 14 C86 52 60 82 18 82 Z" {...shape(c)} />
      <path d="M18 82 L68 32 M38 62 L36 44 M50 50 L64 52" {...line(c, 0.7)} />
    </>
  ),
  moon: (c) => <path d="M58 12 A38 38 0 1 0 88 68 A30 30 0 1 1 58 12 Z" {...shape(c)} />,
  nest: (c) => (
    <>
      <ellipse cx="38" cy="46" rx="11" ry="14" {...shape(c)} />
      <ellipse cx="62" cy="46" rx="11" ry="14" {...shape(c)} />
      <path d="M12 52 Q50 96 88 52 Z" {...shape(c)} />
      <path d="M22 62 Q50 72 78 62 M30 72 Q50 80 70 72" {...line(c, 0.7)} />
    </>
  ),
  pig: (c) => (
    <>
      <path d="M26 34 L22 14 L40 26 Z" {...shape(c)} />
      <path d="M74 34 L78 14 L60 26 Z" {...shape(c)} />
      <circle cx="50" cy="54" r="32" {...shape(c)} />
      <ellipse cx="50" cy="64" rx="13" ry="9" {...shape(c)} />
      <circle cx="45" cy="64" r="2.5" {...dot(c)} />
      <circle cx="55" cy="64" r="2.5" {...dot(c)} />
      <circle cx="38" cy="46" r="3.5" {...dot(c)} />
      <circle cx="62" cy="46" r="3.5" {...dot(c)} />
    </>
  ),
  sun: (c) => (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={50 + Math.cos(a) * 30}
            y1={50 + Math.sin(a) * 30}
            x2={50 + Math.cos(a) * 44}
            y2={50 + Math.sin(a) * 44}
            {...line(c)}
          />
        );
      })}
      <circle cx="50" cy="50" r="22" {...shape(c)} />
    </>
  ),
  tree: (c) => (
    <>
      <path d="M42 90 L44 58 L56 58 L58 90 Z" {...shape(c)} />
      <path d="M50 10 C70 10 82 24 78 38 C90 44 88 64 72 66 L28 66 C12 64 10 44 22 38 C18 24 30 10 50 10 Z" {...shape(c)} />
    </>
  ),
  van: (c) => (
    <>
      <path d="M10 70 L10 34 Q10 26 18 26 L70 26 Q78 26 82 34 L90 50 L90 70 Z" {...shape(c)} />
      <path d="M62 32 L74 32 L82 48 L62 48 Z" {...shape(c)} />
      <rect x="18" y="32" width="36" height="16" rx="3" {...shape(c)} />
      <circle cx="30" cy="72" r="10" {...shape(c)} />
      <circle cx="70" cy="72" r="10" {...shape(c)} />
    </>
  ),
  web: (c) => (
    <>
      {[0, 45, 90, 135].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line key={deg} x1={50 - Math.cos(a) * 42} y1={50 - Math.sin(a) * 42} x2={50 + Math.cos(a) * 42} y2={50 + Math.sin(a) * 42} {...line(c, 0.8)} />
        );
      })}
      {[14, 26, 38].map((r) => (
        <polygon
          key={r}
          points={[0, 45, 90, 135, 180, 225, 270, 315]
            .map((deg) => {
              const a = (deg * Math.PI) / 180;
              return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
            })
            .join(' ')}
          {...line(c, 0.8)}
        />
      ))}
    </>
  ),
  bee: (c) => (
    <>
      <ellipse cx="40" cy="34" rx="12" ry="16" {...shape(c)} transform="rotate(-20 40 34)" />
      <ellipse cx="60" cy="34" rx="12" ry="16" {...shape(c)} transform="rotate(20 60 34)" />
      <ellipse cx="50" cy="60" rx="30" ry="20" {...shape(c)} />
      <path d="M44 41 L44 79 M58 41 L58 79" {...line(c, 1.4)} />
      <circle cx="28" cy="56" r="3" {...dot(c)} />
      <path d="M80 60 L90 60" {...line(c)} />
    </>
  ),
  car: (c) => (
    <>
      <path d="M8 66 L8 52 Q8 46 16 44 L28 42 L38 28 Q40 26 46 26 L64 26 Q70 26 72 30 L80 42 L88 46 Q92 48 92 54 L92 66 Z" {...shape(c)} />
      <path d="M40 42 L46 32 L56 32 L56 42 Z M62 42 L62 32 L68 32 L74 42 Z" {...shape(c)} />
      <circle cx="28" cy="68" r="10" {...shape(c)} />
      <circle cx="72" cy="68" r="10" {...shape(c)} />
    </>
  ),
  star: (c) => <polygon points={starPoints(50, 54, 42)} {...shape(c)} />,
  spoon: (c) => (
    <>
      <path d="M46 46 L44 92 Q50 96 56 92 L54 46 Z" {...shape(c)} />
      <ellipse cx="50" cy="28" rx="16" ry="22" {...shape(c)} />
    </>
  ),
  log: (c) => (
    <>
      <path d="M18 34 L80 34 L80 70 L18 70 Q10 52 18 34 Z" {...shape(c)} />
      <ellipse cx="80" cy="52" rx="10" ry="18" {...shape(c)} />
      <ellipse cx="80" cy="52" rx="4" ry="8" {...line(c, 0.7)} />
      <path d="M28 44 L56 44 M36 60 L66 60" {...line(c, 0.7)} />
    </>
  ),
  bug: (c) => (
    <>
      <path d="M34 34 Q50 16 66 34 Z" {...shape(c)} />
      <path d="M38 22 L30 10 M62 22 L70 10" {...line(c, 0.8)} />
      <circle cx="50" cy="60" r="30" {...shape(c)} />
      <path d="M50 30 L50 90" {...line(c)} />
      <circle cx="36" cy="52" r="5" {...dot(c)} />
      <circle cx="64" cy="52" r="5" {...dot(c)} />
      <circle cx="38" cy="72" r="4" {...dot(c)} />
      <circle cx="62" cy="72" r="4" {...dot(c)} />
    </>
  ),
  mug: (c) => (
    <>
      <path d="M68 42 Q88 42 88 56 Q88 70 68 70" {...line(c, 1.6)} />
      <path d="M22 30 L70 30 L66 84 Q46 90 26 84 Z" {...shape(c)} />
      <path d="M36 22 Q32 16 36 10 M48 22 Q44 16 48 10 M60 22 Q56 16 60 10" {...line(c, 0.8)} />
    </>
  ),
  cake: (c) => (
    <>
      <rect x="46" y="16" width="8" height="22" rx="3" {...shape(c)} />
      <path d="M50 4 Q56 10 50 14 Q44 10 50 4 Z" {...shape(c)} />
      <rect x="16" y="40" width="68" height="44" rx="8" {...shape(c)} />
      <path d="M16 54 Q24 62 33 54 Q42 62 50 54 Q58 62 67 54 Q76 62 84 54" {...line(c)} />
    </>
  ),
  snake: (c) => (
    <>
      <path d="M14 76 Q30 56 46 70 Q62 84 72 60 Q80 40 70 30" fill="none" stroke={c.S} strokeWidth={18} strokeLinecap="round" />
      <path d="M14 76 Q30 56 46 70 Q62 84 72 60 Q80 40 70 30" fill="none" stroke={c.F} strokeWidth={18 - c.W * 2} strokeLinecap="round" />
      <ellipse cx="70" cy="24" rx="14" ry="11" {...shape(c)} />
      <circle cx="74" cy="21" r="2.5" {...dot(c)} />
      <path d="M82 28 L90 32 M90 32 L94 28 M90 32 L94 36" {...line(c, 0.6)} />
    </>
  ),
  dish: (c) => (
    <>
      <ellipse cx="50" cy="60" rx="42" ry="18" {...shape(c)} />
      <ellipse cx="50" cy="58" rx="26" ry="9" {...line(c, 0.8)} />
    </>
  ),
  bird: (c) => (
    <>
      <path d="M40 76 L38 90 M52 76 L54 90" {...line(c)} />
      <ellipse cx="46" cy="58" rx="28" ry="20" {...shape(c)} />
      <circle cx="70" cy="38" r="13" {...shape(c)} />
      <path d="M82 36 L94 40 L82 44 Z" {...shape(c)} />
      <circle cx="72" cy="35" r="2.5" {...dot(c)} />
      <path d="M30 52 Q44 46 54 60 Q38 68 30 52 Z" {...shape(c)} />
    </>
  ),
  plane: (c) => (
    <>
      <path d="M40 46 L24 14 L34 14 L60 46 Z" {...shape(c)} />
      <path d="M40 58 L24 88 L34 88 L60 58 Z" {...shape(c)} />
      <path d="M10 52 Q10 44 22 44 L80 44 Q94 46 94 52 Q94 58 80 60 L22 60 Q10 60 10 52 Z" {...shape(c)} />
      <path d="M10 52 L4 36 L14 36 L22 46" {...shape(c)} />
    </>
  ),
  crab: (c) => (
    <>
      <path d="M28 66 L14 80 M34 70 L24 86 M72 66 L86 80 M66 70 L76 86" {...line(c)} />
      <path d="M30 50 L18 34 M70 50 L82 34" {...line(c)} />
      <circle cx="16" cy="28" r="9" {...shape(c)} />
      <circle cx="84" cy="28" r="9" {...shape(c)} />
      <ellipse cx="50" cy="60" rx="28" ry="18" {...shape(c)} />
      <path d="M42 44 L42 34 M58 44 L58 34" {...line(c)} />
      <circle cx="42" cy="32" r="3" {...dot(c)} />
      <circle cx="58" cy="32" r="3" {...dot(c)} />
    </>
  ),
  boat: (c) => (
    <>
      <path d="M48 12 L48 60" {...line(c)} />
      <path d="M52 16 L80 56 L52 56 Z" {...shape(c)} />
      <path d="M10 62 L90 62 L76 84 L24 84 Z" {...shape(c)} />
    </>
  ),
  whale: (c) => (
    <>
      <path d="M8 60 Q8 32 44 32 Q80 32 82 58 L92 44 L94 70 L80 64 Q70 82 40 82 Q8 82 8 60 Z" {...shape(c)} />
      <circle cx="24" cy="54" r="3" {...dot(c)} />
      <path d="M40 30 L40 18 M40 18 Q32 10 26 14 M40 18 Q48 10 54 14" {...line(c, 0.8)} />
      <path d="M14 66 Q30 72 46 66" {...line(c, 0.7)} />
    </>
  ),
  fire: (c) => (
    <>
      <path d="M50 8 C62 26 82 36 78 62 C76 80 64 90 50 90 C36 90 24 80 22 62 C20 46 32 38 36 26 C42 36 46 40 48 44 C52 32 54 22 50 8 Z" {...shape(c)} />
      <path d="M50 52 C58 62 62 70 58 78 C56 84 44 84 42 78 C38 70 44 62 50 52 Z" {...shape(c)} />
    </>
  ),
  snowman: (c) => (
    <>
      <circle cx="50" cy="68" r="24" {...shape(c)} />
      <circle cx="50" cy="32" r="17" {...shape(c)} />
      <rect x="38" y="6" width="24" height="12" rx="2" {...shape(c)} />
      <circle cx="44" cy="30" r="2.5" {...dot(c)} />
      <circle cx="56" cy="30" r="2.5" {...dot(c)} />
      <path d="M50 35 L60 38 L50 40 Z" {...dot(c)} />
      <circle cx="50" cy="60" r="2.5" {...dot(c)} />
      <circle cx="50" cy="72" r="2.5" {...dot(c)} />
    </>
  ),
  icecream: (c) => (
    <>
      <path d="M30 48 L50 94 L70 48 Z" {...shape(c)} />
      <path d="M38 58 L60 70 M62 58 L42 70 M44 78 L56 82" {...line(c, 0.6)} />
      <path d="M26 50 C20 30 34 14 50 14 C66 14 80 30 74 50 Z" {...shape(c)} />
    </>
  ),
  snowflake: (c) => (
    <>
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <path d="M50 8 L50 92" {...line(c)} />
          <path d="M40 18 L50 26 L60 18 M40 82 L50 74 L60 82" {...line(c, 0.8)} />
        </g>
      ))}
    </>
  ),
  mitten: (c) => (
    <>
      <path d="M30 70 L30 34 Q30 12 52 12 Q72 12 72 34 L72 50 L82 42 Q92 40 90 52 L72 74 L72 70 Z" {...shape(c)} />
      <rect x="26" y="70" width="50" height="20" rx="6" {...shape(c)} />
      <path d="M34 76 L34 84 M44 76 L44 84 M54 76 L54 84 M64 76 L64 84" {...line(c, 0.6)} />
    </>
  ),
  owl: (c) => (
    <>
      <path d="M22 30 L26 12 L38 24 M78 30 L74 12 L62 24" {...shape(c)} />
      <ellipse cx="50" cy="56" rx="30" ry="36" {...shape(c)} />
      <circle cx="38" cy="42" r="11" {...shape(c)} />
      <circle cx="62" cy="42" r="11" {...shape(c)} />
      <circle cx="38" cy="42" r="4" {...dot(c)} />
      <circle cx="62" cy="42" r="4" {...dot(c)} />
      <path d="M46 54 L54 54 L50 62 Z" {...dot(c)} />
      <path d="M36 72 Q42 66 48 72 M52 72 Q58 66 64 72" {...line(c, 0.6)} />
    </>
  ),
  flower: (c) => (
    <>
      <path d="M50 56 L50 94" {...line(c)} />
      <path d="M50 80 Q36 66 28 76 Q38 86 50 80 Z" {...shape(c)} />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="50" cy="20" rx="11" ry="15" transform={`rotate(${deg} 50 38)`} {...shape(c)} />
      ))}
      <circle cx="50" cy="38" r="10" {...shape(c)} />
    </>
  ),
  house: (c) => (
    <>
      <rect x="20" y="44" width="60" height="46" {...shape(c)} />
      <path d="M12 48 L50 14 L88 48 Z" {...shape(c)} />
      <rect x="42" y="62" width="16" height="28" rx="2" {...shape(c)} />
      <rect x="26" y="54" width="12" height="12" rx="2" {...shape(c)} />
      <rect x="62" y="54" width="12" height="12" rx="2" {...shape(c)} />
    </>
  ),
  heart: (c) => <path d="M50 88 C10 62 10 36 26 24 C38 16 48 22 50 32 C52 22 62 16 74 24 C90 36 90 62 50 88 Z" {...shape(c)} />,
  butterfly: (c) => (
    <>
      <path d="M48 46 C30 14 6 20 12 40 C16 54 34 52 48 50 Z" {...shape(c)} />
      <path d="M52 46 C70 14 94 20 88 40 C84 54 66 52 52 50 Z" {...shape(c)} />
      <path d="M48 52 C30 56 18 72 30 80 C40 84 46 70 48 58 Z" {...shape(c)} />
      <path d="M52 52 C70 56 82 72 70 80 C60 84 54 70 52 58 Z" {...shape(c)} />
      <ellipse cx="50" cy="52" rx="5" ry="22" {...shape(c)} />
      <path d="M48 32 Q42 20 38 18 M52 32 Q58 20 62 18" {...line(c, 0.7)} />
    </>
  ),
  cloud: (c) => (
    <path d="M24 72 C10 72 8 54 22 50 C20 34 40 28 48 38 C54 24 78 26 78 44 C92 44 94 72 78 72 Z" {...shape(c)} />
  ),
  waves: (c) => (
    <>
      <path d="M6 40 Q18 28 30 40 Q42 52 54 40 Q66 28 78 40 Q90 52 96 44" {...line(c, 1.3)} />
      <path d="M6 62 Q18 50 30 62 Q42 74 54 62 Q66 50 78 62 Q90 74 96 66" {...line(c, 1.3)} />
    </>
  ),
  bone: (c) => (
    <path
      d="M30 40 L70 40 C72 30 86 28 88 38 C96 40 96 52 88 52 C96 54 94 66 86 64 C84 72 72 70 70 60 L30 60 C28 70 16 72 14 64 C6 66 4 54 12 52 C4 52 4 40 12 38 C14 28 28 30 30 40 Z"
      {...shape(c)}
    />
  ),
};

/** Name, label and first sound for each picture (used by the sound and rhyme blocks).
 *  An empty sound keeps a picture out of Beginning sounds (long vowels and blends confuse early phonics). */
export const PICTURES: Record<string, { label: string; sound: string }> = {
  apple: { label: 'apple', sound: 'a' },
  ball: { label: 'ball', sound: 'b' },
  bee: { label: 'bee', sound: 'b' },
  bird: { label: 'bird', sound: 'b' },
  boat: { label: 'boat', sound: 'b' },
  bone: { label: 'bone', sound: 'b' },
  bug: { label: 'bug', sound: 'b' },
  butterfly: { label: 'butterfly', sound: 'b' },
  cake: { label: 'cake', sound: 'c' },
  car: { label: 'car', sound: 'c' },
  cat: { label: 'cat', sound: 'c' },
  cloud: { label: 'cloud', sound: '' }, // "cl" blend
  crab: { label: 'crab', sound: '' }, // "cr" blend
  dish: { label: 'dish', sound: 'd' },
  dog: { label: 'dog', sound: 'd' },
  egg: { label: 'egg', sound: 'e' },
  fire: { label: 'fire', sound: 'f' },
  fish: { label: 'fish', sound: 'f' },
  flower: { label: 'flower', sound: '' }, // "fl" blend
  hat: { label: 'hat', sound: 'h' },
  heart: { label: 'heart', sound: 'h' },
  house: { label: 'house', sound: 'h' },
  icecream: { label: 'ice cream', sound: '' }, // long vowel: left out of beginning sounds
  kite: { label: 'kite', sound: 'k' },
  leaf: { label: 'leaf', sound: 'l' },
  log: { label: 'log', sound: 'l' },
  mitten: { label: 'mitten', sound: 'm' },
  moon: { label: 'moon', sound: 'm' },
  mug: { label: 'mug', sound: 'm' },
  nest: { label: 'nest', sound: 'n' },
  owl: { label: 'owl', sound: '' }, // vowel blend: left out of beginning sounds
  pig: { label: 'pig', sound: 'p' },
  plane: { label: 'plane', sound: '' }, // "pl" blend
  snake: { label: 'snake', sound: '' }, // "sn" blend
  snowflake: { label: 'snowflake', sound: '' }, // "sn" blend
  snowman: { label: 'snowman', sound: '' }, // "sn" blend
  spoon: { label: 'spoon', sound: '' }, // "sp" blend
  star: { label: 'star', sound: '' }, // "st" blend
  sun: { label: 'sun', sound: 's' },
  tree: { label: 'tree', sound: '' }, // "tr" blend
  van: { label: 'van', sound: 'v' },
  waves: { label: 'waves', sound: 'w' },
  web: { label: 'web', sound: 'w' },
  whale: { label: 'whale', sound: 'w' },
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

/**
 * Draws one picture from the library. Outline weight stays a steady ~3pt on the page
 * whatever the size (never below the 1.5pt Ink Style minimum).
 */
export const Picture: React.FC<PictureProps> = ({ name, cx, cy, size, mode = 'line', flip = false }) => {
  const art = PICTURE_ART[name];
  if (!art) return null;
  const scale = size / 100;
  const pageStroke = Math.min(3, Math.max(1.5, size * 0.045));
  const style: ArtStyle =
    mode === 'shadow'
      ? { F: TRACE, S: TRACE, D: TRACE, W: pageStroke / scale }
      : { F: PAPER, S: INK, D: INK, W: pageStroke / scale };
  const flipTransform = flip ? ' translate(100 0) scale(-1 1)' : '';
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})${flipTransform}`}>
      {art(style)}
    </g>
  );
};
