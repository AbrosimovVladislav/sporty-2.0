# Отметки посещения

Доступны только для завершённых событий (`status = 'completed'`).

## Игрок отмечает себя (self-mark)

Кнопки-тогглы на карточке события:
- **Был(а)** — `attended = true/false`
- **Сдал(а)** — `paid = true/false`

Игрок может изменить свою отметку в любое время.

## Организатор подтверждает

Организатор видит список всех участников с кнопками:
- **Был / Не был** — `attended_confirmed = true/false`
- **Сдал / Не сдал** — `paid_confirmed = true/false`

Под каждым участником показана его собственная отметка для сравнения.

## Приоритет значений

Финансы и статистика используют **подтверждённое значение** (organizer), с fallback на **отметку игрока**:

```
attended_confirmed ?? attended
paid_confirmed ?? paid
```

Если организатор не проставил подтверждение (`null`) — используется отметка игрока.

## API

`PATCH /api/teams/[id]/events/[eventId]/attendance`

Body:
- Игрок за себя: `{ userId, attended?, paid? }`
- Организатор за другого: `{ userId, targetUserId, attended_confirmed?, paid_confirmed? }`
