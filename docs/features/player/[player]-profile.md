# Профиль (`/profile`)

Личный профиль пользователя: компактный зелёный header + 4 underline-таба + секция «Мои заявки». Настройки — отдельным роутом `/profile/settings`.

## Header (компактный)

`PageHeader` с `--green-600` фоном, скруглением `0 0 28px 28px` и диагональным паттерном:
- **Аватар 72×72**, обводка `3px solid rgba(255,255,255,0.3)`, мягкая тень. Без фото — белый инициал на полупрозрачном фоне. Камера-кнопка 28×28 в правом нижнем углу (`rgba(0,0,0,0.4)` + backdrop-blur)
- **Имя**: Oswald 22px uppercase, белый
- **Subtitle**: «Город · Район» (`rgba(255,255,255,0.6)`)
- **Gear** 40×40 справа → `/profile/settings`

Без `HeaderStatGroup` — статы вынесены в таб «Обо мне».

Загрузка аватара: `POST /api/users/[id]/avatar` (multipart/form-data) → Supabase Storage bucket `avatars`. Лимит 10 МБ.

## Табы (4)

Underline-табы (state-based, sticky-top), равновесные слоты: **Обо мне / Результаты / Надёжность / Награды**.

### Обо мне

Все блоки — карточки `bg-bg-primary` `rounded-[16px]` `shadow-sm`, отступы между блоками `gap-3`.

1. **Рейтинг + Уровень** (двухколоночный `flex gap-3`, оба `flex-1`):
   - Слева: `RatingCircle` 56px + лейбл «Рейтинг» + значение Oswald 28px (число `users.rating` или «—»)
   - Справа: `LevelBadge size="large"` (38×44) + «Уровень» + название по таблице ниже
2. **Stats row** (`grid-cols-3 gap-3`): «Сыграно» / «Надёжность» / «Команд» — Oswald 28px, у «Надёжности» цвет `--primary` (зелёный)
3. **На поле** — `Eyebrow` + список `<PositionBadge>` для каждой позиции (`flex flex-wrap gap-2.5`)
4. **Info card** — три строки `Возраст / Город / Район` (label слева 14px secondary, value справа 14px semibold primary), border-bottom между, последний без
5. **Команда** — `Eyebrow` сверху, затем строки команд: 40×40 лого (или цветной квадрат `rounded-[12px]` с инициалом по `teamFallbackHue`) + название + chevron-right. Тап → `/team/[id]`

Уровень → название (через `levelName(code)`):

| Код | Название | Условие |
|-----|----------|---------|
| `aplus` | Элитный | rating ≥ 89 |
| `a` | Продвинутый | 73–88 |
| `b` | Уверенный | 56–72 |
| `c` | Средний | 26–55 |
| `d` | Начинающий | 0–25 |

### Результаты

- **Большая карточка**: `Eyebrow` «Сыграно матчей» + Oswald 48px (число `playedCount` из `/api/users/[id]/stats`)
- **Empty state**: 🏗️ + «Игровая статистика — в разработке» + сабтекст про будущие голы/передачи/MVP

### Надёжность

- **Индекс надёжности** (если `votedYesCount > 0`): большое число + знак % (Oswald 48 + 24) с подписью-меткой надёжности слева, кольцо-прогресс 80px (зелёное на `--green-100`) справа. Иначе — текст «Появится после первых завершённых событий»
- **Неприходы / Отмены** (двухколоночный): абсолютное число неприходов и процент отмен. Цвет числа всегда `--primary` (зелёный)
- **Посещаемость** — header «N / M» Oswald 24px + прогресс-бар 8px (`--green-100` фон, `--green-600` заливка) + подпись `${pct}%`
- **Последние события** — список последних 10 завершённых: точка-маркер 10px (зелёный/красный/серый), дата и тип события, статус справа («Был» / «Не был» / «Не голосовал»)

Надёжность = `round(attendedCount / votedYesCount * 100)`.

Метки надёжности: ≥90 «Стабильный игрок», ≥70 «Надёжный», ≥50 «Средняя надёжность», иначе «Низкая надёжность».

### Награды

Заглушка под будущую систему ачивок:
- Hero-карточка «Достижения копятся с каждым матчем» + сабтекст
- Сетка `grid-cols-3 gap-3`: 6 значков-плейсхолдеров (🥇 Первый матч / 🔥 5 подряд / 🏅 Капитан / ⭐ MVP / ☑️ 100% явка / 🏆 50 матчей) — все grayscale + opacity 0.45 + «скоро»

## Мои заявки

Секция под таб-контентом, видна на любом табе. Делится на три подраздела (каждый скрыт если пуст):

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
| `skill_level` | `SheetChipGroup` (single-select) — внутреннее поле, не выводится на профиле |
| `district_id` | `DistrictSelect` (показывается если есть город) |
| `preferred_time` | Пресет-чипы (Утром / Днём / Вечером / Выходные) + свободный input |
| `birth_date` | native date input |
| `looking_for_team` | toggle-row на всю ширину, активный — green-border |

Сохранение: sticky `BottomActionBar` с primary-кнопкой «Сохранить» → `PUT /api/users/[id]/profile` → редирект на `/profile`.

## API

- `GET /api/users/[id]` — полный объект пользователя (`district`, `district_id`, профильные поля)
- `PUT /api/users/[id]/profile` — обновление профильных полей. Возвращает обновлённый `user`
- `POST /api/users/[id]/avatar` — загрузка аватара (multipart/form-data, поле `file`). Возвращает обновлённый `user`
- `GET /api/users/[id]/stats` — `playedCount`, `votedYesCount`, `attendedCount`, `reliability`, `recentEvents`
- `GET /api/users/[id]/teams` — список команд пользователя с `id`, `name`, `logo_url` (плюс `district`, `members_count`, `role`)
- `GET /api/users/[id]/join-requests` — список заявок текущего пользователя обоих направлений
- `POST /api/join-requests/[id]/respond` — `accept` / `reject` входящих приглашений
- `DELETE /api/join-requests/[id]?userId=` — отзыв своей pending заявки
