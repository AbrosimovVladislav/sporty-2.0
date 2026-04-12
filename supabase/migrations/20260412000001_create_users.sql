create table if not exists public.users (
  id                   uuid primary key default gen_random_uuid(),
  telegram_id          bigint unique not null,
  name                 text not null,
  city                 text,
  sport                text,
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now()
);

-- Row Level Security
alter table public.users enable row level security;

-- Пользователь читает и редактирует только свой профиль
create policy "users: read own"
  on public.users for select
  using (telegram_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

create policy "users: update own"
  on public.users for update
  using (telegram_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

-- Вставка через service_role (API route с валидацией initData)
create policy "users: insert via service"
  on public.users for insert
  with check (true);
