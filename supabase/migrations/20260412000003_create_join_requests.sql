-- JoinRequest: заявка игрока на вступление в команду
create table if not exists public.join_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id),
  team_id     uuid not null references public.teams(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- Один pending-запрос на пару user+team
create unique index join_requests_user_team_pending
  on public.join_requests (user_id, team_id)
  where status = 'pending';

alter table public.join_requests enable row level security;

-- Чтение через service_role (API routes)
create policy "join_requests: read via service"
  on public.join_requests for select
  using (true);

-- Вставка через service_role
create policy "join_requests: insert via service"
  on public.join_requests for insert
  with check (true);

-- Обновление через service_role (accept/reject)
create policy "join_requests: update via service"
  on public.join_requests for update
  using (true);

-- Добавляем update policy для team_memberships (для промоута)
create policy "memberships: update via service"
  on public.team_memberships for update
  using (true);
