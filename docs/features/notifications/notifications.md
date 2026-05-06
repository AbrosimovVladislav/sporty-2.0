# Уведомления

Единый in-app фид (колокольчик в `HomeHero` на `/home`) для всех событий, требующих внимания пользователя: приглашения, заявки, события, финансы, изменения состава.

Telegram-уведомления идут параллельно через тот же helper.

## Где видно

- **`/home` → колокольчик** в зелёной шапке. Бейдж с числом непрочитанных (`9+` если >9). Тап → `NotificationsSheet`
- **`NotificationsSheet`** — bottom-sheet (`--card` фон) со списком: иконка по типу, заголовок, подзаголовок, относительное время. Непрочитанные — bold-заголовок + зелёный bullet справа
- Кнопка «Прочитать все» сверху, если есть непрочитанные
- Тап по уведомлению → mark-as-read + переход по `payload.href`

## Модель `notifications`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | uuid pk | |
| `user_id` | uuid → users | получатель |
| `type` | text | enum-like, см. ниже |
| `payload` | jsonb | type-specific + всегда `href: string` |
| `read_at` | timestamptz \| null | null = непрочитано |
| `created_at` | timestamptz | |

Индексы: `(user_id, created_at desc)` для фида, частичный `(user_id, created_at desc) where read_at is null` для подсчёта badge.

## Типы

| Тип | Когда создаётся | Получатели | Иконка |
|-----|-----------------|------------|--------|
| `team_invitation_received` | `POST /api/teams/[id]/invites` | приглашённый | user-plus / зелёная |
| `team_join_request_received` | `POST /api/teams/[id]/join` | все organizers команды | user-plus / зелёная |
| `team_join_request_accepted` | accept в `PATCH .../join-requests/[reqId]` | автор заявки | user-plus / зелёная |
| `team_join_request_rejected` | reject там же | автор заявки | user-plus / `--danger-soft` |
| `team_invitation_accepted` | accept в `POST /api/join-requests/[id]/respond` | все organizers команды | user-plus / зелёная |
| `team_invitation_rejected` | reject там же | все organizers | user-plus / `--danger-soft` |
| `team_member_promoted` | `PATCH .../members/[memberId]` (promote) | promoted user | crown / зелёная |
| `team_member_removed` | `DELETE .../members/[memberId]` | removed user | × / `--danger-soft` |
| `event_created` | `POST /api/teams/[id]/events` | все участники команды кроме автора | calendar / синяя |
| `event_cancelled` | `PATCH .../events/[eventId]` со status=cancelled | все участники кроме автора | calendar / `--danger-soft` |
| `finance_payment_recorded` | `POST /api/teams/[id]/transactions` | плательщик (если ≠ confirmed_by) | $ / оранжевая |

## Payload-схемы

Все `payload` имеют поле `href: string` (куда вести при тапе). Дополнительно:

```ts
// team_*
{ team_id, team_name, actor_id?, actor_name? }

// event_*
{ team_id, team_name, event_id, event_type, event_date }

// finance_payment_recorded
{ team_id, team_name, amount, tx_kind: "deposit" | "event_payment", event_id }
```

## API

| Endpoint | Метод | Назначение |
|----------|-------|-----------|
| `/api/users/[id]/notifications?limit=` | GET | `{ notifications, unreadCount }` (по умолчанию 30, max 100) |
| `/api/users/[id]/notifications/mark-read` | POST | `{ ids: string[] }` или `{ all: true }` |

## Helper `lib/notifications.ts`

Единая точка отправки:

```ts
await notify(supabase, {
  userIds,
  type: "team_invitation_received",
  payload: { href, team_id, team_name, actor_id, actor_name },
  telegramText?, // optional fan-out в TG
  telegramDeepLink?,
});
```

Также экспортирует `getTeamOrganizers(supabase, teamId)` и `getTeamMembers(supabase, teamId)` для удобной выборки получателей.

Ошибки notify() молча проглатываются (логируется в `console.error`) — нотификации не должны ломать основной API-flow.

## Что не делается

- **Cron-уведомления** (напоминание проголосовать, минимум собран и т.п.) — нет планировщика, отдельная задача.
- **Realtime push в открытом UI** — фид перечитывается на открытие sheet'а; нет push'а через WebSocket / Supabase realtime.
- **Удаление старых записей** — для MVP оставляем накапливаться. Можно добавить TTL-cleanup задачей.
