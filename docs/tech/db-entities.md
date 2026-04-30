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
| bio | text? | Текст о себе |
| birth_date | date? | Дата рождения |
| position | text[]? | Игровые позиции (массив; игрок может иметь несколько амплуа) |
| skill_level | text? | Уровень игры |
| preferred_time | text? | Предпочтительное время тренировок |
| looking_for_team | boolean | Ищет команду (default false) |
| avatar_url | text? | URL фото профиля (Supabase Storage) |

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
| looking_for_players | boolean | Открыт ли набор игроков (default false) |

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
| district_id | uuid? | FK → District |
| photo_url | text? | Фото площадки |
| default_cost | numeric? | Стандартная стоимость аренды; авто-подставляется в форме создания события |
| phone | text? | Телефон администрации (контакт на странице площадки) |
| website | text? | Сайт / Telegram / любая URL-ссылка на площадку |
| description | text? | Описание площадки (свободный текст, выводится на странице площадки) |
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
| venue_cost | numeric | Стоимость аренды площадки (default 0) |
| venue_paid | numeric | Сколько уже перечислено площадке (default 0) |
| created_by | uuid | FK → User (организатор) |
| created_at | timestamp | Дата создания |
| is_public | boolean | Видно ли событие в публичном поиске (default false) |

---

## EventAttendance

Участие игрока в событии: голосование + факт посещения.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| event_id | uuid | FK → Event |
| user_id | uuid | FK → User |
| vote | enum? | `yes` / `no` (голос до события) |
| attended | boolean? | Был ли на событии |
| paid | boolean? | Deprecated — хранится для UI, финансы считаются из FinancialTransaction |
| paid_amount | numeric? | Deprecated — см. paid |

**Unique constraint:** (event_id, user_id)

---

## FinancialTransaction

Финансовая транзакция команды. Единственный источник истины для расчёта балансов.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| team_id | uuid | FK → Team |
| player_id | uuid | FK → User. Кто платит |
| amount | numeric | Сумма (всегда положительная) |
| type | enum | `event_payment` / `deposit` |
| event_id | uuid? | FK → Event (для event_payment; deposit — null) |
| note | text? | Комментарий |
| confirmed_by | uuid | FK → User (организатор, создавший транзакцию) |
| created_at | timestamptz | Дата создания |

**Правила:** транзакции создаёт только организатор. Для каждого игрока на каждое событие — не более одной `event_payment` транзакции (при изменении суммы — удаляется старая, создаётся новая).

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
Team  1──N FinancialTransaction
User  1──N FinancialTransaction (player_id)
Event 1──N FinancialTransaction (event_payment)
```

---

## Границы сущностей

| Вопрос | Сущность |
|--------|----------|
| Кто этот человек? | User |
| Что это за команда? | Team |
| Кто состоит в команде и в какой роли? | TeamMembership |
| Хочет ли игрок вступить? | JoinRequest |
| Где проводится событие? | Venue |
| Что и когда происходит? | Event |
| Кто придёт / был? | EventAttendance (vote, attended) |
| Кто сколько сдал? | FinancialTransaction |
