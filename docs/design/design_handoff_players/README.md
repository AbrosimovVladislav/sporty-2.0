# Handoff: Страница «Игроки» (Players Search)

## Overview
Редизайн страницы поиска игроков в мобильном приложении **Sporty** — платформе для организации любительского спорта. Страница входит в раздел «Поиск» (4 саб-таба: События / Команды / Игроки / Площадки).

## About the Design Files
Файлы в этом пакете — **дизайн-референсы в HTML**. Это прототипы, показывающие целевой внешний вид и поведение. Задача — **воссоздать их в продакшн-кодобазе** (Next.js + Tailwind + Supabase) используя существующие компоненты и паттерны. НЕ копировать HTML напрямую.

## Fidelity
**High-fidelity (hifi)** — финальные цвета, типографика, отступы, иконки. Воспроизводить пиксель-в-пиксель.

---

## Новые компоненты (добавить в дизайн-систему)

### 1. Position Badge (бейдж позиции игрока)
Шестиугольник pointy-top с иконкой + пилюля справа.

**Структура:**
```
[hex: 26×30px] [pill: h18px, border-radius: 0 999px 999px 0]
```

**Hex:**
- Clip-path: `polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`
- Внешний слой (border): тёмный цвет позиции
- Внутренний слой (fill, inset 2px): gradient сверху вниз (светлее → темнее) + лёгкий белый overlay сверху
- Белая иконка по центру (PNG, ~15px)

**Pill:**
- Плотно к правой грани hex, без gap
- Левый край плоский, правый закруглённый
- border: 1.5px solid
- font: 10px, weight 800, letter-spacing 0.04em

**4 позиции:**

| Позиция | Код | Hex border | Hex fill gradient | Pill bg | Pill color | Pill border | Иконка |
|---------|-----|-----------|-------------------|---------|------------|-------------|--------|
| Нападающий | nap | `oklch(0.45 0.21 25)` | `oklch(0.66 0.22 25)` → `oklch(0.52 0.21 25)` | `oklch(0.97 0.018 25)` | `oklch(0.55 0.22 25)` | `oklch(0.86 0.10 25)` | boot-icon.png |
| Полузащитник | pzsh | `oklch(0.62 0.16 85)` | `oklch(0.86 0.18 85)` → `oklch(0.72 0.18 85)` | `oklch(0.97 0.04 85)` | `oklch(0.62 0.16 85)` | `oklch(0.84 0.13 85)` | target-icon.png |
| Защитник | zash | `oklch(0.42 0.14 145)` | `oklch(0.58 0.16 145)` → `oklch(0.46 0.16 145)` | `oklch(0.97 0.02 145)` | `oklch(0.48 0.16 145)` | `oklch(0.84 0.10 145)` | shield-icon.png |
| Вратарь | vrt | `oklch(0.55 0.13 240)` | `oklch(0.78 0.12 240)` → `oklch(0.64 0.14 240)` | `oklch(0.98 0.018 240)` | `oklch(0.56 0.16 240)` | `oklch(0.85 0.08 240)` | glove-icon.png |

### 2. Level Badge (бейдж уровня игрока)
Шестиугольник того же размера (26×30px) с буквой уровня внутри.

**Структура:**
- Тот же clip-path что у position badge
- Border (outer) + fill (inner, inset 2px) с gradient
- Буква: font-family Oswald, 14px (10px для "A+"), weight 700, color white, text-shadow

**5 уровней:**

| Уровень | Код | Буква | Border | Fill gradient |
|---------|-----|-------|--------|---------------|
| PRO | aplus | A+ | `oklch(0.35 0.22 280)` | `oklch(0.72 0.18 220)` → `oklch(0.58 0.22 270)` → `oklch(0.50 0.22 310)` |
| Продвинутый | a | A | `oklch(0.55 0.16 85)` | `oklch(0.92 0.16 95)` → `oklch(0.84 0.18 85)` → `oklch(0.78 0.16 80)` |
| Средний | b | B | `oklch(0.62 0.01 250)` | `oklch(0.90 0.01 250)` → `oklch(0.82 0.01 250)` → `oklch(0.78 0.01 250)` |
| Начинающий | c | C | `oklch(0.50 0.10 55)` | `oklch(0.78 0.08 60)` → `oklch(0.68 0.10 55)` → `oklch(0.62 0.10 50)` |
| Новичок | d | D | `oklch(0.25 0.01 80)` | `oklch(0.48 0.01 80)` → `oklch(0.38 0.01 80)` → `oklch(0.30 0.01 80)` |

### 3. Rating Circle (круг рейтинга)
Кольцо-прогресс с числом внутри. Цвет кольца и числа соответствует уровню игрока.

**Структура:**
- SVG circle, radius = (size - 7) / 2, stroke-width 3.5, stroke-linecap round
- Rotate -90deg (старт сверху)
- Фоновый круг: светлый оттенок цвета уровня
- Активный круг: основной цвет уровня, dasharray/dashoffset по значению рейтинга (0–100)
- Число: font-family Oswald, weight 700, tabular-nums, размер = size × 0.36

**Цвета по уровням:**

| Уровень | Ring stroke | Ring bg | Number color |
|---------|-----------|---------|-------------|
| A+ | `oklch(0.55 0.22 280)` | `oklch(0.90 0.08 280)` | `oklch(0.45 0.22 280)` |
| A | `oklch(0.78 0.18 85)` | `oklch(0.93 0.10 85)` | `oklch(0.62 0.18 85)` |
| B | `oklch(0.65 0.02 250)` | `oklch(0.90 0.01 250)` | `oklch(0.55 0.02 250)` |
| C | `oklch(0.62 0.12 55)` | `oklch(0.90 0.04 55)` | `oklch(0.52 0.12 55)` |
| D | `oklch(0.35 0.02 80)` | `oklch(0.80 0.01 80)` | `oklch(0.32 0.02 80)` |

### 4. Team Logos (логотипы команд на аватарке)
Круглые маленькие лого команд поверх аватара игрока.

**Правила позиционирования:**
1. Первый логотип стоит в базовой точке — `left: 32px, bottom: -2px` от аватара (52×52)
2. Если один — стоит один
3. Если несколько — первый на месте, следующие добавляются **вправо**
4. Наложение: `margin-left: -9px` (≈35% от 24px)
5. z-index растёт слева направо: **правый поверх левого**
6. Группа растёт вправо, не влево

**Стиль одного лого:**
- 24×24px, border-radius: 9999px
- border: 2.5px solid white
- Цветной фон команды
- Буква-инициал: 9px, weight 800, white

---

## Экран: Страница «Игроки»

### Структура сверху вниз:

#### 1. Green Header
- Background: `var(--green-600)`, border-radius: `0 0 24px 24px`
- Padding: `16px 16px 20px`
- Диагональная текстура: repeating-linear-gradient 135deg, opacity 0.08
- Заголовок: Oswald, 28px, bold, uppercase, tracking 0.02em, white

#### 2. Underline Tabs
- Flex, 4 равных таба: События / Команды / **Игроки** / Площадки
- Активный (Игроки): font-weight 700, color `var(--green-700)`, border-bottom 2.5px solid
- Неактивные: weight 500, color `var(--text-secondary)`
- Контейнер: border-bottom 1px `var(--gray-100)`

#### 3. Search Row
- Flex, gap 8, padding `12px 16px 0`
- **Search input**: flex 1, padding `12px 12px 12px 40px`, border-radius 14, border 1.5px `var(--border)`, bg `var(--bg-card)`, font 15px. Лупа 20px слева absolute.
- **City selector**: padding `12px 14px`, border-radius 14, bg `var(--bg-card)`, border 1.5px, font 14px weight 600. Chevron down 12px справа.
- **Filter button**: 46×46, border-radius 14, bg `var(--bg-card)`, border 1.5px. Иконка воронки 20px. Зелёный бейдж-счётчик: 18px circle, `bg-primary`, white, font 10px 700, абсолют top -4 right -4.

#### 4. Quick Filter Pills
- Grid 5 колонок, gap 6, padding `12px 16px 0`
- Позиции: Все / ВРТ / ЗАЩ / ПЗЩ / НАП
- Активная: bg `var(--gray-900)`, color white, border gray-900
- Неактивная: bg `var(--bg-card)`, color `var(--text-secondary)`, border `var(--border)`
- border-radius 10, padding `8px 4px`, font 12px 600

#### 5. Meta Row
- Flex space-between, padding `12px 16px 0`
- Слева: "РЕЗУЛЬТАТЫ · N", font 13px, color `var(--text-tertiary)`
- Справа: "По уровню ▾", pill с bg `var(--bg-card)`, border, border-radius 9999, padding `4px 12px`, font 13px 600, color `var(--text-accent)`

#### 6. Player Row (строка игрока)
- Flex, align-items center, gap 24, padding `14px 16px`, border-bottom 1px `var(--gray-100)`
- **Аватар**: 52×52, border-radius 9999, border 2px white, box-shadow `0 0 0 1px var(--border)`. Photo inside object-fit cover. Team logos positioned absolute.
- **Контент**: flex 1, min-width 0
  - Имя: font 16px, weight 600, truncate
  - Бейджи (margin-top 6): flex, gap 6, items center
    - Первый: Level Badge (hex с буквой)
    - Второй: Position Badge (hex с иконкой + pill)
- **Рейтинг**: Rating Circle, size 48

---

## Assets

| Файл | Описание |
|------|----------|
| `assets/boot-icon.png` | Иконка бутсы (нападающий), белая на прозрачном |
| `assets/target-icon.png` | Иконка прицела (полузащитник), белая на прозрачном |
| `assets/shield-icon.png` | Иконка щита (защитник), белая на прозрачном |
| `assets/glove-icon.png` | Иконка перчатки (вратарь), белая на прозрачном |
| `assets/lvl-a-plus.png` | Референс бейджа A+ (фиолетовый) |
| `assets/lvl-a.png` | Референс бейджа A (золотой) |
| `assets/lvl-b.png` | Референс бейджа B (серебряный) |
| `assets/lvl-c.png` | Референс бейджа C (бронзовый) |
| `assets/lvl-d.png` | Референс бейджа D (графитовый) |

## Files

| Файл | Описание |
|------|----------|
| `Players Page.html` | Hi-fi прототип страницы игроков (React/Babel) |
| `Design System.html` | Все компоненты дизайн-системы на одной странице |
| `colors_and_type.css` | CSS-токены: цвета, тени, радиусы, шрифты |
| `design-system.md` | Полный документ дизайн-системы (исходный) |
| `screenshots/` | Скриншоты для визуальной сверки |

## Interactions & Behavior

- **Quick pills**: клик переключает фильтр позиции, список фильтруется мгновенно
- **Search**: ilike по имени/команде (debounce 300ms)
- **City selector**: открывает bottom-sheet со списком городов
- **Filter button**: открывает sheet расширенных фильтров (город, район, позиция, toggle «Ищет команду»). Бейдж показывает количество активных фильтров.
- **Sort pill**: popover с опциями «По уровню» / «Недавние»
- **Player row tap**: переход на профиль игрока `/players/[id]`
- **Infinite scroll**: подгрузка следующей порции при скролле к концу списка
