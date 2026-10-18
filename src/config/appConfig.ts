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

export const APP_FONTS = {
  heading: '"Super Joyful", "Nunito", system-ui, sans-serif',
  body: '"Nunito", system-ui, sans-serif',
  handwriting: '"Nunito", "Comic Sans MS", system-ui, sans-serif',
} as const;

// Configurable link shown in the post-download donation card
export const DONATION_CONFIG = {
  url: 'https://sunshinebrigade.org/donate',
  title: 'Free forever. Support the Brigade!',
  message:
    'Sunshine Brigade tools are 100% free for parents and educators. If this worksheet helped your child or classroom, consider supporting future printable activities.',
  buttonText: 'Support Sunshine Brigade ❤️',
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
    headerHeight: 70,
    margin: 32,
  },
  a4: {
    id: 'a4',
    displayName: 'A4 (210 × 297 mm)',
    width: 595,
    height: 842,
    headerHeight: 70,
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
