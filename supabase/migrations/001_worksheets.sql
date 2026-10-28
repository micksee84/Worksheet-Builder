-- Sunshine Brigade Worksheet Builder: saved worksheets
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
--
-- Each row is one worksheet. Row-level security means a signed-in grown-up can only
-- ever see, change or delete their own worksheets, even though the browser holds the
-- public key.

create table if not exists public.worksheets (
  id          text        not null,
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  title       text        not null default 'My worksheet',
  data        jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists worksheets_user_updated_idx
  on public.worksheets (user_id, updated_at desc);

alter table public.worksheets enable row level security;

drop policy if exists "Read own worksheets"   on public.worksheets;
drop policy if exists "Add own worksheets"    on public.worksheets;
drop policy if exists "Change own worksheets" on public.worksheets;
drop policy if exists "Delete own worksheets" on public.worksheets;

create policy "Read own worksheets" on public.worksheets
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Add own worksheets" on public.worksheets
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Change own worksheets" on public.worksheets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Delete own worksheets" on public.worksheets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Keep worksheets a sensible size (about 1 MB each) so one account can't fill the database.
alter table public.worksheets drop constraint if exists worksheets_data_size;
alter table public.worksheets
  add constraint worksheets_data_size check (pg_column_size(data) < 1000000);
