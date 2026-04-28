-- Adds logo_url column for team logos uploaded to the team-logos storage bucket.
alter table teams
  add column if not exists logo_url text;

-- Public read storage bucket for team logos
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do update set public = excluded.public;
