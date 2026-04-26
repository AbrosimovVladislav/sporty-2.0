# Таб «Главная команды»

Дашборд команды. Первое, что видит пользователь после захода в команду.

## Структура экрана

### Сетка статистики (все участники)

`grid-cols-2` из четырёх кликабельных `MiniStatCard`:
- **В составе** → `/team/[id]/roster`
- **Запланировано** → `/team/[id]/events`
- **Проведено** (color="primary") → `/team/[id]/events`
- **Баланс** (color="primary"/"danger", только организатор) → `/team/[id]/finances`

Баланс подгружается отдельным запросом `GET /api/teams/[id]/finances`.

### Ближайшее событие

`Card` со ссылкой на детальный экран → `/team/[id]/events/[eventId]`. Если событий нет — блок не отображается. Данные из `GET /api/teams/[id]/next-event`.

### Входящие заявки (только организатор)

Показывается только при `pendingRequestsCount > 0`. `Card` с кнопкой «Посмотреть N заявок». Раскрывается в список с кнопками «Принять» / «Отклонить». Подробнее — [[team]-join-requests.md]([team]-join-requests.md).

### Управление (только организатор)

Секция с `SectionEyebrow` «Управление» + `Card`:
- **Набор игроков** — toggle (открыт / закрыт). Меняет `teams.looking_for_players` через `PATCH /api/teams/[id]`.

### Гость

`BottomActionBar` с кнопкой «Подать заявку» (primary). Если заявка уже отправлена — «Заявка отправлена» (secondary, disabled). Если отклонена — «Заявка отклонена» (secondary, disabled). Подробнее — [[team]-join-requests.md]([team]-join-requests.md).

---

## Хедер и навигация

Управляются через `team/[id]/layout.tsx`:
- `ScreenHeader` (light): название команды + «Город · Вид спорта», кнопка «Назад» → `/teams`
- Саб-навигация: чипы Pill (filter / filterActive) «Главная / Состав / События / Финансы»
