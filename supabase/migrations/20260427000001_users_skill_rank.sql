-- Generated rank column for sorting players by skill level (Pro > Полупрофи > Уверенный > Любитель > Новичок)
alter table public.users
  add column if not exists skill_rank smallint generated always as (
    case skill_level
      when 'Новичок'    then 1
      when 'Любитель'   then 2
      when 'Уверенный'  then 3
      when 'Полупрофи'  then 4
      when 'Про'        then 5
      else null
    end
  ) stored;

create index if not exists users_skill_rank_idx
  on public.users (skill_rank desc nulls last);

comment on column public.users.skill_rank is
  'Ordinal rank of skill_level (1..5) for ordering. Generated.';
