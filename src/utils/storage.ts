/**
 * @license
 * Sunshine Brigade Worksheet Builder - Storage Utility
 * Safe localStorage wrapper that handles private browsing / quota errors gracefully.
 */

import { Worksheet } from '../types';

const STORAGE_KEY = 'sunshine_brigade_current_worksheet_v1';

export function saveWorksheetToStorage(worksheet: Worksheet): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const serialized = JSON.stringify(worksheet);
    window.localStorage.setItem(STORAGE_KEY, serialized);
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
    return JSON.parse(raw) as Worksheet;
  } catch (err) {
    console.warn('[SunshineBrigade] Could not load from localStorage:', err);
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
