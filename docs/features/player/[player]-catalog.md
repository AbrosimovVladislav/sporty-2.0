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
  "players": [{
    "id", "name", "avatar_url",
    "city", "district_id", "district": { "id", "name" },
    "position", "skill_level", "looking_for_team",
    "reliability": 87,    // % посещения completed-событий, на которые был ответ "приду", null если votedYes=0
    "played": 13          // attended=true в completed-событиях
  }],
  "nextOffset": 20,
  "total": 42
}
```

`total` приходит из PostgREST `count: exact` — используется для счётчика «Найдено N игроков».

`reliability` и `played` считаются bulk-запросом по `event_attendances + events.status='completed'` для всех игроков страницы (один доп. запрос на каждую страницу пагинации, не N+1 на игрока).

### GET /api/players/stats

Счётчики для green-header `/players`. Скоупится по applied-фильтру город (а не город пользователя).

Query: `?userId=&city=`

Ответ: `{ "total": N, "inMyTeams": M | null, "lookingForTeam": K }`

`inMyTeams` — `null`, если `userId` не передан. Иначе — уникальные пользователи из всех команд, в которые входит `userId` (без него самого), опционально отфильтрованные по городу.

### GET /api/players/[id]

Публичные данные конкретного игрока.

Ответ: `{ player: { id, name, city, sport, position, skill_level, preferred_time, bio, birth_date, looking_for_team, created_at, district_id, district, rating, avatar_url } }`

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
7. Список `PlayerListRow` (Avatar 44px + имя + опц. бейдж «Ищет команду» + мета «Позиция · Район/Город» + 5-bar мини-бар надёжности справа: `100→5, 80-99→4, 60-79→3, 40-59→2, 1-39→1, played=0→прочерк`), разделители 1px `var(--gray-100)`
8. Infinite scroll через `usePaginatedList` + `InfiniteScrollSentinel`
9. Empty state с кнопкой «Сбросить фильтры», если ничего не найдено

`PlayerFiltersSheet` — bottom-sheet с город/район/позиция-select-ами и toggle «Ищет команду». Кнопки «Сбросить» / «Применить» внизу.

### Профиль `/players/[id]`

Read-only. На светлом фоне `--bg-secondary`, контент — карточки `bg-bg-primary rounded-[16px] shadow-sm` с `gap-3`.

1. **Hero-карточка** (`relative`, центрированный контент):
   - `BackButton` в `top-4 left-4` (40×40, white bg, shadow)
   - Аватар 144×144 круглый, тонкая обводка `--gray-200`. Если без фото — белая инициалка на `--gray-100`. В правом-нижнем углу аватара — overlay-плашка рейтинга 44×44 (`--text-primary` фон, белый Oswald 16px, белая рамка 3px)
   - Имя — Oswald 28px uppercase, центр
   - Город — `📍 city` 14px secondary, центр
   - Ряд бейджей (центрированы): `LevelChip` (hex `LevelBadge` + pill `«{skill_level} N/5»`), затем `PositionBadge` для каждой позиции
2. **Карточка «О себе»** (видна, если есть `birth_date`): `Eyebrow` + строка «Возраст / N лет» с тортом-иконкой справа. Bio/позиция/уровень из карточки убраны — позиции отображаются hex-бейджами в hero, уровень — в `LevelChip`
3. **Stats grid** (`grid-cols-2 gap-3`):
   - Карточка «Сыграно» — серый круг 48px с иконкой мяча + Oswald 28px число + label
   - Карточка «Надёжность» — зелёный (`--green-100`) круг с иконкой щита + Oswald 28px зелёное число + label. Если `reliability === null` — прочерк
4. **Reliability summary** (если `votedYesCount > 0`): зелёный (`--green-500`) круг с белой галочкой + текст «Посетил X из Y записанных событий»
5. **«Последние события»**: `Eyebrow` + карточка-список. Каждая строка: 40×40 квадрат (`--green-100` фон) с зелёной иконкой календаря + тип события + полная дата + status pill справа («Был» зелёный / «Не был» красный / «Не голосовал» серый)

**Bottom action bar** «Пригласить в команду» — виден только если просмотрщик не сам игрок и состоит организатором хотя бы в одной команде. Открывает bottom-sheet выбора команды (`POST /api/teams/[id]/invites`).

`LevelChip` (`@/components/players/badges/LevelChip`) — общий компонент: hex-LevelBadge + pill `{skill_level} N/5`. Используется также в `TeamPlayerSheet`.
