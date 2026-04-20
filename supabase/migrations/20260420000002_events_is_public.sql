-- Add is_public flag to events (existing rows remain private)
alter table public.events
  add column if not exists is_public boolean not null default false;
