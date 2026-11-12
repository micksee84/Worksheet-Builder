/**
 * @license
 * Sunshine Brigade Worksheet Builder - Top Bar
 *
 * Grouped the way most design tools are:
 *   Left  (working on the file): logo | New, Open, Save, Templates · worksheet name | Undo, Redo
 *   Right (sending it out):      Share, Print / PDF (the one main button), account
 * Paper size lives with the page, in the canvas toolbar beside the slot layouts.
 * Below tablet width, New, Open, Save and Templates fold into one File menu.
 */

import React, { useState } from 'react';
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
  Pencil,
  ChevronDown,
  FilePlus2,
} from './icons';
import type { SyncStatus } from '../auth/useAccountSync';

export interface TopBarAccount {
  email: string;
  syncStatus: SyncStatus;
  onSignOut: () => void;
}

/** What the Save button shows: not saved yet, saving now, saved, or a problem. */
export type SaveState = 'unsaved' | 'saving' | 'saved' | 'error';

interface TopBarProps {
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
  onNew: () => void;
  /** The worksheet's name, or null while it still has a starter name. */
  worksheetName: string | null;
  onRename: () => void;
}

// Brand header style: pill buttons and groups (see the "Top bar" block in index.css)
const groupClass = 'tb-group';
const itemClass = 'tb-item';

const SaveIcon: React.FC<{ state: SaveState; className?: string }> = ({ state, className = 'w-3.5 h-3.5' }) =>
  state === 'saved' ? (
    <Check className={className} aria-hidden="true" />
  ) : state === 'error' ? (
    <CloudOff className={`${className} text-[#E52311]`} aria-hidden="true" />
  ) : (
    <Save className={`${className} ${state === 'saving' ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
  );

export const TopBar: React.FC<TopBarProps> = ({
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
  onNew,
  worksheetName,
  onRename,
}) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const handleCopy = () => {
    onCopyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <header className="h-[60px] bg-white border-b-[3px] border-[#2D2200] px-3 min-[480px]:px-4 md:px-6 flex items-center justify-between gap-2 min-[480px]:gap-3 shrink-0 relative z-30 select-none">
      {/* ---------------- Left: brand, then working on the file */}
      <div className="flex items-center gap-2 min-[480px]:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden tb-btn tb-btn-icon"
          title="Show or hide the activities"
          aria-label="Show or hide the activities"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Brand: name in Nunito (the builder uses Nunito throughout). No sun icon. */}
        <h1 className="m-0 flex items-center gap-3 shrink-0 font-normal">
          <a
            href="https://sunshinebrigade.ca"
            className="tb-wordmark whitespace-nowrap text-[15px] min-[480px]:text-[16px] sm:text-[18px] no-underline hover:text-[#009BD9] focus-visible:outline-[3px] focus-visible:outline-[#009BD9] focus-visible:outline-offset-4 rounded"
            title="Go to sunshinebrigade.ca"
          >
            Sunshine Brigade
          </a>
          <span className="hidden xl:block w-[1.5px] h-5 bg-[#2D2200]/25" aria-hidden="true" />
          <span className="hidden xl:block tb-appname whitespace-nowrap text-[18px] select-none">
            Worksheet builder
          </span>
        </h1>

        <span className="hidden sm:block w-[1.5px] h-7 bg-[#2D2200]/25 shrink-0" aria-hidden="true" />

        {/* File: New, Open, Save, Templates (tablet and up) */}
        <div className={`${groupClass} hidden md:flex shrink-0`} role="group" aria-label="Worksheet">
          <button type="button" onClick={onNew} className={itemClass} title="Start a new, blank worksheet">
            <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
            New
          </button>
          <button type="button" onClick={onOpen} className={itemClass} title="Open a saved worksheet or start a new one">
            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Open
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveState === 'saving'}
            title={SAVE_TITLE[saveState]}
            className={`${itemClass} disabled:cursor-default`}
          >
            <SaveIcon state={saveState} />
            <span aria-live="polite">{SAVE_LABEL[saveState]}</span>
          </button>
          <button type="button" onClick={onOpenTemplates} className={itemClass} title="Start from a ready-made worksheet">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Templates
          </button>
        </div>

        {/* File menu (phones) */}
        <div className="relative md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setShowFileMenu(!showFileMenu)}
            aria-haspopup="menu"
            aria-expanded={showFileMenu}
            aria-label="File menu"
            className="tb-btn"
            title={SAVE_TITLE[saveState]}
          >
            <SaveIcon state={saveState} />
            <span className="hidden min-[480px]:inline">File</span>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {showFileMenu && (
            <div
              role="menu"
              className="tb-menu left-0 w-56"
              onMouseLeave={() => setShowFileMenu(false)}
            >
              {[
                { label: 'New', Icon: FilePlus2, run: onNew },
                { label: 'Open', Icon: FolderOpen, run: onOpen },
                { label: SAVE_LABEL[saveState], Icon: Save, run: onSave },
                { label: 'Rename', Icon: Pencil, run: onRename },
                { label: 'Templates', Icon: BookOpen, run: onOpenTemplates },
                { label: 'Copy share link', Icon: Share2, run: onCopyShareLink },
              ].map(({ label, Icon, run }) => (
                <button
                  key={label}
                  role="menuitem"
                  onClick={() => {
                    setShowFileMenu(false);
                    run();
                  }}
                  className="tb-menu-item"
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Which worksheet this is; click to rename */}
        <button
          type="button"
          onClick={onRename}
          title="Rename this worksheet"
          className="hidden lg:flex tb-name group"
        >
          <span className={`truncate ${worksheetName ? 'font-bold text-[#2D2200]' : 'font-semibold text-[#6B5F45]'}`}>
            {worksheetName ?? 'Untitled worksheet'}
          </span>
          <Pencil className="w-3.5 h-3.5 text-[#6B5F45] opacity-0 group-hover:opacity-100 shrink-0" aria-hidden="true" />
        </button>

        {/* Edit: Undo, Redo */}
        <div className={`${groupClass} hidden sm:flex shrink-0`} role="group" aria-label="Undo and redo">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="tb-item tb-item-icon"
            title="Undo the last change"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="tb-item tb-item-icon"
            title="Redo the change you undid"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ---------------- Right: sending it out */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopy}
          className="tb-btn hidden sm:inline-flex"
          title="Copy a link to this worksheet"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">Link copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" aria-hidden="true" />
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
            aria-haspopup="menu"
            aria-expanded={showExportMenu}
            className="tb-btn tb-btn-highlight"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>{isExportingPdf ? 'Exporting...' : <>Print<span className="hidden min-[480px]:inline"> / PDF</span></>}</span>
          </button>

          {showExportMenu && (
            <div
              role="menu"
              className="tb-menu right-0 w-60"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onDownloadPdf();
                }}
                className="tb-menu-item"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <div>
                  <div>Download a PDF</div>
                  <div className="tb-menu-note">Sharp lines, ready to print or share</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onPrintNative();
                }}
                className="tb-menu-item"
              >
                <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
                <div>
                  <div>Print now</div>
                  <div className="tb-menu-note">Opens your browser's print window</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Account: who is signed in, sign out */}
        {account && <AccountMenu account={account} />}
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
        className="tb-btn tb-btn-icon"
      >
        <UserRound className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="tb-menu right-0 w-64"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 flex items-center gap-2 text-sm font-semibold text-[#6B5F45]">
            <SyncIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{account.email}</span>
          </div>
          <p className="px-3 pb-2 mb-1 tb-menu-note border-b-[1.5px] border-[#DDD9C4]">
            {SYNC_LABEL[syncStatus]}
          </p>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              account.onSignOut();
            }}
            className="tb-menu-item"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
