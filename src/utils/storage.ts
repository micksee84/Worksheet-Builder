/**
 * @license
 * Sunshine Brigade Worksheet Builder - Storage Utility
 * Keeps the open worksheet for this browser tab (sessionStorage), so a refresh carries on
 * where you were, while every new start of the builder opens on a blank page. Saved
 * worksheets live in the library (Open), not here. Handles private browsing / quota
 * errors gracefully.
 * Saved work is stored with a schema version and validated on load, so an old or
 * damaged save falls back to a fresh worksheet instead of crashing the app.
 */

import { Worksheet } from '../types';
import { validateWorksheet, WORKSHEET_SCHEMA_VERSION } from './validateWorksheet';

const STORAGE_KEY = 'sunshine_brigade_current_worksheet_v1';

/** This tab's store. Earlier versions kept the open worksheet in localStorage. */
const store = (): Storage | null => (typeof window === 'undefined' ? null : window.sessionStorage ?? null);

// The old always-restore copy is no longer read; drop it so it doesn't linger.
try {
  if (typeof window !== 'undefined') window.localStorage?.removeItem(STORAGE_KEY);
} catch {
  /* private browsing */
}

interface StoredWorksheet {
  version: number;
  worksheet: Worksheet;
}

export function saveWorksheetToStorage(worksheet: Worksheet): boolean {
  try {
    const s = store();
    if (!s) return false;
    const payload: StoredWorksheet = { version: WORKSHEET_SCHEMA_VERSION, worksheet };
    s.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[SunshineBrigade] Could not save to localStorage:', err);
    return false;
  }
}

export function loadWorksheetFromStorage(): Worksheet | null {
  try {
    const s = store();
    if (!s) return null;
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Current format: { version, worksheet }. Older saves stored the worksheet directly.
    const candidate =
      parsed && typeof parsed === 'object' && 'version' in parsed && 'worksheet' in parsed
        ? parsed.worksheet
        : parsed;

    const worksheet = validateWorksheet(candidate);
    if (!worksheet) {
      console.warn('[SunshineBrigade] Saved worksheet was unreadable, starting fresh.');
      clearWorksheetStorage();
    }
    return worksheet;
  } catch (err) {
    console.warn('[SunshineBrigade] Could not load from localStorage:', err);
    clearWorksheetStorage();
    return null;
  }
}

export function clearWorksheetStorage(): void {
  try {
    store()?.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[SunshineBrigade] Could not clear localStorage:', err);
  }
}
