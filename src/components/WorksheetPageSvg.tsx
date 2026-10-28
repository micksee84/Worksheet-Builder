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
import {
  pageLayout,
  TITLE_FONT_SIZE,
  NAME_FONT_SIZE,
  FOOTER_FONT_SIZE,
  RULE_STROKE,
  FRAME_STROKE,
} from '../utils/spacing';

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
  const { width: pageWidth, height: pageHeight } = spec;
  const layout = pageLayout(pageSize, page.showDateName);
  const margin = layout.left;
  const innerWidth = layout.right - layout.left;
  const geometries = calculateSlotGeometries(pageSize, page.layout, page.showDateName);

  return (
    <svg
      // Only the hidden print copy carries this id: the PDF exporter finds pages by it,
      // and on-screen previews (single page and the all-pages grid) must never be picked up.
      id={isInteractive ? undefined : `print-svg-page-${page.id}`}
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
      {/* All positions come from pageLayout (utils/spacing): every gap is 0.25 in. Lines use
          round caps, so they start and end half a stroke in from the margins. */}
      <g className="worksheet-header" transform={`translate(${margin}, 0)`}>
        {/* Page Title: Ink Style sticker. Built from three layers so it survives PDF export:
            a flat ink shadow (6% down-right), an ink outline (3.2% all round), then white letters. */}
        {(() => {
          const titleText = page.title || `Page ${pageIndex + 1}`;
          const size = TITLE_FONT_SIZE;
          const outline = size * 0.032 * 2; // stroke is centred, so double it to sit 3.2% outside
          const shadow = size * 0.06;
          const x = outline / 2; // the outline's left edge sits on the margin
          const common = {
            y: layout.titleBaseline,
            fontSize: size,
            fontFamily: 'Super Joyful, Nunito, sans-serif',
            fontWeight: 'normal',
            letterSpacing: 0.4,
          };
          return (
            <g className="ink-sticker-title">
              <text {...common} x={x + shadow} dy={shadow} fill="#2D2200" stroke="#2D2200" strokeWidth={outline} strokeLinejoin="round">
                {titleText}
              </text>
              <text {...common} x={x} fill="#2D2200" stroke="#2D2200" strokeWidth={outline} strokeLinejoin="round">
                {titleText}
              </text>
              <text {...common} x={x} fill="#FFFFFF">
                {titleText}
              </text>
            </g>
          );
        })()}

        {/* Name and Date, each with a write-on line on the label's baseline */}
        {layout.nameBaseline !== null && (
          <g>
            <text
              x="0"
              y={layout.nameBaseline}
              fill="#2D2200"
              fontSize={NAME_FONT_SIZE}
              fontWeight="700"
              fontFamily="Nunito, sans-serif"
            >
              Name:
            </text>
            <line
              x1="46"
              y1={layout.nameBaseline}
              x2="280"
              y2={layout.nameBaseline}
              stroke="#2D2200"
              strokeWidth={RULE_STROKE}
              strokeLinecap="round"
            />

            <text
              x={innerWidth - 180}
              y={layout.nameBaseline}
              fill="#2D2200"
              fontSize={NAME_FONT_SIZE}
              fontWeight="700"
              fontFamily="Nunito, sans-serif"
            >
              Date:
            </text>
            <line
              x1={innerWidth - 140}
              y1={layout.nameBaseline}
              x2={innerWidth - RULE_STROKE / 2}
              y2={layout.nameBaseline}
              stroke="#2D2200"
              strokeWidth={RULE_STROKE}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* No rule under the header: it sat too close to the Name and Date line. The space it
            used (layout.headerRuleY) is kept, so activities stay where they were. */}
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
                strokeWidth={isSelected ? 3 : hasBlock ? FRAME_STROKE : 1.5}
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

      {/* Page footer: Ink Style. Rule 0.25 in under the activities (matching the header rule
          above them), then the tagline left and the page number right, 0.25 in from the
          bottom edge. */}
      <g transform={`translate(${margin}, 0)`}>
        <line
          x1={RULE_STROKE / 2}
          y1={layout.footerRuleY}
          x2={innerWidth - RULE_STROKE / 2}
          y2={layout.footerRuleY}
          stroke="#2D2200"
          strokeWidth={RULE_STROKE}
          strokeLinecap="round"
        />
        <text
          x="0"
          y={layout.footerBaseline}
          fill="#2D2200"
          fontSize={FOOTER_FONT_SIZE}
          fontWeight="700"
          letterSpacing="0.18"
          fontFamily="Nunito, sans-serif"
        >
          Learn. Wonder. Shine.
        </text>
        <text
          x={innerWidth}
          y={layout.footerBaseline}
          textAnchor="end"
          fill="#2D2200"
          fontSize={FOOTER_FONT_SIZE}
          fontWeight="700"
          letterSpacing="0.18"
          fontFamily="Nunito, sans-serif"
        >
          Page {pageIndex + 1}
        </text>
      </g>
    </svg>
  );
};
