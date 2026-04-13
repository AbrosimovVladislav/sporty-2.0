# Сущности БД

## User

Пользователь Telegram. Единая сущность — роль определяется контекстом (создал команду = организатор, вступил = игрок).

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| telegram_id | bigint | Telegram user ID, unique |
| name | text | Имя (из Telegram или заданное) |
| city | text | Город |
| sport | text | Вид спорта (на старте — football) |
| created_at | timestamp | Дата регистрации |
| onboarding_completed | boolean | Прошёл ли онбординг |

---

## Team

Команда, созданная организатором.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| name | text | Название команды |
| sport | text | Вид спорта |
| city | text | Город |
| description | text? | Описание (опционально) |
| created_by | uuid | FK → User (организатор) |
| created_at | timestamp | Дата создания |

---

## TeamMembership

Связь пользователя с командой. Определяет роль.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| user_id | uuid | FK → User |
| team_id | uuid | FK → Team |
| role | enum | `organizer` / `player` |
| joined_at | timestamp | Дата вступления |

**Unique constraint:** (user_id, team_id)

---

## JoinRequest

Заявка игрока на вступление в команду.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| user_id | uuid | FK → User |
| team_id | uuid | FK → Team |
| status | enum | `pending` / `accepted` / `rejected` |
| created_at | timestamp | Дата заявки |
| resolved_at | timestamp? | Дата решения |

---

## Venue

Площадка, где проводятся события.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| name | text | Название |
| address | text | Адрес |
| city | text | Город |
| created_by | uuid | FK → User |
| created_at | timestamp | Дата создания |

---

## Event

Событие команды (игра, тренировка, сбор).

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| team_id | uuid | FK → Team |
| venue_id | uuid? | FK → Venue (опционально) |
| type | enum | `game` / `training` / `gathering` / `other` |
| date | timestamp | Дата и время |
| price_per_player | decimal | Стоимость с игрока |
| min_players | integer | Мин. кол-во игроков |
| description | text? | Описание |
| status | enum | `planned` / `completed` / `cancelled` |
| created_by | uuid | FK → User (организатор) |
| created_at | timestamp | Дата создания |

---

## EventAttendance

Участие игрока в событии: голосование + результат.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| event_id | uuid | FK → Event |
| user_id | uuid | FK → User |
| vote | enum? | `yes` / `no` (голос до события) |
| attended | boolean? | Был ли на событии (отметка игрока) |
| attended_confirmed | boolean? | Подтверждение организатора |
| paid | boolean? | Сдал деньги (отметка игрока) |
| paid_confirmed | boolean? | Подтверждение организатора |

**Unique constraint:** (event_id, user_id)

---

## Связи

```
User 1──N TeamMembership N──1 Team
User 1──N JoinRequest    N──1 Team
User 1──N EventAttendance N──1 Event
Team  1──N Event
Venue 1──N Event
User  1──N Team (created_by)
User  1──N Event (created_by)
User  1──N Venue (created_by)
```

---

## Границы сущностей

Простое правило: каждая сущность отвечает только за свой вопрос.

| Вопрос | Сущность | Не хранить в |
|--------|----------|-------------|
| Кто этот человек? | User | — |
| Что это за команда? | Team | — |
| Кто состоит в команде и в какой роли? | TeamMembership | User, Team |
| Хочет ли игрок вступить? | JoinRequest | User, Team |
| Где проводится событие? | Venue | Event |
| Что и когда происходит? | Event | Team |
| Кто придёт / был / сдал деньги? | EventAttendance | Event, User |

**Роль = контекст.** Один User может быть организатором одной команды и игроком другой. Роль живёт в TeamMembership, а не в User.

**Финансы = учёт.** Приложение не принимает деньги. Поля `paid` / `paid_confirmed` в EventAttendance — только фиксация факта.
