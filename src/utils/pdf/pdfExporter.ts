/**
 * @license
 * Sunshine Brigade Worksheet Builder - Vector PDF & Print Exporter
 * Generates true vector PDF files client-side using jsPDF and svg2pdf.js,
 * and provides browser native print as a zero-margin fallback.
 */

import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { Worksheet } from '../../types';
import { PAGE_SPECS } from '../../config/appConfig';
import { trackEvent } from '../analytics';

export interface ExportPdfOptions {
  fileName?: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Exports all pages of the worksheet to a high-resolution vector PDF
 */
export async function exportWorksheetToPdf(
  worksheet: Worksheet,
  options: ExportPdfOptions = {}
): Promise<void> {
  const spec = PAGE_SPECS[worksheet.pageSize] || PAGE_SPECS.letter;
  const isA4 = worksheet.pageSize === 'a4';

  try {
    // jsPDF unit: 'pt' matches 72 DPI points (Letter: 612 x 792 pt, A4: 595.28 x 841.89 pt)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: isA4 ? 'a4' : 'letter',
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < worksheet.pages.length; i++) {
      if (i > 0) {
        pdf.addPage(isA4 ? 'a4' : 'letter', 'portrait');
      }

      // Look up rendered SVG element in DOM
      const svgId = `print-svg-page-${worksheet.pages[i].id}`;
      const svgElem = document.getElementById(svgId) as unknown as SVGSVGElement | null;

      if (svgElem) {
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
    // If svg2pdf encounters an issue, fallback to print dialog
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
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

  window.print();
  onSuccess?.();
}
