-- 254 — initial schema
--
-- Conventions (every user-data table):
--   user_id      owner; defaults to the caller; cascades when the auth user is deleted
--   updated_at   set by the CLIENT on every edit; used for "most recent edit wins"
--   deleted_at   soft delete, so deletions sync to other devices
--   synced_at    set by the SERVER on every insert/update; clients pull rows with synced_at > cursor
--
-- Row Level Security is on for every table: users can only read and write their own rows.

create extension if not exists pgcrypto;

-- ─── shared trigger functions ────────────────────────────────────────────────

-- Stamp synced_at on insert.
create or replace function public.tg_stamp_synced_insert() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.synced_at := now();
  return new;
end $$;

-- Last-write-wins: ignore an incoming update that is older than what is stored
-- (returning NULL from a BEFORE UPDATE trigger skips the row), otherwise stamp synced_at.
create or replace function public.tg_lww_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  new.synced_at := now();
  return new;
end $$;

-- Helper to attach both triggers + RLS policies to a table owned via user_id.
create or replace function public.setup_user_table(t regclass) returns void
language plpgsql set search_path = '' as $$
begin
  execute format('create trigger stamp_synced_insert before insert on %s for each row execute function public.tg_stamp_synced_insert()', t);
  execute format('create trigger lww_update before update on %s for each row execute function public.tg_lww_update()', t);
  execute format('alter table %s enable row level security', t);
  execute format('create policy "own rows: select" on %s for select to authenticated using ((select auth.uid()) = user_id)', t);
  execute format('create policy "own rows: insert" on %s for insert to authenticated with check ((select auth.uid()) = user_id)', t);
  execute format('create policy "own rows: update" on %s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  execute format('create policy "own rows: delete" on %s for delete to authenticated using ((select auth.uid()) = user_id)', t);
end $$;

-- ─── profiles ────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  onboarding_completed boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create trigger stamp_synced_insert before insert on public.profiles for each row execute function public.tg_stamp_synced_insert();
create trigger lww_update before update on public.profiles for each row execute function public.tg_lww_update();
alter table public.profiles enable row level security;
create policy "own profile: select" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile: insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "own profile: update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Create the profile row when a user signs up (name comes from sign-up metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── habits (Build + Break) ──────────────────────────────────────────────────

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('build', 'break')),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  icon text not null default 'sprout',
  reminder_time text check (reminder_time ~ '^\d{2}:\d{2}$'),
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  completed_date date,
  checkpoint int not null default 0,
  best_streak int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);
create index habits_user_synced on public.habits (user_id, synced_at);
select public.setup_user_table('public.habits');

create table public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now(),
  -- one check-in per habit per day: duplicate syncs from several devices are harmless
  unique (habit_id, date)
);
create index habit_checkins_user_synced on public.habit_checkins (user_id, synced_at);
select public.setup_user_table('public.habit_checkins');
-- a check-in may only reference one of the caller's own habits
create policy "own habit only" on public.habit_checkins as restrictive for insert to authenticated
  with check (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid())));

-- ─── challenges ──────────────────────────────────────────────────────────────

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  icon text not null default 'trophy',
  duration_days int not null check (duration_days between 1 and 365),
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'failed', 'completed')),
  completed_date date,
  failed_date date,
  restarted_from uuid references public.challenges (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);
create index challenges_user_synced on public.challenges (user_id, synced_at);
select public.setup_user_table('public.challenges');

create table public.challenge_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (challenge_id, date)
);
create index challenge_checkins_user_synced on public.challenge_checkins (user_id, synced_at);
select public.setup_user_table('public.challenge_checkins');
create policy "own challenge only" on public.challenge_checkins as restrictive for insert to authenticated
  with check (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = (select auth.uid())));

-- ─── tasks ───────────────────────────────────────────────────────────────────

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  notes text not null default '',
  date date not null,
  time text check (time ~ '^\d{2}:\d{2}$'),
  reminder boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);
create index tasks_user_synced on public.tasks (user_id, synced_at);
select public.setup_user_table('public.tasks');

-- ─── meditation sessions ─────────────────────────────────────────────────────

create table public.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  started_at timestamptz not null,
  planned_minutes int not null check (planned_minutes between 1 and 180),
  actual_minutes int not null check (actual_minutes between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);
create index meditation_sessions_user_synced on public.meditation_sessions (user_id, synced_at);
select public.setup_user_table('public.meditation_sessions');

-- ─── notes (Note To Self) ────────────────────────────────────────────────────

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);
create index notes_user_synced on public.notes (user_id, synced_at);
select public.setup_user_table('public.notes');

-- The helper is only needed while migrating.
drop function public.setup_user_table(regclass);
