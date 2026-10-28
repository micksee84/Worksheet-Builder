/**
 * @license
 * Sunshine Brigade Worksheet Builder - Account sync hook
 *
 * Keeps the open worksheet saved to the signed-in account, a moment after each change.
 * On a new device (nothing saved in this browser and no share link), it opens the
 * grown-up's most recent worksheet from their account instead of the starter page.
 */

import { useEffect, useRef, useState } from 'react';
import { Worksheet } from '../types';
import { useAuth } from './AuthProvider';
import {
  listAccountWorksheets,
  loadAccountWorksheet,
  saveWorksheetToAccount,
} from '../utils/cloudWorksheets';

export type SyncStatus = 'off' | 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DELAY_MS = 1200;

const keyOf = (ws: Worksheet) => `${ws.id}:${ws.updatedAt}`;

interface Options {
  worksheet: Worksheet;
  /** True when the builder opened on the starter worksheet (nothing local, no share link). */
  startedFresh: boolean;
  /** Called to open a worksheet from the account. */
  onOpenWorksheet: (ws: Worksheet) => void;
}

export function useAccountSync({ worksheet, startedFresh, onOpenWorksheet }: Options) {
  const { enabled, user } = useAuth();
  const active = enabled && Boolean(user);

  const [status, setStatus] = useState<SyncStatus>(active ? 'idle' : 'off');
  const [hydrated, setHydrated] = useState(!active);
  const lastSavedKey = useRef<string | null>(null);
  // The starter worksheet a fresh device opens with; never saved unless edited.
  const starterKey = useRef<string | null>(startedFresh ? keyOf(worksheet) : null);
  const openRef = useRef(onOpenWorksheet);
  openRef.current = onOpenWorksheet;

  // First load: on a fresh device, open the latest worksheet from the account.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      if (startedFresh) {
        const list = await listAccountWorksheets();
        if (!cancelled && list && list.length > 0) {
          const latest = await loadAccountWorksheet(list[0].id);
          if (!cancelled && latest) {
            lastSavedKey.current = keyOf(latest);
            openRef.current(latest);
          }
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per signed-in session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Save a moment after each change.
  useEffect(() => {
    if (!active || !hydrated) return;
    const key = keyOf(worksheet);
    if (key === lastSavedKey.current || key === starterKey.current) return;

    const timer = setTimeout(async () => {
      setStatus('saving');
      const ok = await saveWorksheetToAccount(worksheet);
      if (ok) lastSavedKey.current = key;
      setStatus(ok ? 'saved' : 'error');
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [worksheet, active, hydrated]);

  /** Mark a worksheet as already saved (after opening it from the account). */
  const markSaved = (ws: Worksheet) => {
    lastSavedKey.current = keyOf(ws);
    setStatus('saved');
  };

  /** Save right away, for example before switching to another worksheet. */
  const saveNow = async () => {
    if (!active) return;
    const key = keyOf(worksheet);
    if (key === lastSavedKey.current || key === starterKey.current) return;
    setStatus('saving');
    const ok = await saveWorksheetToAccount(worksheet);
    if (ok) lastSavedKey.current = key;
    setStatus(ok ? 'saved' : 'error');
  };

  return { status, active, markSaved, saveNow };
}
