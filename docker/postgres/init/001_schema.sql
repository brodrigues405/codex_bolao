create extension if not exists "pgcrypto";

create table if not exists groups (
  id text primary key,
  name text not null
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  group_id text references groups(id),
  flag_url text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (code, group_id)
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'participant')),
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  fifa_match_number integer,
  stage text not null,
  stage_label text not null,
  group_name text,
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
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

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id)
);

create table if not exists bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(id) on delete cascade,
  champion_team_id uuid references teams(id),
  runner_up_team_id uuid references teams(id),
  third_place_team_id uuid references teams(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
