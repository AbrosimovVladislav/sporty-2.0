# Поиск — События (`/search/events`)

Публичные события — игры, тренировки, сборы, на которые можно записаться.

## API

### GET /api/events/public

Дефолтный лимит 20, максимум 100. Базовая фильтрация: `is_public=true`, `status=planned`, `date > now` (если не задан `from`).

Query: `q`, `type`, `city`, `district_id`, `venue`, `from`, `to`, `price_max`, `has_spots`, `sort`, `limit`, `offset`.

- `venue=<uuid>` — все публичные события на этой площадке (используется кнопкой «Все события на площадке» с `/venues/[id]`).
- `from=YYYY-MM-DD`, `to=YYYY-MM-DD` — диапазон по полю `date`. `from` заменяет дефолтное `> now`.
- `price_max=<int>` — `price_per_player <= max`. Используется пресетами «Бесплатно / До 1/2/3 тыс. ₸».
- `has_spots=true` — оставить только события с `yes_count < min_players`. `yes_count` считается из `event_attendances` поверх результата запроса; чтобы фильтр не ломал пагинацию, эндпоинт over-fetch'ит до 200 строк и режет в памяти.

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
6. **`ActiveFilterChips`** — Город, тип (если применён через шит), пресет периода или диапазон `DD.MM — DD.MM`, цена («Бесплатно» / «До N ₸»), «Есть места».
7. **Список**: эйбрау «Результаты · N» сверху, далее `EventListRow`. Бейдж «Моя команда» — у строк, где `team_id` ∈ команд пользователя.

`EventListRow`:
- 44×44 date-tile (`green-50`/`green-700`) — день сверху (Oswald 16px), месяц снизу
- Имя команды + опц. бейдж «Моя команда»
- Subtitle: «Тип · ЧЧ:ММ · Площадка · Район»
- Right: yes_count с галочкой; если `price_per_player > 0` — ниже сумма «N ₸»

`EventFiltersSheet`: город, район, **Период** (пресеты «Сегодня / На этой неделе / На следующей / На 2 недели» + native date range «От – До»; пресет и custom range взаимоисключающие), **Цена** (пресеты до 1/2/3 тыс. ₸ + «Бесплатно»), toggle **Только со свободными местами**. Тип события не дублируем — он остаётся inline-pills.

Параметр `?venue=<id>` в URL читается клиентом и проксируется в API. Это позволяет открывать листинг с предзаданным фильтром по площадке без UI-чипа.
