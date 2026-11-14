/**
 * @license
 * Sunshine Brigade Worksheet Builder - Block Settings Inspector Panel
 * Dynamically generated from the block definition's settingsSchema.
 * Docked beside the canvas (a bottom sheet on phones) so the page stays in view while editing.
 * Also provides Character badge selection (Buddy, Finn, Ollie, Faye, Rusty, Hana)
 * and corner placement.
 */

import React, { useEffect, useRef } from 'react';
import { BlockInstance, BlockDefinition, CharacterCorner, Slot } from '../types';
import { CHARACTERS, CharacterId, FEATURES, assetUrl } from '../config/appConfig';
import { X, Trash2, Settings, Smile } from './icons';

interface BlockSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  pageId: string | null;
  blockDef: BlockDefinition | null;
  instance: BlockInstance | null;
  onUpdateSettings: (newSettings: Record<string, any>) => void;
  onUpdateCharacter: (character: { id: CharacterId; corner: CharacterCorner } | null) => void;
  onRemoveBlock: () => void;
  /** Slim the block list while editing on smaller screens (desktop only). */
  autoSlim?: boolean;
  onToggleAutoSlim?: (on: boolean) => void;
}

export const BlockSettingsDrawer: React.FC<BlockSettingsDrawerProps> = ({
  isOpen,
  onClose,
  slot,
  blockDef,
  instance,
  onUpdateSettings,
  onUpdateCharacter,
  onRemoveBlock,
  autoSlim,
  onToggleAutoSlim,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = Boolean(isOpen && slot && blockDef && instance);

  // Close by clicking or tapping anywhere outside the panel (the page, the canvas, the
  // sidebar), or by pressing Escape, as well as with Done or the X. Settings save as you
  // change them, so closing never loses anything. Clicking a placed block is the one
  // exception: that keeps the panel open and shows that block's settings instead.
  useEffect(() => {
    if (!visible) return;
    const onPointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      const target = e.target as Element | null;
      if (!panel || !target || panel.contains(target)) return;
      if (target.closest?.('[data-opens-settings]')) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, onClose]);

  if (!isOpen || !slot || !blockDef || !instance) return null;

  const currentSettings = instance.settings;
  const currentCharacter = instance.character;

  const handleFieldChange = (key: string, value: any) => {
    onUpdateSettings({
      ...currentSettings,
      [key]: value,
    });
  };

  const handleCharacterSelect = (charId: CharacterId | 'none') => {
    if (charId === 'none') {
      onUpdateCharacter(null);
    } else {
      const corner = currentCharacter?.corner || 'top-right';
      onUpdateCharacter({ id: charId, corner });
    }
  };

  const handleCornerSelect = (corner: CharacterCorner) => {
    if (!currentCharacter) {
      onUpdateCharacter({ id: 'buddy', corner });
    } else {
      onUpdateCharacter({ id: currentCharacter.id, corner });
    }
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${blockDef.displayName} settings`}
      // Never covers the page. From tablet width up it is its own column beside the
      // canvas, so the canvas narrows and the page re-fits next to it; every change shows
      // straight away. On phones it is a sheet over the bottom half, with the page above.
      className="fixed inset-x-0 bottom-0 z-50 max-h-[55vh] rounded-t-2xl border-t shadow-2xl md:static md:inset-auto md:z-auto md:max-h-none md:h-full md:w-[340px] lg:w-[360px] md:flex-none md:rounded-none md:border-t-0 md:border-l md:shadow-none bg-white border-[#E2DEC9] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DEC9] bg-[#FAF8F0]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B5F45]">
            {blockDef.category} • {slot.size} Slot
          </span>
          <h2 className="text-xl font-extrabold text-[#2D2200] font-sans">
            {blockDef.displayName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] rounded-lg transition-colors"
          title="Close inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body: Schema Fields */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-[#6B5838] leading-relaxed">
            {blockDef.description}
          </p>
        </div>

        {/* Dynamic Fields from settingsSchema */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5838] flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            Activity Settings
          </h3>

          {blockDef.settingsSchema.map((field) => {
            const val = currentSettings[field.key] ?? blockDef.defaultSettings[field.key];
            if (field.showWhen) {
              const other = currentSettings[field.showWhen.key] ?? blockDef.defaultSettings[field.showWhen.key];
              if (String(other) !== String(field.showWhen.value)) return null;
            }

            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#2D2200]">
                    {field.label}
                  </label>
                  {field.type === 'number' && (
                    <span className="text-xs font-bold tabular-nums text-[#2D2200] bg-[#FAF8F0] px-2 py-0.5 rounded-full">
                      {val}
                    </span>
                  )}
                </div>

                {field.helperText && (
                  <p className="text-xs text-[#6B5838]">{field.helperText}</p>
                )}

                {/* TEXT INPUT */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={val || ''}
                    placeholder={field.placeholder}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-medium text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9] focus:border-transparent transition-all"
                  />
                )}

                {/* NUMBER INPUT */}
                {field.type === 'number' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={field.min ?? 1}
                      max={field.max ?? 10}
                      step={field.step ?? 1}
                      value={val}
                      onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                      className="flex-1 accent-[#009BD9] h-2 bg-[#F2F2E2] rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      min={field.min ?? 1}
                      max={field.max ?? 10}
                      value={val}
                      onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                      className="w-16 px-2.5 py-1.5 text-sm font-bold text-center border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9]"
                    />
                  </div>
                )}

                {/* SELECT DROPDOWN */}
                {field.type === 'select' && (
                  <select
                    value={val}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-medium text-[#2D2200] bg-white border border-[#E2DEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009BD9] transition-all cursor-pointer"
                  >
                    {field.options?.map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* BOOLEAN TOGGLE */}
                {field.type === 'boolean' && (
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      className="w-4 h-4 rounded text-[#009BD9] focus:ring-[#009BD9] border-[#C4BEB0]"
                    />
                    <span className="text-sm text-[#2D2200] font-medium">Enable feature</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Character Corner Customizer (switched off in FEATURES for now) */}
        {FEATURES.cornerCharacters && (
        <div className="pt-4 border-t border-[#E2DEC9] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5838] flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-[#E52311]" />
              Corner Character
            </h3>
            {currentCharacter && (
              <button
                onClick={() => handleCharacterSelect('none')}
                className="text-xs text-[#E52311] hover:underline font-semibold"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-xs text-[#6B5838]">
            Add a friendly Sunshine Brigade mascot to encourage the child:
          </p>

          {/* Character Avatars */}
          <div className="grid grid-cols-4 gap-2.5">
            {CHARACTERS.map((char) => {
              const isSelected = currentCharacter?.id === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleCharacterSelect(char.id)}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1 text-center transition-all ${
                    isSelected
                      ? 'bg-[#FAF8F0] border-2 border-[#009BD9] shadow-sm scale-105'
                      : 'border border-[#E2DEC9] hover:bg-[#FAF8F0]'
                  }`}
                >
                  <img
                    src={assetUrl(`characters/${char.id}.svg`)}
                    alt={char.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[11px] font-bold text-[#2D2200] truncate w-full">
                    {char.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Corner Placement */}
          {currentCharacter && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#2D2200]">Corner Position</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {[
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => handleCornerSelect(pos.id as CharacterCorner)}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      currentCharacter.corner === pos.id
                        ? 'bg-[#009BD9] text-white border-[#009BD9]'
                        : 'border-[#E2DEC9] text-[#2D2200] hover:bg-[#FAF8F0]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Room to work: slim the block list while editing on smaller screens */}
      {onToggleAutoSlim && (
        <label className="hidden lg:flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E2DEC9] cursor-pointer select-none">
          <span className="text-xs text-[#2D2200]">
            <span className="block font-bold">Slim the block list while editing</span>
            <span className="block text-[11px] text-[#6B5F45]">Only on smaller screens, to keep the page in view</span>
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              role="switch"
              checked={!!autoSlim}
              onChange={(e) => onToggleAutoSlim(e.target.checked)}
              className="peer sr-only"
            />
            <span className="w-9 h-5 rounded-full border-[1.5px] border-[#2D2200] bg-white peer-checked:bg-[#F2B800] transition-colors peer-focus-visible:outline-[3px] peer-focus-visible:outline-[#009BD9] peer-focus-visible:outline-offset-2" />
            <span className="absolute top-[3px] left-[3px] w-[14px] h-[14px] rounded-full bg-[#2D2200] transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      )}

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E2DEC9] bg-[#FAF8F0] flex items-center justify-between gap-3">
        <button
          onClick={onRemoveBlock}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#E52311] hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Block
        </button>

        <button
          onClick={onClose}
          className="px-5 py-2 text-xs font-bold text-white bg-[#2D2200] hover:bg-[#F2B800] hover:text-[#2D2200] rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
