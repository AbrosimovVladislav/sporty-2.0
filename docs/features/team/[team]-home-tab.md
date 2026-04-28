# Таб «Главная команды»

Дашборд команды: ближайшее событие как primary-блок + аналитика за 30 дней (активность, лидеры, финансы для оргов). Первое, что видит пользователь после захода в команду.

Маршрут: `/team/[id]`. Шапка и саб-табы — общие из `team/[id]/layout.tsx` (см. [[team]-public-view.md]([team]-public-view.md) и итерация 35/41).

## Структура экрана (top-down)

### 1. Ближайшее событие — primary-блок

Тёмная карточка (`gray-900`) с фото-баннером 120px (если у площадки есть `photo_url`, иначе градиент):
- Внизу фото — countdown-чип «через 2 дня» (зелёная точка)
- Название типа события (Oswald uppercase, 22px белым) + полная дата с временем
- Внизу строка: иконка-pin + название площадки + «N / M» (явка) + цена с игрока (если > 0)
- Тап → `/team/[id]/events/[eventId]`

Если ближайшего события нет — light-карточка с calendar-иконкой и CTA «Создать событие →» (для оргов).

Это **отличается от Hero на `/home`**: на главной приложения показывается ближайшее событие пользователя из ВСЕХ команд, тут — только этой команды.

### 2. Активность · 30 дней

`bg-primary` карточка с двумя верхними блоками и mini-bar-chart:
- Слева: bignum «N событий» (Oswald 28px) + trend-стрелка vs предыдущие 30 дней («↑ +2», «↓ −1» или скрыта если delta=0)
- Справа: «Явка · X%» (Oswald 22px зелёным)
- Снизу: горизонтальный 4-сегментный bar chart по неделям, под каждым столбиком — число событий

Скрывается если `eventsCount === 0` за оба периода.

### 3. Лидеры · 30 дней

`bg-primary` карточка с `grid-cols-3`. Топ-3 игрока по числу attended-событий в окне 30 дней:
- Avatar (фото из `users.avatar_url` если есть, иначе инициал на зелёном)
- Бейдж-цифра ранга (1: green-500, 2: gray-400, 3: gray-300) в bottom-right аватара
- Имя (firstName) + «N матчей · X%»
- Тап → `/players/[id]`

Скрывается если `topPlayers.length === 0`.

### 4. Финансы · 30 дней (только organizer)

`bg-primary` карточка с border, кликабельная → `/team/[id]/finances`:
- Слева: bignum `+12 500 ₸` (Oswald 28px), цвет — green-600 если ≥0, danger если <0; trend-стрелка vs прошлые 30 дней
- Справа: две узкие колонки — «Сборы · N ₸», «Расходы · M ₸»

Скрывается если данных нет (`finance30d === null` для не-organizer, либо все нули).

### 5. Заявки (только organizer, если `pendingRequestsCount > 0`)

One-line карточка `bg-green-50` с иконкой колокола → клик открывает тот же `TeamRequestsSheet`, что и bell в шапке (через `useTeamUI().openRequests()`).

Текст: «N новых заявок» + «Открыть и решить →».

### 6. Набор игроков (только organizer)

Компактная одиночная toggle-строка `flex justify-between` с label «Набор игроков» + подзаголовком («Открыт — отображается в каталоге» / «Закрыт») + green switch. Меняет `teams.looking_for_players` через `PATCH /api/teams/[id]`.

### 7. Гость — `GuestJoinBar` (BottomActionBar)

См. [[team]-join-requests.md]([team]-join-requests.md): pending → «Заявка отправлена» + «Отозвать»; rejected с активным cooldown → «Можно подать снова через X дней»; иначе — primary «Подать заявку».

### Empty state (нет событий вообще)

Если `teamStats.completedEvents + plannedEvents === 0` — рендерим один большой блок (`bg-primary`, центрированный): иконка-календарь + «Команда только начинает» + подсказка + (для orgs) кнопка «Создать первое событие». Все остальные блоки в этом состоянии скрыты.

## API

- **`GET /api/teams/[id]/insights?userId=`** — единый запрос для всех блоков:
  - `nextEvent` — ближайшее planned-событие с venue и `yesCount`. Гостям показываем только `is_public=true`
  - `activity` — `eventsByWeek[4]`, `eventsCount`, `eventsCountPrev`, `attendanceAvg`, `attendancePrevAvg` (текущие 30 дней + предыдущие 30 для трендов)
  - `topPlayers[≤3]` — отсортированы по `played` desc
  - `finance30d` — `{ collected, venuePaid, netDelta, prevNetDelta }`. Возвращается только для `organizer`, иначе `null`
- **`PATCH /api/teams/[id]`** — обновление `looking_for_players`
- **`POST /api/teams/[id]/join`** — guest подаёт заявку (см. join-requests doc)

Управление заявками организатором — целиком через bell в шапке (`TeamRequestsSheet`), счётчик на главной — лишь напоминание.
