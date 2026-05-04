# Роадмап MVP 1.6 — Редизайн поиска

> **Контекст.** После закрытия 1.5 (полировка, готовность к нагрузке) переходим к редизайну поисковых страниц. Прежние итерации 53–55 (профиль игрока v2 + редизайн онбординга) перенесены в [роадмап 1.7](roadmap-1.7.md).
>
> **Порядок работы.** Каждая итерация делается целиком и проходит ручное тестирование пользователем. Только после прохождения тестов — старт следующей итерации.

---

## ⬜ Итерация 53 — Редизайн страницы Поиск/Игроки

**Цель.** Переписать `/search/players` под хэндоф из `docs/design/design_handoff_players/`. Ввести в дизайн-систему семейство бейджей игрока (позиция, уровень, рейтинг-кольцо), стек логотипов команд на аватаре и инлайн-пикер города в search-row.

**Источник правды по визуалу.** [docs/design/design_handoff_players/README.md](../design/design_handoff_players/README.md) + `screenshots/players-page-full.png`.

### Решения, зафиксированные перед стартом

- **Город в search-row.** Делаем как в макете — пилюля с именем города, по тапу bottom-sheet со списком (`KZ_CITIES` из `city-context`). Дефолт берём из `useCity().activeCity`. Выбор пилюли меняет **только локальный фильтр страницы**, в профиль пользователя не пишет.
- **Position badge.** Рендерим до 2 шестиугольников подряд (по `users.position[]`). Позиция «Универсал» в макете не предусмотрена — для неё бейдж не рендерим.
- **Team logos.** Делаем `TeamLogosStack` сразу. Если у команды есть `teams.logo_url` — картинка; если нет — цветной круг + инициал (цвет детерминированно из `team.id`).
- **Уровень и рейтинг.** **Источник истины — `users.rating` (0–100).** Buckets: `0–25 → D (графит)`, `26–55 → C (бронза)`, `56–72 → B (серебро)`, `73–88 → A (золото)`, `89–100 → A+ (даймонд)`. И буква на `LevelBadge`, и цвет `RatingCircle` берутся из этого мэппинга. Текстовый `skill_level` (Новичок…Про) на странице больше не отображается — остаётся в БД для онбординга и будущих фильтров.
- **Сортировка «По уровню».** Переключаем с `skill_rank` на `rating` desc, `nullsFirst:false`. Курсор соответствующий.
- **`rating = null`.** На месте `LevelBadge` и `RatingCircle` рендерим нейтральный плейсхолдер «—» (серый шестиугольник + серое кольцо без заливки). Высота строки одинаковая.
- **Сабтайтл строки.** Убираем — под именем только бейджи, как в макете.

### Этап 1 — Токены и ассеты

- В [src/app/globals.css](../../src/app/globals.css) добавить:
  - 4 палитры позиций `--pos-{vrt|zash|pzsh|nap}-{border|fill-from|fill-to|pill-bg|pill-fg|pill-border}`.
  - 5 палитр уровней `--lvl-{aplus|a|b|c|d}-{border|fill-from|fill-mid|fill-to|ring|ring-bg|number}`.
  - Палитра «нет рейтинга» `--lvl-empty-*` (gray).
- Скопировать PNG-иконки в `public/badges/`: `boot.png`, `target.png`, `shield.png`, `glove.png` (источник: `docs/design/design_handoff_players/assets/`).

### Этап 2 — Хелперы и UI-примитивы

- `src/lib/playerBadges.ts`:
  - `levelFromRating(rating: number | null): "aplus" | "a" | "b" | "c" | "d" | null` — buckets.
  - `positionCode(position: string): "vrt" | "zash" | "pzsh" | "nap" | null` — мэппинг русских строк.
  - `teamFallbackHue(teamId: string): number` — детерминированный hue 0–360.
- В `src/components/players/badges/`:
  - `HexBadge.tsx` — общий шестиугольник 26×30 (clip-path, outer/inner слои), принимает CSS-переменные через props и опц. children.
  - `PositionBadge.tsx` — `HexBadge` (PNG-иконка 15px) + примыкающая pill справа.
  - `LevelBadge.tsx` — `HexBadge` с буквой Oswald 14px (10px для `A+`).
  - `RatingCircle.tsx` — SVG-кольцо `size×size` (default 48), цвет от `level`, цифра `font-display`. Для `null` — серое кольцо с «—».
  - `TeamLogosStack.tsx` — абсолютный оверлей: до 3 кругов 24×24, `margin-left:-9` после первого, z-index растёт слева направо.
- `src/components/ui/CityPickerSheet.tsx` — bottom-sheet со списком городов (одностолбцовый чип-список из `KZ_CITIES`). Не пишет в профиль.

### Этап 3 — Бэкенд

- [src/app/api/players/route.ts](../../src/app/api/players/route.ts):
  - В `select(...)` добавить `team_memberships(team_id, teams(id, name, logo_url))`.
  - В ответ — `teams: { id, name, logo_url }[]` (не более 3, по `joined_at` desc — берём из памяти после fetch).
  - Сортировка `sort=skill` → `order("rating", desc, nullsFirst:false)` + tie-break `id`. Курсор на `rating`.

### Этап 4 — `PlayerListRow`

- Аватар 52×52 (новый размер `lg-thumb` в `Avatar` или локальный override).
- `<TeamLogosStack>` поверх аватара.
- Под именем: `<LevelBadge>` + до 2 `<PositionBadge>` в `flex gap-6`.
- Справа: `<RatingCircle size={48}>`.
- Удалить `PositionChipList`, `SkillChip`, текстовый rating, сабтайтл «позиция · район/город».

### Этап 5 — Search-row + страница

- В `ListSearchBar` добавить опц. prop `cityPicker?: { value: string; onClick: () => void }` — пилюля между input и filter-btn (стиль: `px-3 py-3 rounded-[14px] bg-bg-card border-gray-200 text-[14px] font-semibold` + chevron-down 12px).
- В [src/app/(app)/search/players/page.tsx](../../src/app/(app)/search/players/page.tsx):
  - Хранить локальный `filterCity` (init = `activeCity`); тап по пилюле открывает `CityPickerSheet`.
  - `filters.city` = `filterCity`. Из sheet-фильтров поле «Город» можно убрать (теперь это внешний пикер).
  - Передавать `teams` в `PlayerListRow`.

### Этап 6 — Документация

- [docs/design/design-system.md](../design/design-system.md):
  - Новый раздел «Бейджи игрока» с таблицами position/level и правилами мэппинга.
  - Обновить «Строка-игрок (player row)» — новая структура (avatar 52, level + position, rating-кольцо, team-logos оверлей).
  - В шаринг-таблицу `src/components/ui/` добавить `CityPickerSheet`. Доменные `PositionBadge`/`LevelBadge`/`RatingCircle`/`TeamLogosStack` пометить как живущие в `src/components/players/badges/`.

### Этап 7 — Ручная проходка

1. Внешний вид строки совпадает со скриншотом из хэндофа.
2. Игрок с 1 позицией — 1 бейдж; с 2+ — 2 бейджа подряд; «Универсал» — пропускается.
3. Бейдж-уровень и цвет кольца меняются по бакету рейтинга (проверить границы 25/26, 55/56, 72/73, 88/89).
4. `rating = null` → серый плейсхолдер.
5. Логотипы команд: 0/1/2/3+ корректно стекаются.
6. Пилюля города в search-row меняет фильтр, но не пишет в профиль; шит-фильтр поля «Город» больше не дублирует.
7. Сортировка «По уровню» сортирует по `rating` (новички с `null` в конце).
8. Quick-pills, sheet-фильтры, infinite-scroll, empty-state, skeleton — без регрессий.
