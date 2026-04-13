alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists photo_url text,
  add column if not exists age_group text,
  add column if not exists bio text;

update public.users
set
  first_name = coalesce(first_name, nullif(split_part(name, ' ', 1), '')),
  last_name = coalesce(last_name, nullif(nullif(substring(name from length(split_part(name, ' ', 1)) + 2), ''), split_part(name, ' ', 1)))
where name is not null;
