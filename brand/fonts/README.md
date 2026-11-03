# Sunshine Print

Sunshine Brigade's own print handwriting model for children aged 3 to 5.

| File | What it is |
|---|---|
| `SunshinePrint-Regular.ttf` | Solid letters: the model to copy |
| `SunshinePrintDots-Regular.ttf` | Dotted letters to trace, with a big start dot on each |
| `SunshinePrintStarts-Regular.ttf` | Only the start dots. Set the same text in this font, in Ink (#2D2200), on top of the Dots text so the start dots print black |

Covers A–Z, a–z, 0–9 and `. , ! ? ' -`. Cap height and tall letters reach the top line,
the x-height is exactly half (the dashed midline), descenders drop 0.35 below the baseline.

Use Trace Dot (#9A9585) for the Dots text and Ink (#2D2200) for the solid model and the start dots.

The builder draws from the same source (`src/blocks/letterStrokes.ts`), so the fonts and the
builder always match. To rebuild after changing a letter:

```sh
npm run build:fonts
```
