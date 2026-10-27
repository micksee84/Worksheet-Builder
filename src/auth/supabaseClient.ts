/**
 * @license
 * Sunshine Brigade Worksheet Builder - Supabase client
 *
 * Accounts and saved worksheets live in Supabase. The URL and publishable (anon) key
 * are safe to ship in the browser: row-level security in the database is what keeps
 * each family's worksheets private (see supabase/migrations/001_worksheets.sql).
 *
 * Set them in a `.env.local` file before building:
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-publishable-key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once the Supabase keys are set. Until then the builder runs without sign-in. */
export const isAuthConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isAuthConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        // PKCE puts the sign-in code in ?code= rather than the #hash, so it never
        // collides with #ws= share links.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isAuthConfigured && import.meta.env.DEV) {
  console.info(
    '[SunshineBrigade] Supabase keys not set, so sign-in is off. See docs/LOGIN_SETUP.md.'
  );
}
