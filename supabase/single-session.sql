-- ============================================================
-- VITTI Hub — Single active session per user
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL).
-- ============================================================

-- 1. Registry: one row per user holding the ID of their ONE valid session.
create table if not exists public.active_sessions (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  session_id  text        not null,
  device_info text,
  updated_at  timestamptz not null default now()
);

-- 2. Row Level Security — a user may only see / write their OWN row.
alter table public.active_sessions enable row level security;

drop policy if exists "own session select" on public.active_sessions;
create policy "own session select" on public.active_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "own session insert" on public.active_sessions;
create policy "own session insert" on public.active_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "own session update" on public.active_sessions;
create policy "own session update" on public.active_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own session delete" on public.active_sessions;
create policy "own session delete" on public.active_sessions
  for delete using (auth.uid() = user_id);

-- 3. Realtime — so the superseded device is notified instantly.
--    (Safe to re-run; ignore the error if the table is already in the publication.)
do $$
begin
  alter publication supabase_realtime add table public.active_sessions;
exception
  when duplicate_object then null;
end $$;
