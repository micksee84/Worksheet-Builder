/**
 * @license
 * Sunshine Brigade Worksheet Builder
 * Configuration file for designers & developers.
 * Edit brand colors, typography, donation link, and default dimensions here.
 */

// ==========================================
// BRAND & DESIGN SYSTEM CONFIGURATION
// ==========================================

export const BRAND_COLORS = {
  yellow: '#F2B800',
  blue: '#009BD9',
  red: '#E52311',
  cream: '#F2F2E2',
  darkBrown: '#2D2200',
  white: '#FFFFFF',
  softCream: '#FAF8F0',
  mutedBrown: '#6B5838',
  borderLight: '#E2DEC9',
} as const;

// Ink Style page inks: the only colours allowed on a printed page
// (characters are the one exception). See the sunshine-brigade-ink-style guide.
export const INK_STYLE = {
  ink: '#2D2200', // all text, outlines, shadows, start dots
  paper: '#FFFFFF', // every ground and fill
  trace: '#B6B2A6', // letters and numbers to trace (solid fill), dashed paths and guide lines
  traceLineWidth: 4, // pt, paths to trace
  traceDash: '12,12', // dash / gap for paths to trace
  frameWidth: 2.25, // pt (3px), activity frames
  minLineWidth: 1.5, // nothing thinner than this
  minRadius: 12,
} as const;

export const APP_FONTS = {
  heading: '"Super Joyful", "Nunito", system-ui, sans-serif',
  body: '"Nunito", system-ui, sans-serif',
  handwriting: '"Nunito", "Comic Sans MS", system-ui, sans-serif',
} as const;

// Configurable link shown in the post-download donation card
export const DONATION_CONFIG = {
  url: 'https://www.paypal.com/ncp/payment/GMKWH2TAR3EG4',
  title: 'Help keep it free',
  message:
    'Sunshine Brigade is made by a small family team. If this worksheet brought a little sunshine to your home or classroom, a donation helps us make the next one.',
  buttonText: 'Donate to keep it free',
};

// ==========================================
// WORKSHEET PAGE DIMENSIONS (SVG / PDF UNITS)
// Standard 72 DPI points: US Letter = 612x792, A4 = 595x842
// ==========================================

export const PAGE_SPECS = {
  letter: {
    id: 'letter',
    displayName: 'US Letter (8.5 × 11 in)',
    width: 612,
    height: 792,
    headerHeight: 100,
    margin: 32,
  },
  a4: {
    id: 'a4',
    displayName: 'A4 (210 × 297 mm)',
    width: 595,
    height: 842,
    headerHeight: 100,
    margin: 32,
  },
} as const;

export type PageSizeId = keyof typeof PAGE_SPECS;

// Available characters
export const CHARACTERS = [
  { id: 'buddy', name: 'Buddy', species: 'Bear', color: '#A06535' },
  { id: 'finn', name: 'Finn', species: 'Fox', color: '#E65D24' },
  { id: 'ollie', name: 'Ollie', species: 'Owl', color: '#88684A' },
  { id: 'faye', name: 'Faye', species: 'Frog', color: '#7AC142' },
  { id: 'rusty', name: 'Rusty', species: 'Raccoon', color: '#8E8E8E' },
  { id: 'hana', name: 'Hana', species: 'Hummingbird', color: '#009BD9' },
] as const;

export type CharacterId = typeof CHARACTERS[number]['id'];
