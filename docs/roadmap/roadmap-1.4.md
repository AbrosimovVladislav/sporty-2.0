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

