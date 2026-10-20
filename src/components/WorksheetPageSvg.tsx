/**
 * @license
 * Sunshine Brigade Worksheet Builder - Single Page SVG Renderer
 * Renders the page header ("Name: _____ Date: _____", Title) and the slot grid.
 * Everything inside is pure SVG for 100% vector sharpness in print, preview, and PDF.
 */

import React from 'react';
import { Page, PageSizeId, BlockInstance, Slot } from '../types';
import { PAGE_SPECS } from '../config/appConfig';
import { calculateSlotGeometries, SlotGeometry } from '../utils/layoutPresets';
import { getBlockById } from '../registry/blockRegistry';

// Ink sticker title size in pt. Super Joyful is never set below 24.
const TITLE_FONT_SIZE = 26;

interface WorksheetPageSvgProps {
  page: Page;
  pageIndex: number;
  pageSize: PageSizeId;
  selectedInstanceId?: string | null;
  onSelectSlot?: (pageId: string, slot: Slot) => void;
  onDeleteBlock?: (pageId: string, slotId: string) => void;
  isInteractive?: boolean; // false during PDF/print export
}

export const WorksheetPageSvg: React.FC<WorksheetPageSvgProps> = ({
  page,
  pageIndex,
  pageSize,
  selectedInstanceId,
  onSelectSlot,
  onDeleteBlock,
  isInteractive = true,
}) => {
  const spec = PAGE_SPECS[pageSize as keyof typeof PAGE_SPECS] || PAGE_SPECS.letter;
  const { width: pageWidth, height: pageHeight, margin, headerHeight } = spec;
  const geometries = calculateSlotGeometries(pageSize, page.layout);

  return (
    <svg
      id={`print-svg-page-${page.id}`}
      viewBox={`0 0 ${pageWidth} ${pageHeight}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className="worksheet-svg-surface bg-white shadow-md select-none"
      style={{
        aspectRatio: `${pageWidth} / ${pageHeight}`,
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {/* Background White Sheet */}
      <rect
        x="0"
        y="0"
        width={pageWidth}
        height={pageHeight}
        fill="#FFFFFF"
      />

      {/* ==================================================== */}
      {/* HEADER STRIP                                         */}
      {/* "Name: ______ Date: ______" and Editable Title        */}
      {/* ==================================================== */}
      <g className="worksheet-header" transform={`translate(${margin}, ${margin})`}>
        {/* Page Title: Ink Style sticker. Built from three layers so it survives PDF export:
            a flat ink shadow (6% down-right), an ink outline (3.2% all round), then white letters. */}
        {(() => {
          const titleText = page.title || `Page ${pageIndex + 1}`;
          const size = TITLE_FONT_SIZE;
          const outline = size * 0.032 * 2; // stroke is centred, so double it to sit 3.2% outside
          const shadow = size * 0.06;
          const common = {
            y: 24,
            fontSize: size,
            fontFamily: 'Super Joyful, Nunito, sans-serif',
            fontWeight: 'normal',
            letterSpacing: 0.4,
          };
          return (
            <g className="ink-sticker-title">
              <text {...common} x={shadow} dy={shadow} fill="#2D2200" stroke="#2D2200" strokeWidth={outline} strokeLinejoin="round">
                {titleText}
              </text>
              <text {...common} x={0} fill="#2D2200" stroke="#2D2200" strokeWidth={outline} strokeLinejoin="round">
                {titleText}
              </text>
              <text {...common} x={0} fill="#FFFFFF">
                {titleText}
              </text>
            </g>
          );
        })()}

        {/* Name and Date Line */}
        {page.showDateName && (
          <g transform="translate(0, 36)">
            {/* Name label & line */}
            <text
              x="0"
              y="16"
              fill="#2D2200"
              fontSize="13"
              fontWeight="700"
              fontFamily="Nunito, sans-serif"
            >
              Name:
            </text>
            <line
              x1="46"
              y1="16"
              x2="280"
              y2="16"
              stroke="#2D2200"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Date label & line */}
            <text
              x={pageWidth - margin * 2 - 180}
              y="16"
              fill="#2D2200"
              fontSize="13"
              fontWeight="700"
              fontFamily="Nunito, sans-serif"
            >
              Date:
            </text>
            <line
              x1={pageWidth - margin * 2 - 140}
              y1="16"
              x2={pageWidth - margin * 2}
              y2="16"
              stroke="#2D2200"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Header bottom separator line */}
        <line
          x1="0"
          y1={headerHeight - margin * 0.75}
          x2={pageWidth - margin * 2}
          y2={headerHeight - margin * 0.75}
          stroke="#2D2200"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* ==================================================== */}
      {/* SLOTS & ACTIVITIES                                   */}
      {/* ==================================================== */}
      <g className="worksheet-slots">
        {page.slots.map((slot) => {
          const geom = geometries[slot.id];
          if (!geom) return null;

          const hasBlock = Boolean(slot.block);
          // Empty slots are an editing aid only: leave them off printed pages and PDFs
          if (!hasBlock && !isInteractive) return null;
          const isSelected = isInteractive && slot.block?.instanceId === selectedInstanceId;
          const blockDef = slot.block ? getBlockById(slot.block.blockId) : null;

          return (
            <g
              key={slot.id}
              id={`slot-group-${page.id}-${slot.id}`}
              transform={`translate(${geom.x}, ${geom.y})`}
              className={`slot-container ${isInteractive ? 'cursor-pointer' : ''}`}
              onClick={(e) => {
                if (isInteractive && onSelectSlot) {
                  e.stopPropagation();
                  onSelectSlot(page.id, slot);
                }
              }}
            >
              {/* Slot bounding box / boundary */}
              <rect
                x="0"
                y="0"
                width={geom.width}
                height={geom.height}
                rx="12"
                ry="12"
                fill="#FFFFFF"
                stroke={isSelected ? '#009BD9' : hasBlock ? '#2D2200' : '#B6B2A6'}
                strokeWidth={isSelected ? '3' : hasBlock ? '2.25' : '1.5'}
                strokeDasharray={hasBlock ? 'none' : '6,6'}
              />

              {/* Slot content */}
              {hasBlock && blockDef && slot.block ? (
                <g>
                  {/* Render the block's SVG component */}
                  {blockDef.render({
                    instance: slot.block,
                    size: slot.size,
                    width: geom.width,
                    height: geom.height,
                    isSelected,
                  })}

                  {/* Active selection halo / indicator for interactive preview */}
                  {isSelected && isInteractive && (
                    <rect
                      x="2"
                      y="2"
                      width={geom.width - 4}
                      height={geom.height - 4}
                      rx="10"
                      ry="10"
                      fill="none"
                      stroke="#009BD9"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      pointerEvents="none"
                    />
                  )}
                </g>
              ) : (
                /* Empty slot placeholder */
                <g className="empty-slot-guide" pointerEvents="none">
                  {/* Plus icon */}
                  <circle
                    cx={geom.width / 2}
                    cy={geom.height / 2 - 14}
                    r="18"
                    fill="#F2F2E2"
                    stroke="#A39C8E"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={geom.width / 2 - 8}
                    y1={geom.height / 2 - 14}
                    x2={geom.width / 2 + 8}
                    y2={geom.height / 2 - 14}
                    stroke="#2D2200"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={geom.width / 2}
                    y1={geom.height / 2 - 22}
                    x2={geom.width / 2}
                    y2={geom.height / 2 - 6}
                    stroke="#2D2200"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <text
                    x={geom.width / 2}
                    y={geom.height / 2 + 18}
                    textAnchor="middle"
                    fill="#6B5838"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="Nunito, sans-serif"
                  >
                    {slot.label} ({slot.size})
                  </text>
                  <text
                    x={geom.width / 2}
                    y={geom.height / 2 + 34}
                    textAnchor="middle"
                    fill="#A39C8E"
                    fontSize="11"
                    fontFamily="Nunito, sans-serif"
                  >
                    Drag or tap a block to place here
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Page footer: Ink Style. Rule above, tagline left, site and page number right. */}
      <g transform={`translate(${margin}, ${pageHeight - margin + 6})`}>
        <line
          x1="0"
          y1="0"
          x2={pageWidth - margin * 2}
          y2="0"
          stroke="#2D2200"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <text
          x="0"
          y="14"
          fill="#2D2200"
          fontSize="9"
          fontWeight="700"
          letterSpacing="0.18"
          fontFamily="Nunito, sans-serif"
        >
          Learn. Wonder. Shine.
        </text>
        <text
          x={pageWidth - margin * 2}
          y="14"
          textAnchor="end"
          fill="#2D2200"
          fontSize="9"
          fontWeight="700"
          letterSpacing="0.18"
          fontFamily="Nunito, sans-serif"
        >
          sunshinebrigade.ca · Free for home and classroom use · Page {pageIndex + 1}
        </text>
      </g>
    </svg>
  );
};
