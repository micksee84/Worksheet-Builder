/**
 * @license
 * Sunshine Brigade Worksheet Builder - Saved worksheets (Save and Open)
 *
 * One place for saving, listing, opening and deleting worksheets, whichever store is in use:
 *   - 'account': the signed-in grown-up's account (Supabase, see cloudWorksheets.ts).
 *     This is the normal case on the website, where the builder asks people to sign in.
 *   - 'browser': this browser only (localStorage). Used when sign-in is switched off,
 *     for example in a local preview, so Save and Open still work.
 *
 * Saving is free and unlimited for everyone. Only printing and exporting will count
 * toward the free monthly pages.
 */

import { Worksheet } from '../types';
import { validateWorksheet, WORKSHEET_SCHEMA_VERSION } from './validateWorksheet';
import {
  SavedWorksheetSummary,
  deleteAccountWorksheet,
  listAccountWorksheets,
  loadAccountWorksheet,
  saveWorksheetToAccount,
} from './cloudWorksheets';

export type LibrarySource = 'account' | 'browser';
export type { SavedWorksheetSummary };

/** Names a worksheet starts with. A worksheet still called one of these gets asked for a name on its first Save. */
const STARTER_TITLES = new Set(['', 'sunshine learning fun', 'my worksheet', 'untitled worksheet']);
export const isUnnamed = (ws: Worksheet) => STARTER_TITLES.has((ws.title || '').trim().toLowerCase());

// ---------------------------------------------------------------- Browser store

const LIBRARY_KEY = 'sunshine_brigade_library_v1';

type BrowserLibrary = Record<string, { version: number; worksheet: Worksheet }>;

function readBrowser(): BrowserLibrary {
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeBrowser(lib: BrowserLibrary): boolean {
  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
    return true;
  } catch (err) {
    console.warn('[SunshineBrigade] Could not save in this browser:', err);
    return false;
  }
}

/** True when this worksheet has been saved to the browser library (so later edits keep it up to date). */
export function isInBrowserLibrary(id: string): boolean {
  return id in readBrowser();
}

// ---------------------------------------------------------------- Shared API

export async function saveToLibrary(source: LibrarySource, ws: Worksheet): Promise<boolean> {
  if (source === 'account') return saveWorksheetToAccount(ws);
  const lib = readBrowser();
  lib[ws.id] = { version: WORKSHEET_SCHEMA_VERSION, worksheet: ws };
  return writeBrowser(lib);
}

export async function listLibrary(source: LibrarySource): Promise<SavedWorksheetSummary[] | null> {
  if (source === 'account') return listAccountWorksheets();
  return Object.values(readBrowser())
    .map(({ worksheet: w }) => ({
      id: w.id,
      title: (w.title || '').trim() || 'My worksheet',
      pageCount: Array.isArray(w.pages) ? w.pages.length : 1,
      updatedAt: w.updatedAt || 0,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadFromLibrary(source: LibrarySource, id: string): Promise<Worksheet | null> {
  if (source === 'account') return loadAccountWorksheet(id);
  const entry = readBrowser()[id];
  return entry ? validateWorksheet(entry.worksheet) : null;
}

export async function deleteFromLibrary(source: LibrarySource, id: string): Promise<boolean> {
  if (source === 'account') return deleteAccountWorksheet(id);
  const lib = readBrowser();
  delete lib[id];
  return writeBrowser(lib);
}
