# Каталог игроков

Публичный список зарегистрированных пользователей с фильтрами и переходом в профиль.

## Страницы

- `/players` — каталог с фильтрами
- `/players/[id]` — публичный профиль игрока (read-only)

## Поля профиля (итерация 12)

Новые поля в таблице `users`:

| Поле | Тип | Описание |
|------|-----|----------|
| bio | text | Текст о себе |
| birth_date | date | Дата рождения (возраст вычисляется) |
| position | text | Игровая позиция |
| skill_level | text | Уровень игры |
| preferred_time | text | Предпочтительное время тренировок |
| looking_for_team | boolean | Ищет команду (default false) |

## API

### GET /api/players

Список игроков с `onboarding_completed = true`. Дефолтный лимит 50.

Фильтры (query params):
- `?city=` — ilike поиск по городу
- `?looking_for_team=true` — только ищущие команду
- `?position=` — ilike поиск по позиции
- `?limit=` и `?offset=` — пагинация (максимум 100)

Ответ: `{ players: [{ id, name, city, position, skill_level, looking_for_team }] }`

### GET /api/players/[id]

Публичные данные конкретного игрока.

Ответ: `{ player: { id, name, city, sport, position, skill_level, preferred_time, bio, birth_date, looking_for_team, created_at } }`

404 если пользователь не найден или `onboarding_completed = false`.

### GET /api/users/[id]/stats

Статистика игрока по completed событиям.

Ответ:
```json
{
  "playedCount": 12,
  "votedYesCount": 15,
  "attendedCount": 13,
  "reliability": 87,
  "recentEvents": [{ "event_id", "type", "date", "vote", "attended" }]
}
```

- `reliability` — `round(attendedCount / votedYesCount * 100)`. `null` если `votedYesCount = 0`
- `recentEvents` — последние 10 completed событий, где есть attendance запись

## UI

### Список `/players`

- Тёмный хедер «Игроки»
- Фильтры: поле города, поле позиции, pill-кнопка «Ищет команду» (toggle)
- Список карточек: имя, город · позиция · уровень, бейдж «Ищет команду» (если true)
- Клик → `/players/[id]`
- Empty state при пустом результате

### Профиль `/players/[id]`

- Тёмный хедер: имя, бейджи (город, спорт, «Ищет команду»)
- Секция «О себе»: bio, позиция, уровень, возраст, предпочтительное время
- Секция «Статистика»: сыграно, надёжность (%), подпись «X из Y событий»
- Секция «Последние события»: список с маркерами «Был» / «Не пришёл»
- Все данные read-only
