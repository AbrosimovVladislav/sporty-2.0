# Профиль (`/profile`)

Личный профиль пользователя с аватаром, 4 табами и историей заявок.

## Хедер

Тёмный блок с аватаром, именем и бейджами. Аватар — круглое фото 80px с overlay-кнопкой загрузки (иконка камеры). Без фото — инициалы. Бейджи: город, вид спорта, «Ищет команду» (если включено).

Загрузка аватара: `POST /api/users/[id]/avatar` (multipart/form-data) → Supabase Storage bucket `avatars` → обновляет `users.avatar_url`.

## Табы

### Обо мне

Read-only отображение заполненных полей профиля. Пустой профиль — подсказка перейти в Настройки.

| Поле | Отображение |
|------|-------------|
| bio | StatCard «Био» |
| skill_level + birth_date | Сетка 2×2: «Уровень» + «Возраст» (вычисленный) |
| position | Chip-теги «На поле» |
| preferred_time | StatCard «Время тренировок» |

### Результаты

StatCard «Сыгранные матчи» (реальное число из `/api/users/[id]/stats`). Голы, передачи, жёлтые, MVP — «—» с пометкой «скоро».

### Надёжность

SVG circular progress (`CircularProgress.tsx`) + процент + подпись. Статистика посещаемости: неприходы, отмены, прогресс-бар. Список последних событий с маркерами «Был» / «Пропустил».

Надёжность = `round(attendedCount / votedYesCount * 100)`. Если `votedYesCount = 0` — пустое состояние.

### Настройки

Форма редактирования всех полей профиля + toggle «Ищу команду» + кнопка «Сохранить». Единственное место редактирования профиля.

| Поле | Тип |
|------|-----|
| О себе (bio) | textarea |
| Позиция | text |
| Уровень (skill_level) | text |
| Время тренировок (preferred_time) | text |
| Дата рождения (birth_date) | date |
| Ищу команду (looking_for_team) | toggle |

Сохранение через `PUT /api/users/[id]/profile`.

## Мои заявки

Раздел под табами. Скрыт если заявок нет. Список поданных заявок со статусами (`на рассмотрении` / `принята` / `отклонена`) → подробнее: [[team]-join-requests.md](../team/[team]-join-requests.md)

## API

- `PUT /api/users/[id]/profile` — обновление полей: `bio`, `birth_date`, `position`, `skill_level`, `preferred_time`, `looking_for_team`. Возвращает обновлённый объект `user`.
- `POST /api/users/[id]/avatar` — загрузка аватара (multipart/form-data, поле `file`). Загружает в Storage bucket `avatars`, обновляет `users.avatar_url`. Возвращает обновлённый объект `user`.
- `GET /api/users/[id]/stats` — надёжность и статистика (см. [[player]-catalog.md]([player]-catalog.md))
