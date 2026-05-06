# Заявки и приглашения

Двунаправленный flow: игрок подаёт заявку в команду → организатор принимает/отклоняет; либо организатор приглашает игрока → игрок принимает/отклоняет. Одна таблица `join_requests` с полем `direction`: `player_to_team` / `team_to_player`.

## Точки создания

| Кто | Откуда | Эффект |
|-----|--------|--------|
| Игрок | `/team/[id]` (где не состоит) → `GuestJoinBar` → «Вступить в команду» | `POST /api/teams/[id]/join` → `direction=player_to_team`, `status=pending`. Notification + Telegram всем organizers |
| Организатор | `/players/[id]` → `BottomActionBar` «Пригласить в команду» → шит выбора команды | `POST /api/teams/[id]/invites` с `inviter_id` → `direction=team_to_player`. Notification + Telegram приглашённому |

## Где видит игрок (свои заявки/приглашения)

**Единственное место — `/profile` → таб «Обо мне» → `MyJoinRequests`**:
- **«Меня пригласили · N»** — pending `team_to_player`. Карточка команды + «Пригласил X · вчера» + кнопки «Принять»/«Отклонить» (`POST /api/join-requests/[id]/respond`)
- **«Мои заявки в команды · N»** — pending `player_to_team`. Карточка + пилюля «На рассмотрении» + кнопка «Отозвать» (`DELETE /api/join-requests/[id]?userId=`)
- **«Показать историю · K»** — collapsed accordion. Resolved за последние 30 дней. У rejected `player_to_team` записей — подсказка «Можно подать снова через N дней» (cooldown 7 дней)

В `/team/[id]` той же команды (`GuestJoinBar` под контентом):
- `pending` → «Заявка отправлена» + «Отозвать»
- `rejected` + cooldown активен → плейт `--danger-soft` «Подать заявку снова можно через N дней»
- `rejected` + cooldown истёк → primary «Подать заявку снова»
- `none` → primary «Вступить в команду»

## Где видит организатор (входящие в команду + свои приглашения)

**Главное место — главная команды `/team/[id]`**:

`TeamRequestsSection` — inline-аккордеон сразу после `NextEventCard` (только organizer, скрыт если `total === 0`):
- Свёрнутый: иконка-bell + «N заявок» + подзаголовок «K новых · M приглашений»
- Раскрытый: подзаголовок «Входящие · N» → карточки игроков + «Принять»/«Отклонить»; затем «Отправлены · M» → карточки + «Отозвать»
- Все действия inline, без отдельного шита

Резервные точки входа:
- Шестерёнка в `PageHeader` команды (red-dot если `pendingRequestsCount > 0`) → `/team/[id]/settings` → раздел «Заявки и приглашения» → `TeamRequestsSheet` (тот же компонент с табами как раньше — оставлен для resilience)
- Из колокольчика-уведомлений (тип `team_join_request_received`) тап ведёт на `/team/[id]`, аккордеон автоматически загружается с актуальным состоянием

`pendingRequestsCount` в red-dot шестерёнки + serverside hint для сворачнутого вида аккордеона — считается только incoming (`player_to_team`).

## Cooldown после отклонения

7 дней от `resolved_at` rejected-заявки игрока. На сервере `POST /api/teams/[id]/join` возвращает `409 { error: "cooldown", until: <iso> }`.

Видно игроку:
- На `/team/[id]` (`GuestJoinBar` показывает дни до возможности повторной подачи)
- На `/profile` в истории (`MyJoinRequests` подсказка «Можно подать снова через N дней» под rejected-записью)

## Повторное приглашение

На `/players/[id]` показывается секция «Уже приглашён» с активными pending team→player от команд, где смотрящий — organizer:
- Лого команды + название + «Отправлено N дней назад» + кнопка «Отозвать»
- В sheet выбора команды для нового приглашения те же команды отфильтрованы (`availableOrgTeams`)
- Источник — `GET /api/players/[id]/invites?inviterId=`

## Отзыв (withdraw / revoke)

`DELETE /api/join-requests/[id]?userId=` — единый endpoint для обеих сторон:
- Игрок отзывает свою заявку (`direction=player_to_team`, `user_id=userId`)
- Организатор отзывает своё приглашение (`direction=team_to_player`, у `userId` есть organizer-membership в `team_id`)

Только `status=pending`. Удаляет row физически.

## Уведомления

При accept/reject автору отправляется notification + Telegram (см. [notifications.md](../notifications/notifications.md)). Типы:
- `team_join_request_accepted` / `team_join_request_rejected` — автору заявки
- `team_invitation_accepted` / `team_invitation_rejected` — всем organizers команды

## API

| Endpoint | Метод | Auth | Назначение |
|----------|-------|------|------------|
| `/api/teams/[id]/join` | POST | userId | Подать заявку. Cooldown + notify orgs |
| `/api/teams/[id]/invites` | POST | inviter_id (organizer) | Пригласить игрока. Notify приглашённого |
| `/api/teams/[id]/join-requests?userId=` | GET | organizer | `{ incoming, outgoing }` команды |
| `/api/teams/[id]/join-requests/[requestId]` | PATCH | organizer | accept/reject заявки + auto-membership + notify |
| `/api/join-requests/[id]/respond` | POST | приглашённый | accept/reject приглашения + auto-membership + notify orgs |
| `/api/join-requests/[id]?userId=` | DELETE | автор или organizer | Отозвать pending |
| `/api/users/[id]/join-requests` | GET | — | Все заявки игрока (resolved + pending, обе стороны) |
| `/api/players/[id]/invites?inviterId=` | GET | inviterId (organizer хотя бы в одной команде) | Активные pending team→player к этому игроку от команд смотрящего |
| `/api/teams/[id]?userId=` | GET | — | Включает `joinRequestStatus`, `joinRequestId`, `joinRequestCooldownUntil`, `pendingRequestsCount` |

## Поля `join_requests`

| Поле | Описание |
|------|----------|
| `id` | uuid |
| `user_id` | пользователь — субъект (игрок) |
| `team_id` | команда |
| `status` | `pending` / `accepted` / `rejected` |
| `direction` | `player_to_team` / `team_to_player` |
| `invited_by` | uuid организатора, который пригласил (только для team_to_player) |
| `created_at` | timestamp создания |
| `resolved_at` | timestamp перехода из pending. Используется для cooldown |
