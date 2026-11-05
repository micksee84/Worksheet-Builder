/**
 * @license
 * Sunshine Brigade Worksheet Builder - Top Bar
 * Controls:
 * - Worksheet Title (editable)
 * - Page Size Switch (US Letter / A4)
 * - Save (names the worksheet the first time) and Open (saved worksheets)
 * - Undo / Redo
 * - Templates Gallery button
 * - Share Link copy
 * - Print & Download PDF
 */

import React, { useState } from 'react';
import { PageSizeId } from '../config/appConfig';
import {
  Printer,
  Download,
  Share2,
  Undo2,
  Redo2,
  BookOpen,
  Menu,
  Check,
  FolderOpen,
  Cloud,
  CloudOff,
  LogOut,
  UserRound,
  Save,
} from 'lucide-react';
import type { SyncStatus } from '../auth/useAccountSync';

export interface TopBarAccount {
  email: string;
  syncStatus: SyncStatus;
  onSignOut: () => void;
}

/** What the Save button shows: not saved yet, saving now, saved, or a problem. */
export type SaveState = 'unsaved' | 'saving' | 'saved' | 'error';

interface TopBarProps {
  pageSize: PageSizeId;
  onTogglePageSize: (size: PageSizeId) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTemplates: () => void;
  onCopyShareLink: () => void;
  onDownloadPdf: () => void;
  onPrintNative: () => void;
  onToggleMobileSidebar: () => void;
  isExportingPdf: boolean;
  /** Present when a grown-up is signed in. */
  account?: TopBarAccount | null;
  saveState: SaveState;
  onSave: () => void;
  onOpen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageSize,
  onTogglePageSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenTemplates,
  onCopyShareLink,
  onDownloadPdf,
  onPrintNative,
  onToggleMobileSidebar,
  isExportingPdf,
  account,
  saveState,
  onSave,
  onOpen,
}) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleCopy = () => {
    onCopyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2DEC9] px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 relative z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg"
          title="Show or hide the activities"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Lockup */}
        <h1 className="m-0 flex items-center gap-3 shrink-0 font-normal">
          <picture className="shrink-0">
            <source media="(min-width: 640px)" srcSet={`${import.meta.env.BASE_URL}sb-logo-header.svg`} />
            <img
              src={`${import.meta.env.BASE_URL}sb-logo-icon.svg`}
              alt="Sunshine Brigade"
              draggable={false}
              className="h-8 sm:h-[31px] w-auto select-none"
              loading="eager"
            />
          </picture>
          <span className="hidden lg:block w-[1.5px] h-6 bg-[#2D2200]/20" aria-hidden="true" />
          {/* App name: plain Super Joyful in ink, no sticker outline or shadow (never under 24px) */}
          <span className="hidden lg:block font-joyful font-normal text-[24px] leading-none text-[#2D2200] whitespace-nowrap select-none">
            Worksheet builder
          </span>
        </h1>
      </div>

      {/* Middle & Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9]">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30 rounded transition-colors"
            title="Undo the last change"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-[#6B5838] hover:text-[#2D2200] disabled:opacity-30 rounded transition-colors"
            title="Redo the change you undid"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Page Size Segmented Toggle */}
        <div className="hidden sm:flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9] text-xs font-bold text-[#6B5838]">
          <button
            type="button"
            onClick={() => onTogglePageSize('letter')}
            title="Use US Letter paper (8.5 × 11 in)"
            className={`px-2.5 py-1 rounded-md transition-all ${
              pageSize === 'letter'
                ? 'bg-white text-[#2D2200] shadow-xs'
                : 'hover:text-[#2D2200]'
            }`}
          >
            Letter
          </button>
          <button
            type="button"
            onClick={() => onTogglePageSize('a4')}
            title="Use A4 paper (210 × 297 mm)"
            className={`px-2.5 py-1 rounded-md transition-all ${
              pageSize === 'a4'
                ? 'bg-white text-[#2D2200] shadow-xs'
                : 'hover:text-[#2D2200]'
            }`}
          >
            A4
          </button>
        </div>

        {/* Open and Save */}
        <div className="flex items-center bg-[#FAF8F0] p-1 rounded-lg border border-[#E2DEC9]">
          <button
            type="button"
            onClick={onOpen}
            title="Open a saved worksheet or start a new one"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#2D2200] hover:bg-white rounded-md transition-colors whitespace-nowrap"
          >
            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Open</span>
            <span className="sr-only md:hidden">Open</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveState === 'saving'}
            title={SAVE_TITLE[saveState]}
            aria-live="polite"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#2D2200] hover:bg-white rounded-md transition-colors whitespace-nowrap disabled:cursor-default"
          >
            {saveState === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            ) : saveState === 'error' ? (
              <CloudOff className="w-3.5 h-3.5 text-[#E52311]" aria-hidden="true" />
            ) : (
              <Save className={`w-3.5 h-3.5 ${saveState === 'saving' ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
            )}
            <span className="hidden md:inline">{SAVE_LABEL[saveState]}</span>
            <span className="sr-only md:hidden">{SAVE_LABEL[saveState]}</span>
          </button>
        </div>

        {/* Account: who is signed in, sign out */}
        {account && <AccountMenu account={account} />}

        {/* Templates Gallery Button */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2D2200] bg-[#FAF8F0] hover:bg-[#F2F2E2] border border-[#E2DEC9] rounded-lg transition-colors whitespace-nowrap"
          title="Start from a ready-made worksheet"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#2D2200]" />
          <span className="hidden md:inline">Templates</span>
        </button>

        {/* Share Link Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2D2200] bg-[#FAF8F0] hover:bg-[#F2F2E2] border border-[#E2DEC9] rounded-lg transition-colors whitespace-nowrap"
          title="Copy a link to this worksheet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 hidden md:inline">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#6B5838]" />
              <span className="hidden md:inline">Share</span>
            </>
          )}
        </button>

        {/* Primary Action: Print / PDF Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExportingPdf}
            title="Download a PDF or print your worksheet"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-[#2D2200] bg-[#F2B800] hover:bg-[#e0ab00] rounded-lg shadow-xs transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#2D2200]" />
            <span>{isExportingPdf ? 'Exporting...' : 'Print / PDF'}</span>
          </button>

          {/* Export Dropdown Popover */}
          {showExportMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E2DEC9] p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-1"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onDownloadPdf();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg text-left transition-colors"
              >
                <Download className="w-4 h-4 text-[#2D2200]" />
                <div>
                  <div>Download Vector PDF</div>
                  <div className="text-[10px] text-[#6B5838] font-normal">
                    Sharp client-side PDF file
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onPrintNative();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg text-left transition-colors"
              >
                <Printer className="w-4 h-4 text-[#2D2200]" />
                <div>
                  <div>Browser Print Dialog</div>
                  <div className="text-[10px] text-[#6B5838] font-normal">
                    Direct print to paper or PDF
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const SAVE_LABEL: Record<SaveState, string> = {
  unsaved: 'Save',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Save again',
};

const SAVE_TITLE: Record<SaveState, string> = {
  unsaved: 'Save this worksheet so you can open it again (Ctrl or Cmd + S)',
  saving: 'Saving your worksheet',
  saved: 'Saved. Changes keep saving on their own.',
  error: "Couldn't save just now. Check your connection and click to try again.",
};

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: '',
  idle: 'Saved to your account',
  saving: 'Saving...',
  saved: 'Saved to your account',
  error: 'Not saved yet. It will try again on your next change.',
};

const AccountMenu: React.FC<{ account: TopBarAccount }> = ({ account }) => {
  const [open, setOpen] = useState(false);
  const { syncStatus } = account;
  const SyncIcon = syncStatus === 'error' ? CloudOff : Cloud;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Signed in as ${account.email}`}
        aria-label="Your account"
        className="flex items-center gap-1.5 p-2 text-[#2D2200] bg-[#FAF8F0] hover:bg-[#F2F2E2] border border-[#E2DEC9] rounded-lg transition-colors"
      >
        <UserRound className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E2DEC9] p-2 z-50 space-y-1"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 flex items-center gap-2 text-xs text-[#6B5838]">
            <SyncIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{account.email}</span>
          </div>
          <p className="px-3 pb-2 text-[11px] text-[#6B5838] border-b border-[#E2DEC9]">
            {SYNC_LABEL[syncStatus]}
          </p>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              account.onSignOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#2D2200] hover:bg-[#FAF8F0] rounded-lg text-left transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
