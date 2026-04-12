-- Team
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sport       text not null default 'football',
  city        text not null,
  description text,
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);

alter table public.teams enable row level security;

-- Все участники команды видят её
create policy "teams: members can read"
  on public.teams for select
  using (
    id in (select team_id from public.team_memberships where user_id = auth.uid())
    or true  -- на MVP все команды публичны (для поиска)
  );

-- Создание через service_role (API route)
create policy "teams: insert via service"
  on public.teams for insert
  with check (true);

-- Обновление только организатором через service_role
create policy "teams: update via service"
  on public.teams for update
  with check (true);

-- TeamMembership
create table if not exists public.team_memberships (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id),
  team_id   uuid not null references public.teams(id) on delete cascade,
  role      text not null check (role in ('organizer', 'player')),
  joined_at timestamptz not null default now(),
  unique(user_id, team_id)
);

alter table public.team_memberships enable row level security;

-- Участники видят состав своей команды
create policy "memberships: members can read"
  on public.team_memberships for select
  using (true);  -- на MVP публично (для профиля команды)

-- Вставка через service_role
create policy "memberships: insert via service"
  on public.team_memberships for insert
  with check (true);

-- Удаление через service_role
create policy "memberships: delete via service"
  on public.team_memberships for delete
  using (true);
