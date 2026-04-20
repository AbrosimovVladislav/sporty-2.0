# Профиль (`/profile`)

Личные данные пользователя с тремя табами и историей заявок.

## Хедер

Тёмный блок с именем пользователя, бейджами (город, спорт) и переключателем «Ищу команду / Не ищу команду». Тоггл обновляет `users.looking_for_team` через `PUT /api/users/[id]/profile`.

## Табы

### Обо мне

Inline-редактирование полей профиля. Клик по полю → input/textarea, blur или Enter → сохраняет через API.

| Поле | Описание |
|------|----------|
| О себе (bio) | textarea |
| Позиция | text |
| Уровень (skill_level) | text |
| Время тренировок (preferred_time) | text |
| Возраст (birth_date) | date-input, отображается вычисленный возраст |

### Результаты

Грид 2×2: сыгранные матчи (реальное число из `/api/users/[id]/stats`). Победы, передачи, карточки — «—» с пометкой «скоро».

### Надёжность

SVG circular progress (`CircularProgress.tsx`) + процент надёжности + подпись «X из Y событий». Список последних 10 completed событий с маркерами «Был» / «Не пришёл».

Надёжность = `round(attendedCount / votedYesCount * 100)`. Если `votedYesCount = 0` — пустое состояние.

## Мои заявки

Раздел под табами. Скрыт если заявок нет. Список поданных заявок со статусами (`на рассмотрении` / `принята` / `отклонена`) → подробнее: [[team]-join-requests.md](../team/[team]-join-requests.md)

## API

- `PUT /api/users/[id]/profile` — обновление полей: `bio`, `birth_date`, `position`, `skill_level`, `preferred_time`, `looking_for_team`. Возвращает обновлённый объект `user`.
- `GET /api/users/[id]/stats` — надёжность и статистика (см. [[player]-catalog.md]([player]-catalog.md))
