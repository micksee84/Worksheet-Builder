# Sign-in and saved worksheets: setup

The builder uses [Supabase](https://supabase.com) for passwordless sign-in and for saving
worksheets to each grown-up's account. Until the two keys below are set, the builder
opens without sign-in, exactly as before.

## How it works

1. A grown-up types their email on the sign-in screen.
2. Supabase sends one email with a **6-digit code** and a **sign-in link**.
3. They type the code (works everywhere, including the embed on the Framer site and
   on a different device), or tap the link if they opened the email in the same browser.
4. Their worksheet saves to their account a moment after each change. "My worksheets"
   in the top bar lists everything they've saved.

Row-level security in the database means each account can only ever read, change or
delete its own worksheets.

## One-time setup (about 15 minutes)

### 1. Create the project

- Sign in at supabase.com and create a new project. Pick the **Canada (Central)** region.
- Save the database password somewhere safe. The builder never needs it.

### 2. Create the worksheets table

- Open **SQL Editor > New query**.
- Paste everything from `supabase/migrations/001_worksheets.sql` and press **Run**.

### 3. Set where sign-in links may go

**Authentication > URL Configuration**

- **Site URL:** `https://micksee84.github.io/Worksheet-Builder/`
- **Redirect URLs:** add each of these
  - `https://micksee84.github.io/Worksheet-Builder/**`
  - `http://localhost:3000/**`
  - Any custom domain the builder moves to later, for example `https://play.sunshinebrigade.ca/**`

### 4. Put the code in the email

**Authentication > Emails > Templates > Magic link.** Replace it with:

Subject:

```
Your Sunshine Brigade sign-in code
```

Body:

```html
<div style="font-family: Nunito, Arial, sans-serif; color: #2D2200; max-width: 480px;">
  <h2 style="margin: 0 0 16px;">Here is your sign-in code</h2>
  <p style="font-size: 16px; line-height: 1.5;">Type this code in the worksheet builder:</p>
  <p style="font-size: 32px; font-weight: 800; letter-spacing: 6px; margin: 16px 0;">{{ .Token }}</p>
  <p style="font-size: 16px; line-height: 1.5;">
    Or <a href="{{ .ConfirmationURL }}" style="color: #2D2200; font-weight: 700;">tap here to sign in</a>
    if you opened this email in the same browser.
  </p>
  <p style="font-size: 14px; line-height: 1.5; color: #6B5F45;">
    The code works for one hour. If you didn't ask for it, you can ignore this email.
  </p>
  <p style="font-size: 13px; color: #6B5F45; margin-top: 24px;">Learn. Wonder. Shine.<br>sunshinebrigade.ca</p>
</div>
```

Do the same for the **Confirm signup** template, so a grown-up's very first email also
shows the code.

### 5. Send email from your own address (before launch)

Supabase's built-in email only sends a handful of messages an hour and is meant for
testing. Before families use it, connect your own sender under
**Project Settings > Authentication > SMTP Settings** (Resend, Postmark or similar, sending
from something like `hello@sunshinebrigade.ca`).

### 6. Add the keys to the builder

**Project Settings > API Keys.** Copy the project URL and the **publishable** (anon) key.
Never use the secret / service-role key in the builder.

Create a file called `.env.local` in the project folder (it is git-ignored):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Then build and deploy as usual. The keys are read at build time, so a build made
without them has sign-in switched off.

## Changing the look

- Sign-in screen layout and copy: `src/auth/SignInScreen.tsx`
- Input and button styles: the "Sign-in and account UI" section of `src/index.css`
- Account menu in the top bar: `AccountMenu` at the bottom of `src/components/TopBar.tsx`
- My worksheets list: `src/components/MyWorksheetsModal.tsx`

## Files

| File | What it does |
| --- | --- |
| `src/auth/supabaseClient.ts` | Connects to Supabase using the two keys |
| `src/auth/AuthProvider.tsx` | Sign-in state, send code, check code, sign out |
| `src/auth/AuthGate.tsx` | Shows the sign-in screen until someone is signed in |
| `src/auth/useAccountSync.ts` | Saves the open worksheet to the account after each change |
| `src/utils/cloudWorksheets.ts` | List, open, save and delete account worksheets |
| `supabase/migrations/001_worksheets.sql` | The worksheets table and its privacy rules |
