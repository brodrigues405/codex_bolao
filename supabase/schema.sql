create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  username text not null unique,
  role text not null check (role in ('admin', 'participant')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.groups (
  id text primary key,
  name text not null
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  group_id text references public.groups(id),
  flag_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  fifa_match_number integer,
  stage text not null,
  stage_label text not null,
  group_name text,
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  home_slot_label text,
  away_slot_label text,
  kickoff_at_utc timestamptz not null,
  stadium text,
  city text,
  country text,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'finished')),
  home_score integer,
  away_score integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id)
);

create table if not exists public.bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  champion_team_id uuid references public.teams(id),
  runner_up_team_id uuid references public.teams(id),
  third_place_team_id uuid references public.teams(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.bonus_predictions enable row level security;
alter table public.audit_logs enable row level security;

create policy "public can read groups"
on public.groups for select
using (true);

create policy "public can read teams"
on public.teams for select
using (true);

create policy "public can read matches"
on public.matches for select
using (true);

create policy "participants can read self user"
on public.users for select
using (auth.uid() = auth_user_id);

create policy "participants can read own predictions"
on public.predictions for select
using (
  exists (
    select 1 from public.users
    where public.users.id = public.predictions.user_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "participants can write own predictions"
on public.predictions for all
using (
  exists (
    select 1 from public.users
    where public.users.id = public.predictions.user_id
      and public.users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users
    where public.users.id = public.predictions.user_id
      and public.users.auth_user_id = auth.uid()
  )
);
