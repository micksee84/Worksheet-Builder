/**
 * @license
 * Sunshine Brigade Worksheet Builder - Auth context
 *
 * Passwordless sign-in. A grown-up types their email and we send one message with
 * both a 6-digit code and a sign-in link:
 * - The code works everywhere, including inside the embed on the Framer site and when
 *   the email is opened on a different device.
 * - The link is a shortcut when the email is opened in the same browser.
 *
 * The account holds the grown-up's email and their worksheets, private to them by
 * row-level security. Worksheets can contain typed words (for example a child's name
 * in Word tracing), so never log or share worksheet contents.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isAuthConfigured, supabase } from './supabaseClient';

interface AuthContextValue {
  /** False until the saved session has been checked, so the app never flashes the sign-in screen. */
  ready: boolean;
  /** Sign-in is switched on (Supabase keys are set). */
  enabled: boolean;
  user: User | null;
  session: Session | null;
  sendSignInEmail: (email: string) => Promise<{ error: string | null }>;
  verifyCode: (email: string, code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where the sign-in link brings people back to: this page, without any share hash. */
function redirectUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

/** Turns Supabase errors into short, friendly sentences. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('security purposes')) {
    return 'We just sent you an email. Please wait a minute before asking for another.';
  }
  if (m.includes('expired') || m.includes('invalid')) {
    return 'That code did not work. Check the newest email, or ask for a new code.';
  }
  if (m.includes('email')) {
    return 'That email address does not look quite right. Please check it.';
  }
  return 'Something went wrong on our side. Please try again in a moment.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(!isAuthConfigured);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setReady(true);
      // Tidy the ?code= left behind by a sign-in link.
      const params = new URLSearchParams(window.location.search);
      if (params.has('code')) {
        params.delete('code');
        const query = params.toString();
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
        );
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const sendSignInEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectUrl(), shouldCreateUser: true },
    });
    return { error: error ? friendlyError(error.message) : null };
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.replace(/\s/g, ''),
      type: 'email',
    });
    return { error: error ? friendlyError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      enabled: isAuthConfigured,
      user: session?.user ?? null,
      session,
      sendSignInEmail,
      verifyCode,
      signOut,
    }),
    [ready, session, sendSignInEmail, verifyCode, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
