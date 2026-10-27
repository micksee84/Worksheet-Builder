/**
 * @license
 * Sunshine Brigade Worksheet Builder - Auth gate
 * Shows the sign-in screen until a grown-up is signed in, then the builder.
 * If the Supabase keys are not set yet, the builder opens without sign-in.
 */

import React from 'react';
import { useAuth } from './AuthProvider';
import { AuthLoading, SignInScreen } from './SignInScreen';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { enabled, ready, user } = useAuth();
  if (!enabled) return <>{children}</>;
  if (!ready) return <AuthLoading />;
  if (!user) return <SignInScreen />;
  // Keyed by user so switching accounts starts the builder fresh.
  return <React.Fragment key={user.id}>{children}</React.Fragment>;
};
