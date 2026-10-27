/**
 * @license
 * Sunshine Brigade Worksheet Builder - Sign-in screen
 *
 * Ink Style interactive screen: white ground, ink UI, one ink sticker title.
 * Step 1: type an email. Step 2: type the code from the email (or tap its link).
 * All copy follows the brand voice: warm, short, sentence case, Canadian spelling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

const RESEND_SECONDS = 60;

export const SignInScreen: React.FC = () => {
  const { sendSignInEmail, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  const handleSendEmail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const { error: err } = await sendSignInEmail(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setStep('code');
    setCode('');
    setCooldown(RESEND_SECONDS);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const { error: err } = await verifyCode(email, code);
    setBusy(false);
    if (err) setError(err);
    // On success the auth listener swaps this screen for the builder.
  };

  const codeIsComplete = /^\d{6,10}$/.test(code.replace(/\s/g, ''));

  return (
    <main className="sb-signin min-h-screen w-full bg-white text-[#2D2200] flex flex-col">
      {/* Top row: logo, left aligned like the printables */}
      <div className="px-5 sm:px-10 pt-6 sm:pt-8">
        <img
          src={`${import.meta.env.BASE_URL}sb-logo-header.svg`}
          alt="Sunshine Brigade"
          className="h-7 w-auto select-none"
          draggable={false}
        />
      </div>

      <div className="flex-1 flex items-start sm:items-center px-5 sm:px-10 py-10">
        <div className="w-full max-w-[520px]">
          {/* One ink sticker title per screen */}
          <h1 className="ink-sticker text-[44px] sm:text-[58px] m-0 mb-4">Worksheet builder</h1>

          {step === 'email' ? (
            <>
              <p className="text-[17px] leading-relaxed font-medium mb-8 max-w-[44ch]">
                Sign in to build worksheets and find them again on any device. It is free for
                every family, always.
              </p>

              <form onSubmit={handleSendEmail} noValidate className="space-y-5">
                <div>
                  <label htmlFor="sb-email" className="block text-[15px] font-extrabold mb-2">
                    Your email
                  </label>
                  <input
                    id="sb-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="sb-input"
                  />
                </div>

                {error && <ErrorLine message={error} />}

                <button
                  type="submit"
                  disabled={busy || !email.includes('@')}
                  className="sb-btn-primary"
                >
                  {busy ? 'Sending...' : 'Send my sign-in code'}
                </button>
              </form>

              <p className="mt-8 text-[14px] leading-relaxed text-[#6B5F45] max-w-[52ch]">
                No passwords to remember. We only use your email to sign you in, and your
                worksheets are private to you. No ads, no tracking.
              </p>
            </>
          ) : (
            <>
              <p className="text-[17px] leading-relaxed font-medium mb-8 max-w-[46ch]">
                We sent a code to <strong className="font-extrabold break-all">{email}</strong>.
                Type it below, or tap the link in the email.
              </p>

              <form onSubmit={handleVerify} noValidate className="space-y-5">
                <div>
                  <label htmlFor="sb-code" className="block text-[15px] font-extrabold mb-2">
                    Sign-in code
                  </label>
                  <input
                    id="sb-code"
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={12}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="123456"
                    className="sb-input sb-input-code"
                  />
                </div>

                {error && <ErrorLine message={error} />}

                <button type="submit" disabled={busy || !codeIsComplete} className="sb-btn-primary">
                  {busy ? 'Checking...' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSendEmail()}
                  disabled={busy || cooldown > 0}
                  className="sb-btn-secondary"
                >
                  {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                  }}
                  className="sb-btn-secondary"
                >
                  Use a different email
                </button>
              </div>

              <p className="mt-8 text-[14px] leading-relaxed text-[#6B5F45]">
                Can't find it? Check your spam or promotions folder.
              </p>
            </>
          )}
        </div>
      </div>

      <footer className="pb-6 pt-4 mx-5 sm:mx-10 border-t-[1.5px] border-[#2D2200] flex flex-wrap justify-between gap-2 text-[12px] font-semibold tracking-[0.02em]">
        <span>Learn. Wonder. Shine.</span>
        <span>sunshinebrigade.ca · Free for home and classroom use</span>
      </footer>
    </main>
  );
};

const ErrorLine: React.FC<{ message: string }> = ({ message }) => (
  <p role="alert" className="text-[15px] font-bold leading-snug">
    {message}
  </p>
);

/** Shown for a moment while a saved session is checked, so the sign-in screen never flashes. */
export const AuthLoading: React.FC = () => (
  <div className="min-h-screen w-full bg-white flex items-center justify-center" aria-busy="true">
    <img
      src={`${import.meta.env.BASE_URL}sb-logo-icon.svg`}
      alt="Loading"
      className="h-12 w-auto opacity-80 motion-safe:animate-pulse"
    />
  </div>
);
