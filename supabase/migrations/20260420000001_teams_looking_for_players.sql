-- Add looking_for_players flag to teams
alter table public.teams
  add column if not exists looking_for_players boolean not null default false;
