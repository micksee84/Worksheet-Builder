/**
 * @license
 * Sunshine Brigade Worksheet Builder - Left Sidebar & Block Library
 * Features:
 * - Search & skill tags filter
 * - Grouped by development area (pre-writing, literacy, maths, thinking, feelings, world, creative)
 * - Draggable block cards (via @dnd-kit useDraggable)
 * - Tap to add for mobile & quick workflow
 * - Slim view (desktop): half the width, just names and add buttons. It switches on by
 *   itself while a block's settings are open, and can be toggled any time.
 */

import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { getAllBlocks } from '../registry/blockRegistry';
import { BlockDefinition, BlockCategory } from '../types';
import { Search, Plus, X, PanelLeftClose, PanelLeftOpen } from './icons';

interface SidebarProps {
  onAddBlock: (blockId: string) => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  /** Slim view on desktop: names and add buttons only, at half the width. */
  slim?: boolean;
  onToggleSlim?: () => void;
}

const CATEGORY_LABELS: Record<BlockCategory, { label: string; color: string; badge: string }> = {
  'pre-writing': { label: 'Pre-writing and fine motor', color: '#F2B800', badge: 'Lines' },
  'letters': { label: 'Early literacy', color: '#009BD9', badge: 'Letters' },
  'numbers': { label: 'Early maths', color: '#E52311', badge: 'Maths' },
  'thinking': { label: 'Thinking and problem solving', color: '#2D2200', badge: 'Thinking' },
  'feelings': { label: 'Social and emotional', color: '#F2B800', badge: 'Feelings' },
  'world': { label: 'Science and our world', color: '#009BD9', badge: 'World' },
  'creative': { label: 'Creative and expression', color: '#E52311', badge: 'Art' },
};

const DraggableBlockCard: React.FC<{
  block: BlockDefinition;
  onAdd: (blockId: string) => void;
  slim: boolean;
}> = ({ block, onAdd, slim }) => {
  // Detail only shows in the full view. The phone drawer is always full.
  const detail = slim ? 'lg:hidden' : '';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-block-${block.id}`,
    data: {
      type: 'library-block',
      blockId: block.id,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      title={slim ? block.description : undefined}
      className={`group relative bg-white border border-[#E2DEC9] hover:border-[#009BD9] rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all select-none ${slim ? 'lg:px-2.5 lg:py-2' : ''}`}
    >
      <div className={`flex items-start justify-between gap-2 ${slim ? 'lg:items-center lg:gap-1' : ''}`}>
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 mb-1 ${detail}`}>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_LABELS[block.category].color }}
            />
            <span className="text-[11px] font-bold text-[#6B5838] uppercase tracking-wider truncate">
              {block.category} • Ages {block.ageRange}
            </span>
          </div>

          <h4 className={`text-sm font-extrabold text-[#2D2200] leading-snug group-hover:text-[#009BD9] transition-colors ${slim ? 'lg:text-[13px] lg:flex lg:items-center lg:gap-1.5' : ''}`}>
            {slim && (
              <span
                className="hidden lg:inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_LABELS[block.category].color }}
              />
            )}
            <span className="min-w-0">{block.displayName}</span>
          </h4>

          <p className={`text-xs text-[#6B5838] mt-1 line-clamp-2 leading-relaxed ${detail}`}>
            {block.description}
          </p>

          {/* Skill tags */}
          <div className={`flex flex-wrap items-center gap-1 mt-2.5 ${detail}`}>
            {block.skillTags.slice(0, 2).map((tag, idx) => (
              <span
                key={tag}
                className="text-[10px] font-semibold text-[#6B5838] bg-[#FAF8F0] px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Quick add button (essential for mobile & fast click-to-add) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(block.id);
          }}
          className="p-1.5 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2B800] hover:text-white rounded-lg transition-colors shrink-0"
          title="Add to the next empty space"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  onAddBlock,
  isOpenOnMobile,
  onCloseMobile,
  slim = false,
  onToggleSlim,
}) => {
  const hideWhenSlim = slim ? 'lg:hidden' : '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allBlocks = useMemo(() => getAllBlocks(), []);

  // Every skill tag, most used first (so the first few chips are the most useful).
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    allBlocks.forEach((b) => b.skillTags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.keys()).sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b));
  }, [allBlocks]);

  // Skill chips wrap onto new lines (no sideways scrolling, which a mouse wheel can't do).
  // The first few show; "More skills" shows the rest. A chosen skill always stays visible.
  const COLLAPSED_TAGS = 5;
  const [showAllTags, setShowAllTags] = useState(false);
  const visibleTags = useMemo(() => {
    if (showAllTags) return allTags;
    const first = allTags.slice(0, COLLAPSED_TAGS);
    return selectedTag && !first.includes(selectedTag) ? [...first, selectedTag] : first;
  }, [allTags, showAllTags, selectedTag]);
  const hiddenCount = allTags.length - visibleTags.length;

  // Filter blocks
  const filteredBlocks = useMemo(() => {
    return allBlocks.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQ =
        !q ||
        b.displayName.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.skillTags.some((t) => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || b.skillTags.includes(selectedTag);

      return matchesQ && matchesTag;
    });
  }, [allBlocks, searchQuery, selectedTag]);

  // Group by category
  const categories: BlockCategory[] = [
    'pre-writing',
    'letters',
    'numbers',
    'thinking',
    'feelings',
    'world',
    'creative',
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-[#2D2200]/40 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 ${slim ? 'lg:w-42' : 'lg:w-84'} shrink-0 bg-[#FAF8F0] border-r border-[#E2DEC9] flex flex-col transition-[transform,width] duration-200 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className={`p-4 border-b border-[#E2DEC9] bg-white ${slim ? 'lg:p-3' : ''}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-extrabold text-[#2D2200] font-sans truncate">
              {slim ? (
                <>
                  <span className="lg:hidden">Activity Blocks</span>
                  <span className="hidden lg:inline">Blocks</span>
                </>
              ) : (
                'Activity Blocks'
              )}
            </h2>
            {onToggleSlim && (
              <button
                type="button"
                onClick={onToggleSlim}
                title={slim ? 'Show full block details' : 'Slim view: more room for your page'}
                aria-label={slim ? 'Show full block details' : 'Switch to slim view'}
                aria-pressed={slim}
                className="hidden lg:inline-flex p-1.5 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] rounded-lg transition-colors shrink-0"
              >
                {slim ? <PanelLeftOpen className="w-4.5 h-4.5" /> : <PanelLeftClose className="w-4.5 h-4.5" />}
              </button>
            )}
            <button
              onClick={onCloseMobile}
              title="Close the activity list"
              className="lg:hidden p-1.5 text-[#6B5838] hover:text-[#2D2200] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A39C8E]" />
            <input
              type="text"
              placeholder={slim ? 'Search' : 'Search activities or skills...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs font-medium text-[#2D2200] bg-[#FAF8F0] border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9] focus:bg-white transition-all placeholder:text-[#A39C8E]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="Clear the search"
                className="absolute right-2.5 top-2.5 text-[#A39C8E] hover:text-[#2D2200]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Skill Tag Filters */}
          <div
            className={`flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] ${showAllTags ? 'max-h-36 overflow-y-auto pr-1' : ''} ${hideWhenSlim}`}
            role="group"
            aria-label="Filter by skill"
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                selectedTag === null
                  ? 'bg-[#2D2200] text-white'
                  : 'bg-[#F2F2E2] text-[#6B5838] hover:text-[#2D2200]'
              }`}
            >
              All Skills
            </button>
            {visibleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-[#009BD9] text-white'
                    : 'bg-[#F2F2E2] text-[#6B5838] hover:text-[#2D2200]'
                }`}
              >
                {tag}
              </button>
            ))}
            {(hiddenCount > 0 || showAllTags) && (
              <button
                type="button"
                onClick={() => setShowAllTags(!showAllTags)}
                aria-expanded={showAllTags}
                className="px-2.5 py-1 rounded-md font-bold whitespace-nowrap text-[#2D2200] border border-dashed border-[#A39C8E] hover:border-[#2D2200] transition-colors"
              >
                {showAllTags ? 'Fewer' : `More skills (${hiddenCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Block List Grouped by Category */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 ${slim ? 'lg:p-3 lg:space-y-4' : ''}`}>
          <div className={`${hideWhenSlim} bg-[#FFF9E6] border border-[#F2B800]/30 rounded-xl p-3 text-xs text-[#6B5838] leading-relaxed`}>
            <span className="font-bold text-[#2D2200]">Tip: </span>
            Drag an activity onto the page, or tap <Plus className="inline w-3.5 h-3.5 text-[#2D2200]" /> to add it to the next empty space.
          </div>

          {categories.map((cat) => {
            const catBlocks = filteredBlocks.filter((b) => b.category === cat);
            if (catBlocks.length === 0) return null;

            return (
              <div key={cat} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5838]">
                    {slim ? (
                      <>
                        <span className="lg:hidden">{CATEGORY_LABELS[cat].label}</span>
                        <span className="hidden lg:inline">{CATEGORY_LABELS[cat].badge}</span>
                      </>
                    ) : (
                      CATEGORY_LABELS[cat].label
                    )}
                  </h3>
                  <span className="text-[11px] font-semibold tabular-nums text-[#6B5F45]">
                    {catBlocks.length}
                  </span>
                </div>

                <div className={`space-y-2 ${slim ? 'lg:space-y-1.5' : ''}`}>
                  {catBlocks.map((block) => (
                    <DraggableBlockCard
                      key={block.id}
                      block={block}
                      onAdd={onAddBlock}
                      slim={slim}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredBlocks.length === 0 && (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-sm font-bold text-[#2D2200]">No activities found</p>
              <p className="text-xs text-[#6B5838]">
                Try adjusting your search query or skill tag filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className="mt-2 text-xs font-bold text-[#2D2200] underline hover:text-[#009BD9]"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
