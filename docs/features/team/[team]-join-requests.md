# Заявки и приглашения

Двунаправленный flow: игрок подаёт заявку в команду → организатор принимает/отклоняет; либо организатор приглашает игрока → игрок принимает/отклоняет. Внутри одной таблицы `join_requests` различаются полем `direction`: `player_to_team` / `team_to_player`.

## Точки создания

| Кто | Откуда | Эффект |
|-----|--------|--------|
| Игрок | `/team/[id]` (команда, где он не состоит) → `GuestJoinBar` снизу → «Подать заявку» | `POST /api/teams/[id]/join` → `direction=player_to_team`, `status=pending`. Telegram-уведомление всем организаторам команды |
| Организатор | `/players/[id]` (страница чужого игрока) → `BottomActionBar` «Пригласить в команду» → шит выбора своей команды | `POST /api/teams/[id]/invites` с `inviter_id` → `direction=team_to_player`. Telegram-уведомление приглашённому игроку |

## Где видно (со стороны игрока)

`/profile`, секция под табами:
- **«Меня пригласили · N»** — pending team_to_player. Карточка команды + «Пригласил X · вчера» + кнопки «Принять» / «Отклонить» (`POST /api/join-requests/[id]/respond`)
- **«Мои заявки в команды · N»** — pending player_to_team. Карточка команды + бейдж «На рассмотрении» + кнопка «Отозвать» (`DELETE /api/join-requests/[id]?userId=`)
- **«Показать историю · K»** — collapsed accordion. Resolved (accepted/rejected) ≤ 30 дней. Старше — скрыто

В `/team/[id]`, если зашёл в ту же команду:
- `GuestJoinBar`: pending → «Заявка отправлена» (disabled) + «Отозвать» (`DELETE`); rejected с активным cooldown → «Можно подать снова через X дней»; rejected с истекшим cooldown → активная primary «Подать заявку снова»

## Где видно (со стороны организатора)

Bell-иконка в `PageHeader` команды (red-dot если `pendingRequestsCount > 0`) → `TeamRequestsSheet`:
- **Tab «Входящие · N»** — pending player_to_team. Карточка игрока + кнопки «Принять» (`PATCH /api/teams/[id]/join-requests/[requestId]` `action=accept`) / «Отклонить» (`action=reject`)
- **Tab «Отправлены · M»** — pending team_to_player по этой команде. Карточка игрока + «Приглашён 3 дня назад» + кнопка «Отозвать» (`DELETE`)
- Если одна сторона пустая — таб-стрип скрыт, рендерится только непустая секция

`pendingRequestsCount` в bell-dot и счётчиках на главной — только incoming (player_to_team).

## Cooldown после отклонения

7 дней от `resolved_at` rejected-заявки игрока. Логика на сервере: `POST /api/teams/[id]/join` возвращает `409 { error: "cooldown", until: <iso> }` если cooldown активен. UI считывает `joinRequestCooldownUntil` из team-context и показывает обратный отсчёт в `GuestJoinBar`.

## Отзыв (withdraw / revoke)

`DELETE /api/join-requests/[id]?userId=` — единый endpoint для обеих сторон:
- Игрок может отозвать свою заявку (`direction=player_to_team`, `user_id=userId`)
- Орг может отозвать своё приглашение (`direction=team_to_player`, у `userId` есть `organizer` membership в `team_id`)

Только `status=pending`. Удаляет row физически (история не сохраняется при отзыве).

## API

| Endpoint | Назначение |
|----------|------------|
| `POST /api/teams/[id]/join` | Игрок подаёт заявку. Cooldown-check + Telegram-уведомление орг |
| `POST /api/teams/[id]/invites` | Орг приглашает игрока. Telegram-уведомление игроку |
| `GET /api/teams/[id]/join-requests?userId=` | Возвращает `{ incoming, outgoing }` (только для organizer) |
| `PATCH /api/teams/[id]/join-requests/[requestId]` | Орг решает по incoming-заявке |
| `POST /api/join-requests/[id]/respond` | Игрок решает по incoming-приглашению |
| `DELETE /api/join-requests/[id]?userId=` | Отзыв pending заявки/приглашения |
| `GET /api/users/[id]/join-requests` | Все заявки пользователя обоих направлений (с `created_at`, `resolved_at`) |
| `GET /api/users/[id]/pending-requests` | Сводка для главной: total + by_team входящих pending player_to_team по командам, где user — organizer |

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
| `resolved_at` | timestamp при переходе из pending в accepted/rejected. Используется для cooldown |
