# Таб «Состав»

## Структура экрана

### Сводка (все участники)

- `StatCard` — «Состав команды» с общим числом участников
- Два `MiniStatCard`: «N вратарей» (danger если 0) и «N без позиции» (warning если > 0)

### Фильтр по позиции

Горизонтальный ряд `Pill` чипов (filter / filterActive):
`Все` / `Вратари` / `Защитники` / `Полузащ.` / `Нападающие` / `Универсалы`

Фильтр применяется только к группе «Игроки». Организаторы всегда отображаются.

### Группы участников

Две секции, разделённые `SectionEyebrow`:
- **ОРГАНИЗАТОРЫ · N** (tone="primary")
- **ИГРОКИ · N / total** (tone="muted", при фильтре — N / total)

Участники внутри `Card` (padding="sm") с `divide-y divide-border`.

### Строка игрока

`Avatar` (size="sm") + имя (`text-[15px] font-semibold`) + позиция (`text-[13px] text-foreground-secondary`) + `MiniBar` уровня (5 баров, если skill_level задан).

Вся строка — кнопка, открывает `PlayerCard` (bottom-sheet).

### PlayerCard (bottom-sheet)

Показывает финансовое сальдо + историю платежей.

Организатор дополнительно видит (если не сам):
- Кнопка «Сделать организатором» (для игроков) — `Button variant="secondary"`
- Кнопка «Удалить из команды» — `Button variant="danger"`

Действия закрывают шит и вызывают `reload()`.

### Пустое состояние

`EmptyState` с иконкой и CTA «Найти игроков» → `/players` (только организатор).

---

## API

Данные берутся из `TeamContext` (загружаются при открытии команды).

`GET /api/teams/[id]` возвращает `members` с полями `user.position` и `user.skill_level`.

Действия организатора:
- Промоут: `PATCH /api/teams/[id]/members/[memberId]` `{ userId }`
- Удаление: `DELETE /api/teams/[id]/members/[memberId]?userId=`
