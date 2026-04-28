# Роадмап MVP 1.4 — Переработка дизайна

> **Контекст.** После MVP 1.3 (единая дизайн-система) приступаем к постраничной переработке интерфейса. Изменения ведём итеративно: для каждого экрана собираем обратную связь (текст, референсы, скриншоты), затем реализуем. Итерации 26 и 29 из MVP 1.3, не закрытые полностью, переносятся сюда как основа для соответствующих страниц.

---

## ✅ Итерация 30 — Дизайн-токены Sporty v1

**Цель:** внедрить единую систему дизайн-токенов (цвета, типографика, отступы, тени) как основу для всех последующих доработок дизайна.

**Что сделано:**
- ✅ Цветовые шкалы `--green-50..900` (Emerald, oklch hue 155) и `--gray-50..900` (Warm Gray, oklch hue 80)
- ✅ Семантические поверхности `--bg-primary/secondary/card/elevated/dark`
- ✅ Семантический текст `--text-primary/secondary/tertiary/inverse/accent`
- ✅ Тени `--shadow-sm/md/lg` на `oklch()`
- ✅ Спейсинг `--space-1..12`, `--page-px: 16px`
- ✅ Бэкварт-совместимость: старые переменные (`--background`, `--foreground`, `--primary` и т.д.) остаются алиасами — существующий UI не ломается
- ✅ `@theme inline` обновлён: Tailwind-утилиты `bg-green-500`, `text-gray-400`, `bg-bg-secondary`, `text-text-secondary` и т.д. работают из коробки

**Затронутые файлы:**
- ✅ `src/app/globals.css` — полная замена `:root` и `@theme inline`
- ✅ `docs/design/design-system.md` — раздел токенов переписан под новую систему

---

## ⬜ Итерация 31 — Главная страница (Home v8)

**Цель:** реализовать главную страницу строго по дизайну Claude Design (Home v8), сохранив всю функциональность и добавив новые блоки.

### Структура (сверху вниз)

1. ✅ **Hero-зона** (зелёный фон + диагональная текстура, скругление снизу 28px):
   - Header: «Привет, [имя]» + bell-иконка справа: red-dot если есть pending-заявки в команды-орг; тап → bottom-sheet со списком заявок
   - Тёмная карточка ближайшего события (`gray-900`): фото-баннер 140px, бейджи типа/статуса, countdown «через 2д» (Oswald), заголовок команды (Oswald uppercase), 3 чипа (время/площадка/цена), явка-bignum (крупные «7 / 10» + 3-сегментный бар yes/no/waiting + легенда), RSVP-кнопки «Приду» / «Не приду» с галочкой на выбранной

2. ✅ **Карточка заявок** (только орг, только если есть): иконка + «3 заявки во вступление» + разбивка по командам + бейдж счётчика; тап → sheet со списком (тап на пункт → заявки команды)

3. ✅ **Quick Actions** (grid-2): «Найти событие» (primary) → `/search?tab=events`, «Найти команду» (secondary) → `/search?tab=teams`

4. ✅ **Пульс команд** (горизонтальный скролл): 210px карточки с лого (gradient), названием, спорт+город, пилюлей ближайшего события и 3 stat-колонками (явка / долгов / заявок). Долги и заявки — только для команд, где user = organizer

5. ✅ **Расписание** (вертикальный список): 3 ближайших события **после** hero, дата как Oswald-стрипа на градиенте, статус явки top-right pill, низ — название + meta. Линк «Все события →» в шапке

6. ✅ **Bottom nav** — без изменений

### Backend / API

- ✅ Расширен `GET /api/users/[id]/next-event` — добавлены `no_count`, `waiting_count`, `total_members` для трёхсегментного бара
- ✅ `GET /api/users/[id]/pending-requests` — для блока заявок (только команды, где user = organizer; группировка по командам)
- ✅ `GET /api/users/[id]/teams-pulse` — массив команд пользователя с агрегатами: ближайшее событие, явка/min, долги, заявки
- ✅ `GET /api/users/[id]/schedule?limit=3&excludeId=<heroId>` — следующие N событий со статусом явки; `excludeId` исключает hero-событие (надёжнее offset, т.к. hero может приходить из voted-yes вне команд)
- ⬜ Фильтр «события моих команд» в `GET /api/events/public?my=1&userId=...` — пока не реализован, линк ведёт на общую вкладку событий

### Frontend

- ✅ Компоненты в `src/components/home/`: `HomeHero`, `HeroEventCard`, `RequestsCard`, `RequestsSheet`, `QuickActions`, `TeamPulseSection`, `TeamPulseCard`, `ScheduleSection`, `SchedulePreviewCard`
- ✅ Полный rewrite `src/app/(app)/home/page.tsx`
- ✅ Search: поддержка `?tab=events|teams|venues` для прямой навигации с главной
- ⬜ Search: фильтр `?my=1` для расписания «Все события»
- ✅ Реальные фото площадок: колонка `photo_url` в таблице `venues`, 4 площадки Алматы загружены в Supabase Storage (`venues/`), hero и расписание показывают фото

### Утилиты

- ✅ `src/lib/format.ts`: `formatCountdown`, `formatCountdownLabel`, `formatPrice`, `formatTime`, `formatDayShort`, `formatWeekday`, `formatFullDate`, `teamGradient` (детерминированный градиент по id команды)
- ✅ Countdown читается естественно: «сегодня», «завтра» (без лейбла), «5 дней до старта» (число + плюрал + лейбл «до старта»). На карточке hero на главной в чипе времени теперь дата + время («3 мая · 18:00»)

---

## ✅ Итерация 32 — Страница события (Event Detail v2)

**Цель:** переработать страницу события под дизайн-систему Sporty, единый паттерн с главной (фото-баннер, Oswald-таймер, dark-on-light финансы), привести UX к мобильному стандарту.

### Навигация ✅

- Нижнее меню — всегда (5 пунктов)
- Верхние чипы команды (Главное / Состав / События / Финансы) — **скрыты** на странице события
- Back-arrow интегрирован в hero (top-left на тёмной таблетке поверх фото)

### Структура (сверху вниз) ✅

1. **Hero** (унифицированная dark-карточка, скругление снизу 28px):
   - Фото площадки 230px, плавный градиент в `gray-900` снизу (бесшовный переход в карточку)
   - Back-arrow в тёмной таблетке (top-left), статус-пилюля (top-right)
   - Countdown-пилюля «1 день до старта» с зелёной точкой — overlay на фото внизу-слева
   - В dark-карточке: компактный чип-команда (тап → команда) → заголовок типа события (Oswald uppercase: «Тренировка» / «Игра») → полная дата с временем → чипы (площадка / цена) → RSVP. Без дублирующего time-чипа (время уже в дате) и без bignum (вынесен в карточку «Участники»)

2. **Title block:** команда (Oswald uppercase 24px) + полная дата «Пн, 3 мая · 18:00»

3. **Info chips** (горизонтальный ряд): время, площадка (тап → скролл к карточке), стоимость с игрока

4. **RSVP** (для запланированных): большие «Приду / Не приду» + индикатор «7/10 идут»
   **Past mode:** для завершённых — заменяется на «вы были» / «не были»; для орг — кнопка «Отметить присутствие»

5. **Attendees** — единая карточка-точка входа (вся аналитика по явке здесь):
   - Bignum «7/10» + сегментный прогресс-бар + легенда «N да · N нет · N ждём»
   - Внизу AvatarStack идущих + ссылка «Все участники →»
   - Один CTA на тап карточки → sheet с тремя секциями (идут / не идут / ждут ответа). Никаких дополнительных «Все →» рядом с заголовком

6. **Карточка площадки** (только если есть venue):
   - Фото + название + адрес + кнопка «Маршрут» (открывает 2GIS / Google Maps по адресу)

7. **Описание** (если задано): простой текст в `bg-secondary`-блоке

8. **Финансы — два режима:**
   - *Игроку:* «Стоимость с игрока 1500 ₸»; для completed — кнопка «Отметить оплату» (тогл `paid` для себя)
   - *Организатору:* единая карточка с двумя строками («Площадка» с inline-edit стоимости + toggle оплаты площадки, «Сборы с игроков» с прогресс-баром); справа — бейдж статуса или кнопка «Должны N» с разворотом списка должников. Деньги форматируются `formatMoney` (никаких «Бесплатно» в значениях счётчика)

9. **Управление событием** (только орг, всегда видна, без аккордиона): toggle публичности (switch) и «Отменить событие» (красная строка, planned only). «Завершить» вынесена выше как primary CTA, чтобы не прятать ключевое действие организатора.

10. **Past-режим:**
    - *Игроку:* блок `EventMyAttendance` («Я был» / «Я сдал» — два toggle-rows на странице, до отметок видны как «Был?» / «Сдал?»)
    - *Организатору:* открывает обычный sheet через карточку «Участники» — там тогглы Был/Сдал. Дополнительного CTA нет (карточка участников = одна точка входа)

11. **Primary CTA «Завершить событие»** (`EventCompleteCTA`) для организатора при `status=planned`:
    - Если дата ещё не прошла — большая зелёная кнопка под hero, лейбл «Завершить событие» (без подзаголовка)
    - Если дата прошла — жёлто-оранжевый баннер с акцентом «Событие прошло» и компактной кнопкой «Завершить»
    - API при `PATCH status=completed` автоматически проставляет `attended=true` всем yes-voters (логика на сервере, не в UI)

### Backend / API

- ✅ `GET /api/teams/[id]/events/[eventId]` — добавлен `venue.photo_url`; долги по игрокам считаются на клиенте (есть `paid` + `paid_amount` в attendances)
- ✅ `PATCH /api/teams/[id]/events/[eventId]` — добавлена поддержка `is_public` toggle
- ✅ `PATCH /api/teams/[id]/events/[eventId]/attendance` — пометка присутствия (existing endpoint)

### Frontend

- ✅ Полный rewrite `src/app/(app)/team/[id]/events/[eventId]/page.tsx`
- ✅ Компоненты в `src/components/event/`: `EventHero` (унифицированная dark-карточка: фото + countdown-чип + название + дата + чипы + 7/10 + RSVP, скруглена снизу 28px), `EventAttendeesPreview`, `EventAttendeesSheet` (3 секции с именами, тогглы Был/Сдал в past-режиме), `EventVenueCard`, `EventFinanceForPlayer` (с self-toggle оплаты), `EventFinanceForOrganizer` (inline-edit стоимости, прогресс-бары, должники), `EventManagement` (inline аккордион), `EventMyAttendance` (past-режим самоотметка игроком)
- ✅ Layout-логика: чипы команды скрыты на маршруте `events/[eventId]` (`team/[id]/layout.tsx`)

---

## ✅ Итерация 33 — Поиск игроков (Players v2) + шаблон листинг-страниц

**Цель:** ввести единый лэйаут first-level каталог-страниц (`PageHeader` + `ListToolbar` + `ListRow`), реализовать его на странице `/players`. Остальные каталоги (`/teams`, `/search` событий) переведём в следующих итерациях.

### Дизайн-система ✅ (готово до начала разработки)

- ✅ `docs/design/design-system.md`: возвращён Oswald (`font-display`) для page-title в green-header, sport-метрик, countdown, event type — формализована таблица типографики
- ✅ Новая секция «Лэйаут листинг-страниц» с описанием `PageHeader` / `ListToolbar` / `ActiveFilterChips` / `ListRow`
- ✅ Анти-паттерн «тёмные hero-блоки» уточнён: на first-level каталог-страницах теперь зелёный `PageHeader`, плоский тёмный hero запрещён везде кроме hero события

### Структура страницы `/players` (сверху вниз)

1. ✅ **`PageHeader` (зелёный)**:
   - Title «ИГРОКИ» (Oswald uppercase 30px white)
   - 3 stat-карточки: «Всего», «В моих командах», «Ищут команду» (карточка «В моих командах» только для авторизованного пользователя)
   - Bell — пока опущен, вернётся позже сценарием уведомлений

2. ✅ **`ListSearchBar` + `ListMeta` + `FilterPills`**:
   - Search-input «Имя, город, позиция…» (debounced 250ms) + filter-btn → `PlayerFiltersSheet`
   - Meta-row: «Найдено N игроков» + sort-dropdown («По уровню» / «Недавние»)
   - Position-pills grid-5: «Все / ВРТ / ЗАЩ / ПЗЩ / НАП» (Универсал доступен через filter-sheet)

3. ✅ **`ActiveFilterChips`** — массив применённых sheet-фильтров (город, ищет команду, позиция из sheet) с ✕ для удаления

4. ✅ **Эйбрау «РЕЗУЛЬТАТЫ · N»**

5. ✅ **Список игроков** (`PlayerListRow`):
   - Avatar 44px (`users.avatar_url` или инициалы)
   - Имя + опц. бейдж «Ищет команду»
   - Мета: «Позиция · Район/Город»
   - Справа: 5-bar мини-бар (`skillToBars()` маппит skill_level → 1..5)
   - `border-bottom 1px var(--gray-100)` между строками

6. ✅ **Infinite scroll** — `usePaginatedList` + `InfiniteScrollSentinel`

### Backend / API

- ✅ `GET /api/players` расширен: `q` (ilike по `name`), `sort` (`skill` | `recent`, default `skill`), возвращает `avatar_url` и `total` (count exact)
- ✅ `GET /api/players/stats?userId&city` — счётчики для green-header: `total`, `inMyTeams`, `lookingForTeam`. Скоупится по применённому городу-фильтру (а не всегда городу пользователя)
- ✅ Миграция `20260427000001_users_skill_rank.sql` — генерируемая колонка `skill_rank smallint` (`Новичок=1 … Про=5`) + индекс `users_skill_rank_idx (skill_rank desc nulls last)` для сортировки «По уровню»
- ⬜ Уведомления в bell — отложено; пока bell не рендерится на `/players`

### Frontend

#### Shared UI (`src/components/ui/`)

- ✅ `PageHeader.tsx` + `HeaderStatGroup` + `HeaderStat` — зелёный hero первого уровня с диагональной текстурой, скруглением снизу 28px и опциональным bell. Stats-карточки на тёмной плашке `bg-black/18 backdrop-blur`
- ✅ `ListSearchBar.tsx` — search input + опциональный filter-btn с бейджем-счётчиком + кнопка очистки в input'е
- ✅ `ListMeta.tsx` — count slot слева + sort-dropdown справа (custom popover с click-outside)
- ✅ `FilterPills.tsx` — grid с шириной по числу опций; активная `bg-gray-900 text-white`, неактивная `bg-bg-secondary`
- ✅ `ActiveFilterChips.tsx` — массив `FilterChip[]`, рендерит `bg-green-50 text-green-700` pill с ✕

`ListToolbar` как отдельный компонент решено не делать — три примитива комбинируются прямо в page-компонентах, что даёт больше гибкости (порядок, условный рендер pills, чипов).

#### Player-specific (`src/components/players/`)

- ✅ `PlayerListRow.tsx` — строка списка (Avatar + name + опц. SeekingBadge + meta + MiniBar)
- ✅ `PlayerFiltersSheet.tsx` — bottom-sheet (город, район, позиция, toggle «Ищет команду») с «Сбросить» / «Применить»
- ✅ `skillToBars.ts` — маппинг skill_level → 1..5 через `SKILL_LEVELS.indexOf`

#### Rewrite страницы

- ✅ `src/app/(app)/players/page.tsx` полностью переписан: green PageHeader → ListSearchBar → ListMeta → FilterPills → ActiveFilterChips → эйбрау + список + infinite scroll. Тёмный hero и плоские карточки убраны

### Текущее состояние страницы `/players`

Сейчас (до итерации 33): тёмный hero «КАТАЛОГ / Игроки», три инпута (CitySelect, DistrictSelect, position text-input), toggle «Ищет команду», список плоских bordered-карточек. После итерации — полный визуальный refresh, плюс расширенный поиск (по имени) и сортировка.

### Не входит в итерацию 33

- Применение шаблона к `/teams` и `/search` (events/venues) — отдельные итерации
- Numeric rating (вместо bar-маппинга skill_level) — post-MVP, требует системы оценки
- Реальная логика уведомлений в bell на каталог-страницах — отдельный сценарий

---

## ✅ Итерация 34 — Каталог команд (Teams v2) на едином шаблоне

**Цель:** перевести `/teams` на тот же лэйаут, что `/players` (зелёный `PageHeader` + единый toolbar). Убрать разделение «Мои» / «Все» как разные секции с разными стилями — заменить на единый список с переключателем.

### Решённые продуктовые вопросы

- Старый таб-переключатель «Мои» / «Все» с разными UI заменён единым списком и **scope-pills** «Все» / «Только мои»
- Дефолтная сортировка `Сначала мои` — мои команды рендерятся сверху отдельной группой под эйбрау «Мои · N», ниже эйбрау «Все остальные» с пагинацией. Альтернатива sort: «Недавние» — плоский список с бейджем «Капитан» / «Я в составе» на моих строках
- В правиле дизайн-системы зафиксировано: `FilterPills` теперь используется в двух разных ролях — multi-pill быстрого фильтра (как у `/players`) и **binary toggle scope-переключателя** (как у `/teams`). Не смешиваем

### Backend / API

- ✅ `GET /api/teams` расширен: `q` (ilike по `name`), `exclude_ids` (csv) для отрисовки «всех остальных» без дублирования моих, возврат `total` (count exact)
- ✅ `GET /api/teams/stats?userId&city&sport` — счётчики `total / mine / lookingForPlayers` для green-header. Скоупится по applied-фильтру
- ✅ `GET /api/users/[id]/teams` теперь отдаёт полный набор полей команды (`description`, `created_at`, `looking_for_players`, `district`, `members_count`) + `role`. Используется как для секции «Мои» сверху, так и для бейджей в плоской ленте

### Frontend

- ✅ `src/components/teams/TeamListRow.tsx` — Avatar (инициал) + имя + бейдж (приоритет: «Капитан» > «Я в составе» > «Ищут игроков») + meta «Спорт · Район/Город» + members_count
- ✅ `src/components/teams/TeamFiltersSheet.tsx` — bottom-sheet (город, район, спорт, toggle «Ищут игроков»)
- ✅ `src/app/(app)/teams/page.tsx` полностью переписан под три режима тела: grouped / flat / only-mine
- ✅ Кнопка «+ Создать свою команду» теперь — текстовая кнопка снизу, не primary-CTA в хедере

### Не входит

- Логотип/обложка команды — нужна отдельная миграция и storage policy. Сейчас Avatar рендерит инициал
- Сортировка «По размеру» / «По активности» — отложено
- Применение того же шаблона к `/search` (events/venues) — будет отдельной итерацией

---

## ✅ Итерация 35 — Шапка и саб-навигация «Моя команда»

**Цель:** перевести `/team/[id]/*` на дизайн-систему: единый зелёный `PageHeader` со свитчером команды + underline-табы вместо chip-pills, как уже сделано в `/search/*`. Все четыре таба (Главная / Состав / События / Финансы) показывают контент **выбранной** в свитчере команды.

**Контекст.** Сейчас (`team/[id]/layout.tsx`) шапка — кастомная белая (имя команды + chevron + sport+city), саб-табы — chip-pills (зелёный активный, белый с `border` неактивный). Стилистически это ровно тот же паттерн, что был на `/search` до перехода на underline-табы — отличается от `/search` ничем кроме того, что тёмный фон в активной пилюле. На `/team/[id]/roster` шапка скрыта и используется собственный кастомный NavBar (он уйдёт в итерации 36 целиком).

### Шапка (`team/[id]/layout.tsx`, общая для всех табов)

- Зелёный `PageHeader` (диагональная текстура, скругление 28px снизу) — тот же, что в `/search/*`
- **Title** — название команды (Oswald uppercase 30px white). При `myTeamCount ≥ 2` — title-кнопка с `<ChevronDownIcon/>` справа, тап → `TeamSwitcherSheet` (BottomSheet, уже существует, не трогаем). При 1 команде — plain title без chevron
- **Subtitle** под title (`text-[13px]` на `rgba(255,255,255,0.7)`): `Город · Спорт`
- **Stats** (`HeaderStatGroup`, 3 × `HeaderStat`) на тёмной плашке `bg-black/18 backdrop-blur`:
  - «В составе N» — `members.length`
  - «Впереди M» — `teamStats.plannedEvents`
  - role-aware 3-я карточка:
    - *organizer:* «Долгов K ₸» (totalPlayersDebt, formatPrice без суффикса)
    - *player / guest:* «Сыграно K» — `teamStats.completedEvents`
- **Bell в top-right** (`onBellClick` + `hasBellDot`, organizer-only): иконка-колокол с red-dot если `pendingRequestsCount > 0`, тап → `TeamRequestsSheet` (общий sheet заявок). Заменяет дубликат-иконку «Заявки» в `RosterPage` NavBar (NavBar там уйдёт в итерации 36)

### Саб-навигация (`TeamSubNav`)

- Underline-табы как в `SearchSubnav`: текстовые линки, активный — `font-bold text-green-700` + 2.5px зелёный underline снизу, неактивный — `text-text-secondary` `font-medium`
- 4 таба: Главная / Состав / События / Финансы; «Финансы» — только для organizer
- Все `flex-1`, чтобы поделить ширину поровну (как `SearchSubnav`)
- `border-bottom 1px var(--gray-100)` под рядом, sticky `top-0`

### Скрытие шапки на дочерних роутах

- `/team/[id]/events/[eventId]` — шапка и саб-нав скрыты (как сейчас, у события свой `EventHero`)
- `/team/[id]/roster` — пока тоже скрыт (RosterPage свой). После итерации 36 шапка вернётся, и кастомный NavBar в RosterPage уйдёт

### Backend / API

- Расширить `team-context` — `useTeam()` уже возвращает `members`, `role`, `pendingRequestsCount`, `teamStats: { plannedEvents, completedEvents }`. Добавить `teamStats.totalPlayersDebt: number` (только для organizer, для player/guest — `null`)
- Расширить `GET /api/teams/[id]` (или endpoint, который дёргает team-context) — добавить `total_players_debt` рядом с `team_stats`. Источник — агрегация по `attendances` где `paid = false`, `attended = true` × `events.price_per_player` минус `paid_amount`. Логика уже существует на странице финансов — вынести в shared helper

### Frontend

- `src/components/ui/PageHeader.tsx` — добавить `titleSlot?: ReactNode` prop. Если задан — рендерится вместо `<h1>{title}</h1>` (нужно для team-страницы, чтобы воткнуть `<button><h1/><ChevronDown/></button>`). Стили Oswald 30px wrapper'ом не накладываем — title-slot сам отвечает за стили (но мы предоставим re-export `<HeaderTitle>` обёртку с этими стилями для удобства)
- `src/app/(app)/team/[id]/layout.tsx` — `TeamScreenHeader` переписать на `PageHeader` + `HeaderStatGroup` + bell. `TeamSubNav` — переписать на underline-стиль (можно вынести `<UnderlineTabs/>` примитив в `src/components/ui/`, чтобы переиспользовать с `SearchSubnav`)
- `src/components/ui/UnderlineTabs.tsx` — НОВЫЙ примитив: принимает `tabs: { label, href, exact?, hidden? }[]`, рендерит underline-стиль. `SearchSubnav` и `TeamSubNav` оба переходят на него
- `src/components/team/TeamRequestsSheet.tsx` — НОВЫЙ shared sheet заявок (выносим из `RosterPage.RequestsSheet`). Используется и шапкой в layout, и (опционально) карточкой на «Главной». Тело — то же что сейчас в `RosterPage.RequestsSheet`

### Дизайн-система

- В `docs/design/design-system.md` уточнить раздел `PageHeader`: помимо first-level каталог-страниц, зелёный `PageHeader` теперь применяется на team-странице (имя команды как title; switcher через chevron-кнопку; stats role-aware)
- Зафиксировать `UnderlineTabs` как переиспользуемый паттерн саб-навигации (был только в `SearchSubnav`)
- Удалить упоминание chip-pills саб-табов в team-layout (если есть)

### Не входит в итерацию 35

- Контент табов Главная / Состав / События / Финансы — переработка тела отложена в 36 / 37 / отдельные итерации
- Создание события (форма) — итерация 37
- Содержимое финансов и главной — отдельные итерации после 37

---

## ⬜ Итерация 36 — Состав v2 (Roster v2)

**Цель:** переработать `/team/[id]/roster` под шаблон `/search/players` (тот же тулбар, тот же `PlayerListRow`). Состав команды визуально становится «таким же обзором игроков, только заскоупленным на одну команду».

**Скоуп (детально пропишем перед стартом):**

- Использовать общую шапку и саб-табы из итерации 35 — кастомный NavBar (back / search / requests-icon) удаляется
- Тулбар: `ListSearchBar` + `ListMeta` (count + sort) + `FilterPills` (по позициям: Все / ВРТ / ЗАЩ / ПЗЩ / НАП) + опц. `ActiveFilterChips`
- Sort: «По уровню» (default) / «Недавние» / «Сначала организаторы» (для группировки по роли)
- Список: `PlayerListRow` (тот же, что на `/search/players`). Бейдж «Капитан» / «Организатор» — у организаторов
- Тап на строку → открывает `PlayerSheet` (текущий шит из `RosterPage` с `Promote` / `Remove` для organizer; перерабатываем визуально под дизайн-систему)
- Заявки во вступление — кнопкой-bell в общей шапке (итерация 35), на странице состава отдельной кнопки нет
- «Найти игроков» — отдельной кнопки нет; пользователь идёт в `/search/players` через нижнюю нав

### Не входит

- Search-bar нужен (по подтверждению), хотя у команды обычно 10-30 человек — оставляем для единообразия с `/search/players`
- Группировка «ОРГАНИЗАТОРЫ / ИГРОКИ» как сейчас — заменяется sort'ом «Сначала организаторы» и бейджем

---

## ⬜ Итерация 37 — События команды v2

**Цель:** переработать `/team/[id]/events` под шаблон `/search/events` — тот же тулбар, тот же `EventListRow`. Внутри команды — список её событий с разделением Предстоящие / Прошедшие.

**Скоуп (детально пропишем перед стартом):**

- Использовать общую шапку и саб-табы из итерации 35
- Тулбар: `ListSearchBar` (опц., по типу) + `FilterPills` (Все / Игра / Тренировка / Сбор / Другое) + опц. `ActiveFilterChips`
- Список: `EventListRow` (тот же, что на `/search/events`); две секции — «Предстоящие» (planned) и «Прошедшие» (completed/cancelled), с эйбрау
- Создание события — органичный CTA в шапке: либо `HeaderActionButton` «+ Событие» в top-right, либо «+» FAB. Решим при имплементации; форма создания при тапе → bottom-sheet или отдельный роут `/team/[id]/events/new`
- Рефакторинг формы `CreateEventForm` под текущие токены (vk-style native selects → `SheetChipGroup` / `Picker`) — отдельной задачей внутри итерации, форма мигрирует на полноэкранный sheet

### Не входит

- Полная переработка события-детали (`/team/[id]/events/[eventId]`) — она уже сделана в итерации 32
- Расширенные фильтры по дате (week/month picker) — отложено

---

