# Поиск — События (`/search/events`)

Публичные события — игры, тренировки, сборы, на которые можно записаться.

## API

### GET /api/events/public

Дефолтный лимит 20, максимум 100. Фильтры по `is_public=true`, `status=planned`, `date > now`.

Query: `q`, `type`, `city`, `district_id`, `sort`, `limit`, `offset`.

Поддерживаемые `sort`:
- `date_asc` (default) — сначала ближайшие
- `date_desc` — сначала далёкие
- `price_asc` — по цене (дешевле сверху), вторичный ключ — `date asc`

Ответ:
```json
{
  "events": [{
    "id", "team_id", "type", "date", "price_per_player", "min_players",
    "venue": { "id", "name", "address", "city", "district": {"id","name"} },
    "team": { "id", "name", "city" },
    "yes_count": 7
  }],
  "nextOffset": 20,
  "total": 42
}
```

### GET /api/events/stats

Query: `?city=`. Ответ: `{ "total", "today", "week" }` — счётчики публичных событий (planned, future), опц. отскоупленные по городу.

## UI

1. **`PageHeader`**: title «СОБЫТИЯ», 2 stat-карточки: «Всего», «На неделе».
2. **`SearchSubnav`** — chip-row саб-табов поиска.
3. **`ListSearchBar`** — «Команда, площадка…» (debounce 250ms) → ilike по `teams.name`.
4. **`ListMeta`** — sort-dropdown: «Сначала ближайшие» (default) / «Сначала далёкие» / «По цене (дешевле)». Без счётчика — он перешёл в эйбрау «Результаты · N» над списком.
5. **`FilterPills`** — тип события: Все / Игра / Трен. / Сбор / Другое.
6. **`ActiveFilterChips`** — `Алматы`, тип (если применён через шит).
7. **Список**: эйбрау «Результаты · N» сверху, далее `EventListRow`. Бейдж «Моя команда» — у строк, где `team_id` ∈ команд пользователя.

`EventListRow`:
- 44×44 date-tile (`green-50`/`green-700`) — день сверху (Oswald 16px), месяц снизу
- Имя команды + опц. бейдж «Моя команда»
- Subtitle: «Тип · ЧЧ:ММ · Площадка · Район»
- Right: yes_count с галочкой; если `price_per_player > 0` — ниже сумма «N ₸»

`EventFiltersSheet`: только город + район (тип фильтруется через pills). На MVP город единственный (Алматы) — чип-группа «Город» автоматически скрывается.
