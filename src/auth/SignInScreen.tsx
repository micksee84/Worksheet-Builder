/**
 * @license
 * Sunshine Brigade Worksheet Builder - Sign-in screen
 *
 * Matches sunshinebrigade.ca: white header band with the name in Apfel Grotezk, cream
 * ground, one sun-yellow sticker title, Commit Mono eyebrow, Nunito copy.
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

  // Arriving from the sign-up page on sunshinebrigade.ca: the address ends in
  // #signup=<email>. Fill the email in, clear it from the address bar, and send the code
  // straight away so the grown-up only has to type the code. The email rides in the #hash,
  // which browsers never send to a server.
  const handoffDone = useRef(false);
  useEffect(() => {
    if (handoffDone.current) return;
    handoffDone.current = true;
    const match = window.location.hash.match(/(?:^#|&)signup=([^&]+)/);
    if (!match) return;
    let handedEmail = '';
    try {
      handedEmail = decodeURIComponent(match[1]).trim();
    } catch {
      return;
    }
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    } catch {
      /* address bar stays as it was; nothing else depends on it */
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(handedEmail)) {
      setEmail(handedEmail);
      return;
    }
    setEmail(handedEmail);
    setBusy(true);
    sendSignInEmail(handedEmail).then(({ error: err }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setStep('code');
      setCode('');
      setCooldown(RESEND_SECONDS);
    });
  }, [sendSignInEmail]);

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
    <main className="sb-signin min-h-screen w-full bg-[#F2F2E2] text-[#2D2200] flex flex-col">
      {/* Header band, same as the website */}
      <header className="w-full bg-white border-b-[3px] border-[#2D2200]">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-10 h-[72px] sm:h-[84px] flex items-center justify-between gap-4">
          <a
            href="https://sunshinebrigade.ca"
            className="sb-wordmark whitespace-nowrap text-[20px] sm:text-[26px] no-underline hover:text-[#009BD9] focus-visible:outline-[3px] focus-visible:outline-[#009BD9] focus-visible:outline-offset-4 rounded"
          >
            Sunshine Brigade
          </a>
          <a
            href="https://sunshinebrigade.ca"
            className="whitespace-nowrap text-[18px] sm:text-[19px] font-bold underline-offset-4 hover:underline hover:text-[#009BD9]"
          >
            <span className="sm:hidden">Website</span>
            <span className="hidden sm:inline">Back to the website</span>
          </a>
        </div>
      </header>

      <div className="flex-1 w-full mx-auto max-w-[1200px] px-5 sm:px-10 py-12 sm:py-20 flex items-center">
        <div className="w-full grid gap-12 lg:grid-cols-[minmax(0,620px)_1fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <p className="sb-eyebrow m-0">
                {step === 'email' ? 'Sign in' : 'Check your email'}
              </p>
              {/* One sticker title per screen */}
              <h1 className="sb-sticker text-[40px] sm:text-[56px] lg:text-[72px] m-0">
                Worksheet builder
              </h1>
            </div>

            {step === 'email' ? (
              <>
                <p className="text-[19px] sm:text-[22px] leading-[1.6] font-medium text-[#4A4030] m-0 max-w-[40ch]">
                  Make worksheets for ages 3 to 5 and find them again on any device. Start free
                  with 8 worksheets a month.
                </p>

                <form onSubmit={handleSendEmail} noValidate className="flex flex-col gap-6 pt-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="sb-email" className="text-[19px] sm:text-[20px] font-extrabold">
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
                      className="sb-input max-w-[520px]"
                    />
                  </div>

                  {error && <ErrorLine message={error} />}

                  <div>
                    <button
                      type="submit"
                      disabled={busy || !email.includes('@')}
                      className="sb-btn-primary"
                    >
                      {busy ? 'Sending...' : 'Send my sign-in code'}
                    </button>
                  </div>
                </form>

                <p className="text-[17px] sm:text-[19px] leading-[1.5] text-[#6B5F45] m-0 max-w-[48ch]">
                  Accounts are for grown-ups. No passwords to remember: we only use your email
                  to sign you in, and your worksheets are private to you. No ads, no tracking.
                </p>
              </>
            ) : (
              <>
                <p className="text-[19px] sm:text-[22px] leading-[1.6] font-medium text-[#4A4030] m-0 max-w-[36ch]">
                  We sent a code to <strong className="font-extrabold text-[#2D2200] break-all">{email}</strong>.
                  Type it below, or tap the link in the email.
                </p>

                <form onSubmit={handleVerify} noValidate className="flex flex-col gap-6 pt-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="sb-code" className="text-[19px] sm:text-[20px] font-extrabold">
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

                  <div>
                    <button type="submit" disabled={busy || !codeIsComplete} className="sb-btn-primary">
                      {busy ? 'Checking...' : 'Sign in'}
                    </button>
                  </div>
                </form>

                <div className="flex flex-wrap gap-4">
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

                <p className="text-[17px] sm:text-[19px] leading-[1.5] text-[#6B5F45] m-0">
                  Can't find it? Check your spam or promotions folder.
                </p>
              </>
            )}
          </div>

          {/* Sun circle, same as the website hero. Decorative, desktop only. */}
          <div className="hidden lg:flex justify-center" aria-hidden="true">
            <div className="w-[400px] h-[400px] rounded-full bg-[#F2B800] border-[3px] border-[#2D2200] shadow-[6px_6px_0_#2D2200] flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}sb-logo-icon.svg`}
                alt=""
                className="w-[58%] h-auto select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#2D2200] text-[#F2F2E2]">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-10 py-8 flex flex-wrap items-center justify-between gap-4">
          <span className="sb-wordmark text-[20px] !text-[#F2B800]">Sunshine Brigade</span>
          <span className="text-[17px] sm:text-[18px] font-semibold">
            Learn. Wonder. Shine. · sunshinebrigade.ca
          </span>
        </div>
      </footer>
    </main>
  );
};

const ErrorLine: React.FC<{ message: string }> = ({ message }) => (
  <p role="alert" className="text-[18px] font-bold leading-snug m-0">
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
