/**
 * @license
 * Sunshine Brigade Worksheet Builder - Central Block Registry
 * 
 * TO ADD A NEW BLOCK:
 * 1. Create your block file in `/src/blocks/YourBlock.tsx` implementing `BlockDefinition`.
 * 2. Import it here and add it to the `REGISTERED_BLOCKS` array.
 * That's it! It will automatically appear in the library, drag-and-drop system,
 * settings inspector, and PDF exporter.
 */

import { BlockDefinition, BlockInstance, BlockCategory, BlockCharacterConfig } from '../types';
import { LineTracingBlockDefinition } from '../blocks/LineTracingBlock';
import { LetterTracingBlockDefinition } from '../blocks/LetterTracingBlock';
import { WordTracingBlockDefinition } from '../blocks/WordTracingBlock';
import { NumberTracingBlockDefinition } from '../blocks/NumberTracingBlock';
import { CountCircleBlockDefinition } from '../blocks/CountCircleBlock';
import { DrawWriteBlockDefinition } from '../blocks/DrawWriteBlock';

// Central list of all available block definitions
export const REGISTERED_BLOCKS: BlockDefinition[] = [
  LineTracingBlockDefinition,
  LetterTracingBlockDefinition,
  WordTracingBlockDefinition,
  NumberTracingBlockDefinition,
  CountCircleBlockDefinition,
  DrawWriteBlockDefinition,
];

// Helper lookups
const blockMap = new Map<string, BlockDefinition>();
REGISTERED_BLOCKS.forEach((block) => {
  blockMap.set(block.id, block);
});

export function getBlockById(id: string): BlockDefinition | undefined {
  return blockMap.get(id);
}

export function getAllBlocks(): BlockDefinition[] {
  return REGISTERED_BLOCKS;
}

export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return REGISTERED_BLOCKS.filter((block) => block.category === category);
}

export function searchBlocks(query: string, activeSkillTag?: string | null): BlockDefinition[] {
  const cleanQuery = query.toLowerCase().trim();

  return REGISTERED_BLOCKS.filter((block) => {
    // Check search query
    const matchesQuery =
      !cleanQuery ||
      block.displayName.toLowerCase().includes(cleanQuery) ||
      block.description.toLowerCase().includes(cleanQuery) ||
      block.skillTags.some((tag) => tag.toLowerCase().includes(cleanQuery));

    // Check skill tag filter
    const matchesTag =
      !activeSkillTag ||
      block.skillTags.some((tag) => tag.toLowerCase() === activeSkillTag.toLowerCase());

    return matchesQuery && matchesTag;
  });
}

/**
 * Creates a new BlockInstance with unique ID, default settings, and optional character badge
 */
export function createBlockInstance(
  blockId: string,
  customSettings?: Record<string, any>,
  character?: BlockCharacterConfig | null
): BlockInstance {
  const def = getBlockById(blockId);
  const defaultSettings = def ? { ...def.defaultSettings } : {};

  return {
    instanceId: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    blockId,
    settings: {
      ...defaultSettings,
      ...(customSettings || {}),
    },
    character: character !== undefined ? character : null,
  };
}
