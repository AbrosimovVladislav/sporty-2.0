# Каталог игроков

Публичный список зарегистрированных пользователей с фильтрами и переходом в профиль.

## Страницы

- `/players` — каталог с фильтрами
- `/players/[id]` — публичный профиль игрока (read-only)

## Поля профиля

Поля в таблице `users`, релевантные каталогу:

| Поле | Тип | Описание |
|------|-----|----------|
| name | text | Имя игрока |
| avatar_url | text | URL аватарки (Storage); если null — рендерим инициалы |
| city | text | Город |
| district_id | uuid | Район (FK на `districts`) |
| position | text | Игровая позиция (`Вратарь`/`Защитник`/`Полузащитник`/`Нападающий`/`Универсал`) |
| skill_level | text | Уровень: `Новичок`/`Любитель`/`Уверенный`/`Полупрофи`/`Про` |
| skill_rank | smallint | Generated: 1..5 от `skill_level`. Используется для сортировки. Индекс `users_skill_rank_idx` |
| looking_for_team | boolean | Ищет команду |

## API

### GET /api/players

Список игроков с `onboarding_completed = true`. Дефолтный лимит 20, максимум 100.

Query params:
- `q` — free-text поиск по `name` (ilike)
- `city` — ilike по `city`
- `district_id` — точное совпадение
- `position` — точное совпадение по enum-у `POSITIONS.football`
- `looking_for_team=true` — только ищущие команду
- `sort` — `skill` (default: по `skill_rank desc nulls last`, затем `created_at desc`) | `recent` (по `created_at desc`)
- `limit`, `offset` — пагинация

Ответ:
```json
{
  "players": [{ "id", "name", "avatar_url", "city", "position", "skill_level", "looking_for_team", "district_id", "district": { "id", "name" } }],
  "nextOffset": 20,
  "total": 42
}
```

`total` приходит из PostgREST `count: exact` — используется для счётчика «Найдено N игроков» в meta-row.

### GET /api/players/stats

Счётчики для green-header `/players`. Скоупится по applied-фильтру город (а не город пользователя).

Query: `?userId=&city=`

Ответ: `{ "total": N, "inMyTeams": M | null, "lookingForTeam": K }`

`inMyTeams` — `null`, если `userId` не передан. Иначе — уникальные пользователи из всех команд, в которые входит `userId` (без него самого), опционально отфильтрованные по городу.

### GET /api/players/[id]

Публичные данные конкретного игрока.

Ответ: `{ player: { id, name, city, sport, position, skill_level, preferred_time, bio, birth_date, looking_for_team, created_at } }`

404 если пользователь не найден или `onboarding_completed = false`.

### GET /api/users/[id]/stats

Статистика игрока по completed событиям.

Ответ:
```json
{
  "playedCount": 12,
  "votedYesCount": 15,
  "attendedCount": 13,
  "reliability": 87,
  "recentEvents": [{ "event_id", "type", "date", "vote", "attended" }]
}
```

- `reliability` — `round(attendedCount / votedYesCount * 100)`. `null` если `votedYesCount = 0`
- `recentEvents` — последние 10 completed событий, где есть attendance запись

## UI

### Список `/players`

Применение паттерна «Лэйаут листинг-страниц» (см. [docs/design/design-system.md](../../design/design-system.md)).

Структура сверху вниз:

1. **`PageHeader` (зелёный)** — title «ИГРОКИ» (Oswald uppercase 30px) + 3 stat-карточки на тёмной полупрозрачной плашке: «Всего», «В моих командах» (только для авторизованного), «Ищут команду». Источник — `GET /api/players/stats`
2. **`ListSearchBar`** — input «Имя, город, позиция…» (debounce 250ms) + filter-btn → `PlayerFiltersSheet`. На кнопке бейдж с числом активных sheet-фильтров
3. **`ListMeta`** — слева «Найдено N игроков», справа sort-dropdown («По уровню» / «Недавние»)
4. **`FilterPills`** — grid-5 быстрых позиций: «Все / ВРТ / ЗАЩ / ПЗЩ / НАП». Универсал доступен только через filter-sheet
5. **`ActiveFilterChips`** — pill'ы применённых sheet-фильтров (город, «Ищет команду», sheet-позиция) с ✕-удалением. Не показывается, если фильтров нет
6. Эйбрау «Результаты · N»
7. Список `PlayerListRow` (Avatar 44px + имя + опц. бейдж «Ищет команду» + мета «Позиция · Район/Город» + 5-bar мини-бар справа), разделители 1px `var(--gray-100)`
8. Infinite scroll через `usePaginatedList` + `InfiniteScrollSentinel`
9. Empty state с кнопкой «Сбросить фильтры», если ничего не найдено

`PlayerFiltersSheet` — bottom-sheet с город/район/позиция-select-ами и toggle «Ищет команду». Кнопки «Сбросить» / «Применить» внизу.

### Профиль `/players/[id]`

- Тёмный хедер: имя, бейджи (город, спорт, «Ищет команду»)
- Секция «О себе»: bio, позиция, уровень, возраст, предпочтительное время
- Секция «Статистика»: сыграно, надёжность (%), подпись «X из Y событий»
- Секция «Последние события»: список с маркерами «Был» / «Не пришёл»
- Все данные read-only
