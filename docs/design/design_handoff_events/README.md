# Handoff: Страница «События» (Events Search)

## Overview
Редизайн страницы поиска событий в мобильном приложении **Sporty**. Страница входит в раздел «Поиск» (4 саб-таба: **События** / Команды / Игроки / Площадки).

## About the Design Files
Файлы в этом пакете — **дизайн-референсы в HTML**. Задача — **воссоздать их в продакшн-кодобазе** (Next.js + Tailwind + Supabase) используя существующие компоненты и паттерны. НЕ копировать HTML напрямую.

## Fidelity
**High-fidelity (hifi)** — финальные цвета, типографика, отступы, иконки. Воспроизводить пиксель-в-пиксель.

---

## Новые компоненты (добавить в дизайн-систему)

### 1. Date-Time Calendar Tile (календарик даты/времени)
Компактный вертикальный блок, самый важный визуальный якорь строки.

**Размер:** 72px ширина, высота — по контенту (~90px).

**Структура сверху вниз:**
1. Зелёная шапка (день недели)
2. Крупное число (день)
3. Месяц мелким текстом
4. Разделитель + время

**Стили:**
- Container: `border-radius: 14px`, `overflow: hidden`, `bg: var(--bg-card)`, `border: 1.5px solid var(--border)`
- Шапка: `bg: var(--green-600)`, `color: #fff`, `font: Oswald 10px 600`, `letter-spacing: 0.08em`, `uppercase`, `padding: 5px 0 3px`
- День: `font: Oswald 28px 700`, `color: var(--text-primary)`, `line-height: 1`, `padding: 5px 0 0`
- Месяц: `font-size: 9px`, `weight: 700`, `color: var(--text-tertiary)`, `letter-spacing: 0.06em`, `uppercase`, `padding: 1px 0 4px`
- Время: `border-top: 1px solid var(--border)`, `font: Oswald 15px 600`, `color: var(--green-700)`, `letter-spacing: 0.02em`, `padding: 4px 0 6px`

### 2. Event Type Chip (бейдж типа события)
Цветной бейдж, отличается от статус-пилюли формой и размером.

**Стиль:** `padding: 3px 8px`, `border-radius: 8px`, `font-size: 11px`, `font-weight: 700`, `letter-spacing: 0.02em`, `border: 1px solid`

**4 типа:**

| Тип | bg | color | border |
|-----|----|-------|--------|
| Игра | `var(--green-100)` | `var(--green-700)` | `var(--green-200)` |
| Тренировка | `oklch(0.95 0.03 240)` | `oklch(0.45 0.14 240)` | `oklch(0.88 0.06 240)` |
| Сбор | `oklch(0.95 0.03 75)` | `oklch(0.52 0.14 75)` | `oklch(0.88 0.08 75)` |
| Другое | `var(--gray-100)` | `var(--gray-600)` | `var(--gray-200)` |

### 3. "Моя команда" Badge
Маленький бейдж рядом с названием команды или типом события.

**Стиль:** `padding: 2px 7px`, `border-radius: 8px`, `font-size: 10px`, `font-weight: 700`, `bg: var(--green-50)`, `color: var(--green-700)`, `border: 1px solid var(--green-200)`

### 4. People Count Icon
Filled иконка двух людей (Material Icons `supervisor_account`) + число.

**Стиль:** `color: var(--green-600)`, SVG `16×16`, viewBox `0 0 24 24`, `fill: currentColor`. Число: `font-size: 14px`, `font-weight: 600`, `gap: 3px`.

---

## Экран: Страница «События»

### Структура сверху вниз:

#### 1–5. Шапка, табы, поиск, чипсы, мета
Идентичны паттерну листинг-страниц (см. основной design-system.md). Отличия:

- **Green Header**: заголовок «СОБЫТИЯ»
- **Underline Tabs**: активный таб — «События» (первый)
- **Search placeholder**: «Команда, площадка…»
- **Quick pills**: Все / Игра / Трен. / Сбор / Другое (фильтр по типу события)
- **Sort pill**: «Сначала ближайшие ▾»

#### 6. Event List Row (строка события)

Три колонки в одном flex-контейнере:

```
┌─────────────────────────────────────────────────────┐
│ ┌────────┐  Тренировка  Моя команда    👥 1        │
│ │  ПН    │  ХК Волки                                │
│ │  05    │                                          │
│ │  МАЯ   │  Pole.kz                     1 000 ₸    │
│ │ 15:40  │  Бостандыкский р-н, ул. ...              │
│ └────────┘                                          │
└─────────────────────────────────────────────────────┘
```

**Layout:** `display: flex`, `gap: 12px`, `padding: 14px 16px`, `border-bottom: 1px solid var(--gray-100)`

**Левая колонка (72px):** Date-Time Calendar Tile (см. выше)

**Центральная колонка (flex: 1):**
- `display: flex`, `flex-direction: column`, `gap: 3px`, `align-self: stretch`
- **Строка 1:** Event Type Chip + опц. «Моя команда» badge (flex, gap 6)
- **Строка 2:** Название команды — `font-size: 16px`, `font-weight: 600`, `color: var(--text-primary)`, truncate
- **Spacer:** `flex: 1` — раздвигает верх и низ
- **Строка 3:** Название площадки — `font-size: 13px`, `color: var(--text-secondary)`, truncate
- **Строка 4:** Адрес площадки — `font-size: 12px`, `color: var(--text-tertiary)`, truncate

**Правая колонка (70px):**
- `display: flex`, `flex-direction: column`, `align-items: flex-end`, `justify-content: space-between`, `align-self: stretch`
- **Верх:** People Count Icon + число
- **Низ:** Стоимость — `font-size: 13px`, `font-weight: 600`, `color: var(--text-secondary)`, `tabular-nums`. Если money = 0 — пустой `<span>` (сохраняет space-between)

**Ключевой принцип:** площадка и адрес ПРИЖАТЫ К НИЗУ карточки благодаря `flex: 1` spacer между командой и площадкой. Это выравнивает нижнюю строку контента с нижней частью календарика и ценой.

---

## Interactions & Behavior

- **Quick pills**: клик переключает фильтр типа события, список фильтруется мгновенно
- **Search**: ilike по `teams.name`, `venues.name` (debounce 300ms)
- **City selector**: открывает bottom-sheet со списком городов
- **Filter button**: открывает sheet расширенных фильтров (город, район, период, цена, toggle «Только со свободными местами»)
- **Sort pill**: фиксировано «Сначала ближайшие» (дата asc)
- **Event row tap**: переход на детали события `/team/[teamId]/events/[eventId]`
- **Infinite scroll**: подгрузка следующей порции при скролле к концу

---

## Данные строки события

| Поле | Тип | Описание |
|------|-----|----------|
| `day` | string | День месяца, 2 цифры |
| `month` | string | Месяц, uppercase сокращ. (МАЯ, ИЮН) |
| `weekday` | string | День недели, uppercase сокращ. (ПН, ВТ, СР) |
| `time` | string | Время начала (HH:MM) |
| `team` | string | Название команды-организатора |
| `type` | enum | Тип: Игра / Тренировка / Сбор / Другое |
| `venue` | string | Название площадки |
| `address` | string? | Адрес площадки (опционален) |
| `myTeam` | boolean | Является ли команда «моей» |
| `people` | number | Кол-во записавшихся |
| `money` | number | Стоимость в ₸ (0 = бесплатно, не показывать) |

---

## Files

| Файл | Описание |
|------|----------|
| `Events Page.html` | Hi-fi прототип страницы событий (React/Babel) |
| `Design System.html` | Все компоненты дизайн-системы (обновлён новыми элементами) |
| `colors_and_type.css` | CSS-токены: цвета, тени, радиусы, шрифты |
