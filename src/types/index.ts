/**
 * @license
 * Sunshine Brigade Worksheet Builder - Type Definitions
 */

import React from 'react';
import { PageSizeId, CharacterId } from '../config/appConfig';
export type { PageSizeId, CharacterId };

export type BlockCategory = 'pre-writing' | 'letters' | 'numbers' | 'creative';

export type BlockSize = 'full' | 'half' | 'quarter';

export type PageLayoutPreset =
  | '1-full'
  | '2-half'
  | '4-quarter'
  | 'top-half-2-quarter'
  | '2-quarter-bottom-half';

export interface SettingsFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface SettingsFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'slider';
  options?: SettingsFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  placeholder?: string;
}

export type CharacterCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface BlockCharacterConfig {
  id: CharacterId;
  corner: CharacterCorner;
}

export interface BlockInstance {
  instanceId: string;
  blockId: string; // References BlockDefinition.id
  settings: Record<string, any>;
  character?: BlockCharacterConfig | null;
}

export interface BlockRenderProps {
  instance: BlockInstance;
  size: BlockSize;
  width: number; // Viewport width in SVG units
  height: number; // Viewport height in SVG units
  isSelected?: boolean;
}

export interface BlockDefinition {
  id: string;
  displayName: string;
  description: string;
  category: BlockCategory;
  skillTags: string[];
  ageRange: string; // e.g. "3-5", "3-4", "4-5"
  allowedSizes: BlockSize[];
  settingsSchema: SettingsFieldSchema[];
  defaultSettings: Record<string, any>;
  render: (props: BlockRenderProps) => React.ReactNode;
}

export interface Slot {
  id: string;
  size: BlockSize;
  label: string; // e.g. "Top Half", "Bottom Left"
  block: BlockInstance | null;
}

export interface Page {
  id: string;
  title: string;
  layout: PageLayoutPreset;
  slots: Slot[];
  showDateName: boolean;
}

export interface Worksheet {
  id: string;
  title: string;
  pageSize: PageSizeId;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

// Drag & drop item types
export interface DraggedLibraryBlock {
  type: 'library-block';
  blockId: string;
}

export interface DraggedSlotBlock {
  type: 'slot-block';
  sourceSlotId: string;
  sourcePageId: string;
  block: BlockInstance;
}

export type DragPayload = DraggedLibraryBlock | DraggedSlotBlock;
