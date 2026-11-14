/**
 * @license
 * Sunshine Brigade Worksheet Builder - Account sync hook
 *
 * Keeps the open worksheet saved to the signed-in account, a moment after each change.
 * The builder always starts on a blank page; earlier worksheets are in Open.
 */

import { useEffect, useRef, useState } from 'react';
import { Worksheet } from '../types';
import { useAuth } from './AuthProvider';
import {
  saveWorksheetToAccount,
} from '../utils/cloudWorksheets';

export type SyncStatus = 'off' | 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DELAY_MS = 1200;

const keyOf = (ws: Worksheet) => `${ws.id}:${ws.updatedAt}`;

interface Options {
  worksheet: Worksheet;
  /** True when the builder opened on a blank page (no share link, nothing open in this tab). */
  startedFresh: boolean;
  /** No longer used: the builder starts blank. */
  onOpenWorksheet?: (ws: Worksheet) => void;
}

export function useAccountSync({ worksheet, startedFresh }: Options) {
  const { enabled, user } = useAuth();
  const active = enabled && Boolean(user);

  const [status, setStatus] = useState<SyncStatus>(active ? 'idle' : 'off');
  const [hydrated, setHydrated] = useState(!active);
  const lastSavedKey = useRef<string | null>(null);
  // The blank page the builder opens with; never saved unless edited.
  const starterKey = useRef<string | null>(startedFresh ? keyOf(worksheet) : null);

  // Ready to save once signed in. The builder starts blank, so nothing is opened here.
  useEffect(() => {
    if (active) setHydrated(true);
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
