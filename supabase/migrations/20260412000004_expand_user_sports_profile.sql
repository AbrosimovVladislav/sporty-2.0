alter table public.users
  add column if not exists position text,
  add column if not exists level text,
  add column if not exists dominant_side text,
  add column if not exists preferred_format text;
