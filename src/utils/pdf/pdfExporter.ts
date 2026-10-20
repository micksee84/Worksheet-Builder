/**
 * @license
 * Sunshine Brigade Worksheet Builder - Vector PDF & Print Exporter
 * Generates true vector PDF files client-side using jsPDF and svg2pdf.js,
 * and provides browser native print as a zero-margin fallback.
 */

import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { Worksheet, PageSizeId } from '../../types';
import { trackEvent } from '../analytics';
import { registerPdfFonts } from './pdfFonts';

export interface ExportPdfOptions {
  fileName?: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Exports all pages of the worksheet to a high-resolution vector PDF.
 * If the brand fonts can't be loaded, this fails on purpose so the caller falls back
 * to the browser print dialog, which draws the real fonts, rather than saving a PDF
 * whose tracing letters are in the wrong typeface.
 */
export async function exportWorksheetToPdf(
  worksheet: Worksheet,
  options: ExportPdfOptions = {}
): Promise<void> {
  const isA4 = worksheet.pageSize === 'a4';

  try {
    // jsPDF unit: 'pt' matches 72 DPI points (Letter: 612 x 792 pt, A4: 595.28 x 841.89 pt)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: isA4 ? 'a4' : 'letter',
    });

    await registerPdfFonts(pdf);

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < worksheet.pages.length; i++) {
      if (i > 0) {
        pdf.addPage(isA4 ? 'a4' : 'letter', 'portrait');
      }

      // Look up rendered SVG element in DOM
      const svgId = `print-svg-page-${worksheet.pages[i].id}`;
      const svgElem = document.getElementById(svgId) as unknown as SVGSVGElement | null;
      if (!svgElem) {
        throw new Error(`Page ${i + 1} is not ready to export`);
      }

      // Clone to avoid mutating live DOM
      const clonedSvg = svgElem.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', `${pdfPageWidth}pt`);
      clonedSvg.setAttribute('height', `${pdfPageHeight}pt`);

      await svg2pdf(clonedSvg, pdf, {
        x: 0,
        y: 0,
        width: pdfPageWidth,
        height: pdfPageHeight,
      });
    }

    const cleanTitle = worksheet.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = options.fileName || `${cleanTitle || 'sunshine_worksheet'}.pdf`;

    pdf.save(fileName);

    // Track analytics event (sanitized, zero PII)
    const allBlockIds = worksheet.pages.flatMap((p) =>
      p.slots.map((s) => s.block?.blockId).filter(Boolean)
    ) as string[];

    trackEvent('pdf_downloaded', {
      pageCount: worksheet.pages.length,
      blockIds: allBlockIds,
      pageSize: worksheet.pageSize,
    });

    options.onSuccess?.();
  } catch (error) {
    console.error('Vector PDF generation error:', error);
    // If fonts or svg2pdf fail, fall back to the print dialog
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

const PRINT_PAGE_STYLE_ID = 'sb-print-page-size';

/**
 * Sets the printed paper size and removes browser margins, so the page prints
 * at true size instead of being shrunk to fit inside the default margins.
 */
function applyPrintPageSize(pageSize: PageSizeId): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(PRINT_PAGE_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = PRINT_PAGE_STYLE_ID;
    document.head.appendChild(style);
  }
  const size = pageSize === 'a4' ? 'A4' : 'letter';
  style.textContent = `@page { size: ${size} portrait; margin: 0; }`;
}

/**
 * Triggers browser vector printing via print stylesheet
 */
export function printWorksheetNative(worksheet: Worksheet, onSuccess?: () => void): void {
  const allBlockIds = worksheet.pages.flatMap((p) =>
    p.slots.map((s) => s.block?.blockId).filter(Boolean)
  ) as string[];

  trackEvent('worksheet_printed', {
    pageCount: worksheet.pages.length,
    blockIds: allBlockIds,
    pageSize: worksheet.pageSize,
  });

  applyPrintPageSize(worksheet.pageSize);
  window.print();
  onSuccess?.();
}
