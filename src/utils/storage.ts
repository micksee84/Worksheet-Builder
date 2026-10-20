/**
 * @license
 * Sunshine Brigade Worksheet Builder - Storage Utility
 * Safe localStorage wrapper that handles private browsing / quota errors gracefully.
 * Saved work is stored with a schema version and validated on load, so an old or
 * damaged save falls back to a fresh worksheet instead of crashing the app.
 */

import { Worksheet } from '../types';
import { validateWorksheet, WORKSHEET_SCHEMA_VERSION } from './validateWorksheet';

const STORAGE_KEY = 'sunshine_brigade_current_worksheet_v1';

interface StoredWorksheet {
  version: number;
  worksheet: Worksheet;
}

export function saveWorksheetToStorage(worksheet: Worksheet): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const payload: StoredWorksheet = { version: WORKSHEET_SCHEMA_VERSION, worksheet };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[SunshineBrigade] Could not save to localStorage:', err);
    return false;
  }
}

export function loadWorksheetFromStorage(): Worksheet | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[SunshineBrigade] Could not clear localStorage:', err);
  }
}
