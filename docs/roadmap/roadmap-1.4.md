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

**Цель:** реализовать главную страницу строго по дизайну Claude Design (Home v8), сохранив всю существующую функциональность и добавив новые блоки.

### Структура (сверху вниз)

1. **Hero-зона** (зелёный фон `green-600` + диагональная текстура, скругление снизу 28px):
   - Header: «Привет, [имя]» + bell-иконка справа: red-dot если есть pending-заявки в команды-орг; тап → bottom-sheet со списком заявок (тап на пункт → переход к заявкам команды)
   - Тёмная карточка ближайшего события (`gray-900`):
     - Фото-баннер 140px с overlay-градиентом
     - Бейджи типа/статуса (top-left)
     - Countdown «через 2д» (Oswald, bottom-right на фото)
     - Заголовок команды (Oswald uppercase 22px белый)
     - 3 чипа: время, площадка, цена
     - Явка: вариант **bignum** — крупные «7 / 10» + 3-сегментный бар (yes / no / waiting) + легенда
     - RSVP-кнопки «Приду» / «Не приду» с галочкой на выбранной

2. **Карточка заявок** (только орг, только если есть):
   - Иконка + «3 заявки во вступление» + «ХК Волки · 2, ХК Лагман · 1» + бейдж счётчика
   - Тап → переход к экрану заявок (если одна команда — сразу туда; если несколько — выбор)

3. **Quick Actions** (grid-2):
   - Primary «Найти событие» → `/search` (вкладка «События»)
   - Secondary «Найти команду» → `/search` (вкладка «Команды»)

4. **Мои команды (пульс)** (горизонтальный скролл):
   - 200px карточки: лого (gradient), название, спорт+город, пилюля ближайшего события, 3 stat-колонки (явка / долгов / заявок)
   - Только организаторы видят заявки и долги; для player-команд — только явка
   - Тап → `/team/[id]`

5. **Расписание** (вертикальный список):
   - 3 ближайших события **после** hero-события (дата + день недели как Oswald-стрипа на фото, статус явки top-right pill, низ — название + meta)
   - Линк «Все события →» в шапке секции → `/search?my=1` (фильтр «события моих команд»)

6. **Bottom nav** — без изменений (уже есть в `(app)/layout.tsx`)

### Backend / API

- ⬜ Расширить `GET /api/users/[id]/next-event` — добавить `no_count`, `waiting_count`, `total_members` для трёхсегментного бара
- ⬜ Новый: `GET /api/users/[id]/pending-requests` — для блока заявок (только команды, где user = organizer; группировка по командам)
- ⬜ Новый: `GET /api/users/[id]/teams-pulse` — массив команд пользователя с агрегатами: ближайшее событие, явка/min, долги, заявки
- ⬜ Новый: `GET /api/users/[id]/schedule?limit=3&offset=1` — следующие N событий после ближайшего, со статусом явки пользователя
- ⬜ Расширить `GET /api/events/public` — поддержать `?my=1&userId=...` для фильтра «события моих команд» (фильтр игнорирует `is_public`)

### Frontend

- ⬜ Новые компоненты в `src/components/home/`:
  - `HeroEventCard.tsx` — тёмная карточка события + countdown + явка-bignum + RSVP
  - `RequestsCard.tsx` — карточка-сигнал заявок
  - `QuickActions.tsx` — пара кнопок «Создать / Найти»
  - `TeamPulseCard.tsx` — карточка команды для горизонтального скролла
  - `SchedulePreviewCard.tsx` — строка-карточка предстоящего события
- ⬜ Полный rewrite `src/app/(app)/home/page.tsx`
- ⬜ Search: принимать `?my=1` в `EventsTab.tsx`, передавать на API

### Утилиты / типография

- ⬜ Helper `formatCountdown(date)` → «сегодня», «завтра», «через 2д»
- ⬜ В `globals.css` уже есть `--font-display` (Oswald) — использовать для заголовков hero, countdown, дат расписания

### Затронутые файлы

```
docs/features/player/[player]-home.md          (уже обновлён в предыдущей итерации)
src/app/globals.css                             (возможно мелкие токены: bell red-dot)
src/app/(app)/home/page.tsx                     (rewrite)
src/app/(app)/search/EventsTab.tsx              (поддержка ?my=1)
src/app/api/events/public/route.ts              (фильтр my)
src/app/api/users/[id]/next-event/route.ts      (расширить)
src/app/api/users/[id]/pending-requests/route.ts  (NEW)
src/app/api/users/[id]/teams-pulse/route.ts       (NEW)
src/app/api/users/[id]/schedule/route.ts          (NEW)
src/components/home/HeroEventCard.tsx             (NEW)
src/components/home/RequestsCard.tsx              (NEW)
src/components/home/QuickActions.tsx              (NEW)
src/components/home/TeamPulseCard.tsx             (NEW)
src/components/home/SchedulePreviewCard.tsx      (NEW)
src/lib/format.ts                                (helper formatCountdown — может быть новым файлом)
```

### Порядок реализации

1. Backend: 3 новых API + расширение next-event
2. Search: поддержка `?my=1`
3. Компоненты в `src/components/home/`
4. Rewrite `home/page.tsx`
5. Smoke-тест на dev-сервере (организатор / игрок / гость без команд)

