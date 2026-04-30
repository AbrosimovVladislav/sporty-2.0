-- Iteration 51.1 — venue profile page
-- Adds optional contact and description fields to venues.

alter table venues
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists description text;
