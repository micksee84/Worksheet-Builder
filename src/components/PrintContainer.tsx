/**
 * @license
 * Sunshine Brigade Worksheet Builder - Hidden Print Container
 * Renders all pages of the worksheet with unique IDs so that:
 * 1. svg2pdf can access clean DOM SVG nodes for vector PDF generation.
 * 2. Window.print() can print all pages with proper page-break-after styling.
 */

import React from 'react';
import { Worksheet } from '../types';
import { WorksheetPageSvg } from './WorksheetPageSvg';

interface PrintContainerProps {
  worksheet: Worksheet;
}

export const PrintContainer: React.FC<PrintContainerProps> = ({ worksheet }) => {
  return (
    <div
      id="worksheet-print-container"
      className="hidden print:block"
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      {worksheet.pages.map((page, index) => (
        <div
          key={page.id}
          className="worksheet-print-page"
          style={{
            pageBreakAfter: index < worksheet.pages.length - 1 ? 'always' : 'auto',
            breakAfter: index < worksheet.pages.length - 1 ? 'page' : 'auto',
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WorksheetPageSvg
            page={page}
            pageIndex={index}
            pageSize={worksheet.pageSize}
            isInteractive={false}
          />
        </div>
      ))}
    </div>
  );
};
