# Профиль (`/profile`)

Личный профиль пользователя: hero + 4 underline-таба + секция «Мои заявки». Настройки — отдельным роутом `/profile/settings`.

## Hero

Светлый блок (`bg-bg-primary`) с padding `pt-6 pb-5 px-4`:
- Аватар 96px по центру с `IconButton kind="on-photo"` (камера) поверх. Без фото — инициалы
- Имя 28px жирным по центру (`text-text-primary`)
- Под именем — «Город · Район» (`text-text-secondary` 13px)
- Опц. бейдж «Ищет команду» — pill `bg-green-50 text-green-700`
- **Gear-иконка top-right** → `Link` на `/profile/settings`

Загрузка аватара: `POST /api/users/[id]/avatar` (multipart/form-data) → Supabase Storage bucket `avatars` → обновляет `users.avatar_url`. Лимит 2 МБ.

## Табы

Underline-табы (state-based, sticky-top), 4 равновесных слота:

### Обо мне

Read-only отображение заполненных полей. Пустой профиль → empty-state c CTA «Заполнить профиль →» (на `/profile/settings`).

| Поле | Отображение |
|------|-------------|
| `bio` | Карточка с эйбрау «Био» + раскрытие Ещё/Скрыть после 120 символов |
| `skill_level` + возраст (`birth_date`) | Сетка 2×2 stat-tile (Oswald 28px) |
| `position` (csv) | Карточка «На поле» + chips |
| `preferred_time` | Карточка «Время тренировок» |

### Результаты

- StatCard «Сыграно матчей» (Oswald 40px, реальное число из `/api/users/[id]/stats`)
- Сетка 2×2 placeholder-карточек: Голы / Передачи / Жёлтые / MVP — с прочерком и подписью «скоро» (заглушка под будущий event-stats трекинг)

### Надёжность

- Карточка «Индекс надёжности» — крупное число + `CircularProgress` 72px. Пустое состояние «Появится после первых завершённых событий», если `votedYesCount === 0`
- Сетка 2×2: «Неприходы» / «Отмены» (число / процент). Зелёный цвет числа если 0
- Карточка «Посещаемость» — прогресс-бар + дробь N / M
- Список последних событий с цветной точкой (зелёный/красный/серый) + relative-date

Надёжность = `round(attendedCount / votedYesCount * 100)`.

### Достижения

Заглушка под будущую систему ачивок:
- Карточка «Достижения копятся с каждым матчем»
- Сетка 3×N значков-плейсхолдеров (Первый матч, 5 подряд, Капитан, MVP, 100% явка, 50 матчей) — все grayscale + «скоро»

## Мои заявки

Секция под табами, видна на любом табе. Делится на три подраздела (каждый скрыт если пуст):

- **«Меня пригласили · N»** — pending team_to_player. Карточка команды + «Пригласил X · вчера» + кнопки «Принять» / «Отклонить» (`POST /api/join-requests/[id]/respond`)
- **«Мои заявки в команды · N»** — pending player_to_team. Карточка команды + бейдж «На рассмотрении» + кнопка «Отозвать» (`DELETE /api/join-requests/[id]?userId=`)
- **«Показать историю · K»** — accordion (default свёрнут), показывает accepted/rejected ≤ 30 дней. Старше — скрыты полностью

Подробнее: [[team]-join-requests.md](../team/[team]-join-requests.md)

## Настройки (`/profile/settings`)

Отдельный роут с back-arrow. Форма редактирования:

| Поле | Контрол |
|------|---------|
| `bio` | textarea + счётчик 0/500 |
| `position` | Multi-select chip-toggles (POSITIONS["football"]) |
| `skill_level` | `SheetChipGroup` (single-select) |
| `district_id` | `DistrictSelect` (показывается если есть город) |
| `preferred_time` | Пресет-чипы (Утром / Днём / Вечером / Выходные) + свободный input |
| `birth_date` | native date input |
| `looking_for_team` | toggle-row на всю ширину, активный — green-border |

Сохранение: sticky `BottomActionBar` с primary-кнопкой «Сохранить» → `PUT /api/users/[id]/profile` → редирект на `/profile`.

## API

- `GET /api/users/[id]` — полный объект пользователя (`district`, `district_id`, профильные поля)
- `PUT /api/users/[id]/profile` — обновление: `bio`, `birth_date`, `position`, `skill_level`, `preferred_time`, `looking_for_team`, `district_id`. Возвращает обновлённый `user`
- `POST /api/users/[id]/avatar` — загрузка аватара (multipart/form-data, поле `file`). Возвращает обновлённый `user`
- `GET /api/users/[id]/stats` — `playedCount`, `votedYesCount`, `attendedCount`, `reliability`, `recentEvents`
- `GET /api/users/[id]/join-requests` — список заявок текущего пользователя обоих направлений с `created_at` и `resolved_at`
- `POST /api/join-requests/[id]/respond` — `accept` / `reject` входящих приглашений
- `DELETE /api/join-requests/[id]?userId=` — отзыв своей pending заявки
