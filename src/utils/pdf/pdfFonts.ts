/**
 * @license
 * Sunshine Brigade Worksheet Builder - PDF Font Embedding
 *
 * svg2pdf can only draw text in fonts that have been registered with jsPDF.
 * Without this, every letter in the PDF falls back to Times, so the shapes a child
 * traces in the PDF no longer match the preview. This module loads the brand fonts
 * from /public/fonts once and registers them with each new jsPDF document.
 *
 * How svg2pdf picks a font: it looks for the SVG font-family name, with a style
 * built from the font-weight. 400 -> "normal", 700 -> "bold", 800 -> "800normal",
 * 900 -> "900normal". So each weight is registered under that exact style name.
 *
 * Nunito is licensed under the SIL Open Font License (see public/fonts/Nunito-OFL.txt).
 * Super Joyful is optional: drop SuperJoyful.ttf into public/fonts and page titles
 * will use it. Until then titles fall back to Nunito.
 */

import type { jsPDF } from 'jspdf';

interface FontFile {
  url: string;
  family: string;
  style: string;
  required: boolean;
}

const FONT_FILES: FontFile[] = [
  { url: '/fonts/Nunito_400Regular.ttf', family: 'Nunito', style: 'normal', required: true },
  { url: '/fonts/Nunito_700Bold.ttf', family: 'Nunito', style: 'bold', required: true },
  { url: '/fonts/Nunito_800ExtraBold.ttf', family: 'Nunito', style: '800normal', required: true },
  { url: '/fonts/Nunito_900Black.ttf', family: 'Nunito', style: '900normal', required: true },
  { url: '/fonts/SuperJoyful.ttf', family: 'Super Joyful', style: 'normal', required: false },
];

interface LoadedFont extends FontFile {
  fileName: string;
  base64: string;
}

let loadPromise: Promise<LoadedFont[]> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadFontFile(font: FontFile): Promise<LoadedFont | null> {
  const response = await fetch(font.url);
  const type = response.headers.get('content-type') || '';
  // A missing file on many hosts returns index.html with a 200, so check the type too
  if (!response.ok || type.includes('text/html')) {
    if (font.required) throw new Error(`Could not load PDF font ${font.url}`);
    return null;
  }
  const base64 = arrayBufferToBase64(await response.arrayBuffer());
  const fileName = font.url.split('/').pop() || `${font.family}-${font.style}.ttf`;
  return { ...font, fileName, base64 };
}

/** Loads every font file once per page visit. Throws if a required font is missing. */
function loadFonts(): Promise<LoadedFont[]> {
  if (!loadPromise) {
    loadPromise = Promise.all(FONT_FILES.map(loadFontFile))
      .then((fonts) => fonts.filter((f): f is LoadedFont => f !== null))
      .catch((err) => {
        loadPromise = null; // allow a retry on the next export
        throw err;
      });
  }
  return loadPromise;
}

/** Registers the brand fonts with a jsPDF document. Returns the families that loaded. */
export async function registerPdfFonts(pdf: jsPDF): Promise<Set<string>> {
  const fonts = await loadFonts();
  const families = new Set<string>();
  for (const font of fonts) {
    pdf.addFileToVFS(font.fileName, font.base64);
    pdf.addFont(font.fileName, font.family, font.style);
    families.add(font.family);
  }
  return families;
}
