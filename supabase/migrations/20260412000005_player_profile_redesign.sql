alter table public.users
  add column if not exists is_looking_for_team boolean not null default false,
  add column if not exists available_for_one_off boolean not null default false,
  add column if not exists available_for_substitutions boolean not null default false,
  add column if not exists availability_days text[] not null default '{}',
  add column if not exists primary_team_id uuid references public.teams(id) on delete set null;

alter table public.team_memberships
  add column if not exists team_role_label text,
  add column if not exists left_at timestamptz;

create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sport text not null default 'football',
  matches_played integer not null default 0,
  goals integer not null default 0,
  assists integer not null default 0,
  saves integer not null default 0,
  clean_sheets integer not null default 0,
  average_rating double precision,
  updated_at timestamptz not null default now(),
  unique(user_id, sport)
);

alter table public.player_stats enable row level security;
