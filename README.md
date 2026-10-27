# Sunshine Brigade Worksheet Builder

A clean, extendable, browser-based drag-and-drop tool for parents and teachers to build custom printable worksheets for children ages 3–5.

## Architectural Overview

- **Accounts and privacy**: Grown-ups sign in with a passwordless email code (Supabase). Each worksheet saves to their account, private to them by row-level security, with `localStorage` as the instant offline copy. Worksheet contents can include typed words, so they are never logged or sent to analytics. Setup: [`docs/LOGIN_SETUP.md`](docs/LOGIN_SETUP.md).
- **Central Block Registry (`/src/registry/blockRegistry.ts`)**: Defines every activity as a pure self-contained block.
- **Fixed Slot Grid System (`/src/utils/layoutPresets.ts`)**: Pages use fixed, snapped layout presets (`1-full`, `2-half`, `4-quarter`, `top-half-2-quarter`, `2-quarter-bottom-half`).
- **Pure SVG Vector Pipeline**: Blocks output pure SVG vector markup. This ensures crisp print quality at any resolution, with `@media print` and client-side vector PDF generation (`jsPDF` + `svg2pdf.js`).
- **Character Artwork System (`/public/characters/`)**: Mascots (Buddy, Finn, Ollie, Faye, Rusty, Hana) load by ID with automatic graceful fallback circles if artwork is missing.

---

## How to Add a New Block Type

Adding a new activity block takes 2 simple steps:

### Step 1: Create your block component in `/src/blocks/`

Create a new file, e.g., `/src/blocks/ColorMatchBlock.tsx`:

```tsx
import React from 'react';
import { BlockDefinition, BlockRenderProps } from '../types';
import { CharacterCorner } from '../components/CharacterCorner';

export const ColorMatchRenderer: React.FC<BlockRenderProps> = ({
  instance,
  size,
  width,
  height,
}) => {
  const itemCount = Number(instance.settings.itemCount) || 3;
  const padding = 24;

  return (
    <g className="color-match-block">
      {/* Title */}
      <text
        x={padding}
        y={padding + 4}
        fill="#2D2200"
        fontSize="14"
        fontWeight="bold"
        fontFamily="Nunito, sans-serif"
      >
        Match the matching shapes:
      </text>

      {/* Your custom vector SVG elements here */}
      <circle cx={width / 2} cy={height / 2} r="30" fill="none" stroke="#2D2200" strokeWidth="2" />

      {/* Include Character Corner in any corner */}
      <CharacterCorner config={instance.character} blockWidth={width} blockHeight={height} />
    </g>
  );
};

export const ColorMatchBlockDefinition: BlockDefinition = {
  id: 'color-match',
  displayName: 'Color & Shape Match',
  description: 'Connect matching shapes from left to right.',
  category: 'pre-writing', // 'pre-writing' | 'letters' | 'numbers' | 'creative'
  skillTags: ['shape recognition', 'pencil control'],
  ageRange: '3–5',
  allowedSizes: ['full', 'half', 'quarter'],
  settingsSchema: [
    {
      key: 'itemCount',
      label: 'Number of Pairs',
      type: 'number',
      min: 2,
      max: 5,
      step: 1,
      helperText: 'How many matching pairs to generate.',
    },
  ],
  defaultSettings: {
    itemCount: 3,
  },
  render: (props) => <ColorMatchRenderer {...props} />,
};
```

### Step 2: Register it in `/src/registry/blockRegistry.ts`

Import your definition and add it to `REGISTERED_BLOCKS`:

```ts
import { ColorMatchBlockDefinition } from '../blocks/ColorMatchBlock';

export const REGISTERED_BLOCKS: BlockDefinition[] = [
  LineTracingBlockDefinition,
  LetterTracingBlockDefinition,
  WordTracingBlockDefinition,
  NumberTracingBlockDefinition,
  CountCircleBlockDefinition,
  DrawWriteBlockDefinition,
  ColorMatchBlockDefinition, // <-- added here!
];
```

That's all! The block is automatically:
1. Listed in the sidebar block library under its category.
2. Searchable by name, description, and skill tags.
3. Draggable onto any compatible slot.
4. Rendered in the live canvas, browser print, and PDF vector export.
5. Editable via the auto-generated Settings Drawer.

---

## Designer Customization Guide

- **Brand Colors & Fonts**: Edit `/src/config/appConfig.ts` (`BRAND_COLORS`, `APP_FONTS`).
- **Donation Link & Copy**: Edit `DONATION_CONFIG` in `/src/config/appConfig.ts`.
- **Character Artwork**: Drop SVG mascot illustrations directly into `/public/characters/<id>.svg` (`buddy.svg`, `finn.svg`, `ollie.svg`, `faye.svg`, `rusty.svg`, `hana.svg`).
- **Custom Font**: Place your `SuperJoyful.woff2` in `/public/fonts/SuperJoyful.woff2`.

---

## Analytics & Privacy

- All user events run through `trackEvent(name, data)` in `/src/utils/analytics.ts`.
- Typed names and personal text are **never logged or sent anywhere**.
