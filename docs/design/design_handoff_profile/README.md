# Handoff: Страница «Профиль» (Profile Page v1)

## Overview
Страница профиля пользователя в мобильном приложении **Sporty** — платформе для организации любительского спорта. Содержит личную инфу, рейтинг, уровень, статистику матчей, индекс надёжности и значки достижений. Открывается из таб-бара (вкладка «Профиль»).

## About the Design Files
Файлы в этом пакете — **дизайн-референсы в HTML**. Это прототипы, показывающие целевой внешний вид и поведение. Задача — **воссоздать их в продакшн-кодобазе** (Next.js + Tailwind + Supabase) используя существующие компоненты и паттерны. НЕ копировать HTML напрямую.

## Fidelity
**High-fidelity (hifi)** — финальные цвета, типографика, отступы, иконки. Воспроизводить пиксель-в-пиксель.

---

## Реюзаемые компоненты (уже описаны в Players-handoff и Design System)

Эти компоненты уже задокументированы в дизайн-системе и используются на странице профиля без изменений:

- **Position Badge** (`pos-nap` / `pos-pzsh` / `pos-zash` / `pos-vrt`) — hex 26×30 + pill
- **Level Badge** (`lvl-aplus` / `lvl-a` / `lvl-b` / `lvl-c` / `lvl-d`) — hex с буквой
- **Rating Circle** — кольцо-прогресс с числом

Спецификации цветов/градиентов/clip-path см. в `Design System.html` и `colors_and_type.css`.

---

## Структура экрана сверху вниз

### 1. Green Header (компактный)
- Background: `var(--green-600)`, border-radius: `0 0 28px 28px`
- Padding: `20px 20px 24px`
- Диагональная текстура: repeating-linear-gradient 135deg, opacity 0.06
- Position: relative, overflow: hidden

**Layout:** flex row, gap 16, align-items center

**Элементы:**
- **Avatar (left, flex-shrink 0):**
  - 72×72, border-radius 9999, border `3px solid rgba(255,255,255,0.3)`
  - box-shadow `0 4px 12px rgba(0,0,0,0.2)`
  - Внутри `<img>` с object-fit cover
  - Camera-button overlay в правом нижнем углу: 28×28 круг, `bg: rgba(0,0,0,0.4)`, `backdrop-filter: blur(8px)`, border `2px solid rgba(255,255,255,0.2)`. Иконка камеры, белая, 14px

- **Name + location (flex 1, min-width 0):**
  - Имя: Oswald, 22px, weight 700, uppercase, letter-spacing 0.02em, color #fff, line-height 1.15
  - Локация: 13px, color rgba(255,255,255,0.6), margin-top 4. Формат: `Город · Район`

- **Settings (right, flex-shrink 0):**
  - 40×40 круг, `bg: rgba(255,255,255,0.12)`
  - Иконка шестерёнки 22×22, белая, opacity 0.8

### 2. Tabs (sticky-style, plain underline)
- Display: flex, background `var(--bg-primary)`, border-bottom 1px `var(--gray-100)`
- 4 равных таба: **Обо мне / Результаты / Надёжность / Награды**
- Активный: padding `12px 0`, font 13px weight 700, color `var(--green-700)`, border-bottom 2.5px solid `var(--green-700)`
- Неактивный: weight 500, color `var(--text-secondary)`, border-bottom 1px transparent

### 3. Body (зависит от выбранного таба)
- Padding `16px 16px 16px`
- Display: flex column, gap 12
- Background всей body-области: `var(--bg-secondary)`

### 4. Bottom Nav
- `marginTop: auto`, background `var(--bg-primary)`, border-top 1px `var(--border)`
- Padding `8px 0 20px` (нижний padding под home indicator)
- 4 элемента flex 1: **Главная / Моя команда / Поиск / Профиль (active)**
- Каждый: иконка 24×24 + label 10px, gap 2
- Active: color `var(--green-600)`, weight 600
- Inactive: color `var(--text-tertiary)`, weight 500

---

## Таб «Обо мне»

В порядке сверху вниз, gap 12 между блоками:

### Rating + Level (двухколоночный flex, gap 12)
Две одинаковые карточки flex 1:

**Rating card:**
- bg `var(--bg-primary)`, border-radius `var(--radius-lg)`, padding 16, box-shadow `var(--shadow-sm)`
- Flex row, align center, gap 14
- `<RatingCircle rating={u.rating} lvl={u.lvl} size={56} />`
- Текст:
  - Label: 11px, uppercase, tracking 0.06em, weight 600, color `var(--text-tertiary)` — «Рейтинг»
  - Value: Oswald, 28px, weight 700, color `var(--text-primary)`, line-height 1.1

**Level card:**
- Те же стили
- `<LevelHex lvl={u.lvl} letter={u.lvlLetter} size="large" />` (38×44)
- Label «Уровень» + Value 17px weight 700 — название уровня (Элитный / Продвинутый / Уверенный / Средний / Начинающий)

### Stats row (3 колонки grid, gap 12)
Каждая ячейка:
- bg `var(--bg-primary)`, border-radius `var(--radius-lg)`, padding `14px 16px`, box-shadow `var(--shadow-sm)`, text-align center
- Value: Oswald, 28px, weight 700
- Label: 11px, color `var(--text-secondary)`, margin-top 2

| # | Value | Label | Value color |
|---|-------|-------|-------------|
| 1 | `gamesPlayed` | Сыграно | `var(--text-primary)` |
| 2 | `${reliability}%` | Надёжность | `var(--primary)` (зелёный) |
| 3 | `teamsCount` | Команд | `var(--text-primary)` |

### Positions card
- bg `var(--bg-primary)`, padding 16, border-radius lg, shadow sm
- Header: «НА ПОЛЕ» — 11px uppercase tracking 0.06em weight 600 tertiary, margin-bottom 10
- Контент: flex wrap, gap 10 — список `<PosBadge>` для каждой позиции игрока

### Info card (split-rows)
- bg `var(--bg-primary)`, border-radius lg, shadow sm, padding 0, overflow hidden
- 3 строки: **Возраст** (`${age} лет`), **Город**, **Район**
- Каждая строка:
  - Padding `13px 16px`, flex space-between, align center
  - Border-bottom 1px `var(--gray-100)` (последняя — без)
  - Label слева: 14px, color `var(--text-secondary)`
  - Value справа: 14px weight 600, color `var(--text-primary)`

### Team card
- bg `var(--bg-primary)`, border-radius lg, shadow sm, overflow hidden
- Header «КОМАНДА» — те же стили, padding `14px 16px 6px`
- Row: padding `10px 16px 14px`, flex align center, gap 12
  - Логотип: 40×40, border-radius 12, цветной фон, буква-инициал 16px weight 800 white
  - Имя команды: 15px weight 600 (flex 1)
  - Chevron-right 18px, stroke `var(--text-tertiary)`

---

## Таб «Результаты»

### Big match counter card
- bg `var(--bg-primary)`, padding `16px 16px 20px`, border-radius lg, shadow sm
- Label «СЫГРАНО МАТЧЕЙ» 11px uppercase tracking 0.06em weight 600 tertiary, margin-bottom 8
- Value: Oswald, **48px**, weight 700, color primary, line-height 1

### Empty state
- bg `var(--bg-primary)`, padding 24, border-radius lg, shadow sm, text-align center
- Иконка 🏗️, 36px, margin-bottom 8
- Title: «Игровая статистика — в разработке», 17px weight 700, margin-bottom 6
- Subtitle: «Скоро ты сможешь видеть свои голы, передачи, MVP-награды и другие показатели за каждый матч.», 14px, color secondary, line-height 1.5

---

## Таб «Надёжность»

### Reliability index card
- bg `var(--bg-primary)`, padding 20, border-radius lg, shadow sm
- Header «ИНДЕКС НАДЁЖНОСТИ» (тот же стиль), margin-bottom 12
- Контент: flex space-between, align center
  - Слева:
    - Большое число + знак %: Oswald, 48px (число) + 24px (%), weight 700
    - Подпись «Стабильный игрок», 14px secondary, margin-top 4
  - Справа: `<ReliabilityCircle percent={u.reliability} size={80} />` — то же что Rating Circle, но цвет всегда зелёный (`var(--green-600)` ring, `var(--green-100)` bg, без числа внутри)

### No-shows + cancellations (двухколоночный)
- Каждая карточка: bg primary, padding `14px 16px`, border-radius lg, shadow sm
- Label 11px uppercase weight 600 tertiary, margin-bottom 6
- Value: Oswald, 32px weight 700, color `var(--primary)` (зелёный, потому что 0 = хорошо)
- Карточки: «Неприходы» = `0`, «Отмены» = `0%`

### Attendance (явка) card
- bg primary, padding 16, border-radius lg, shadow sm
- Label «ПОСЕЩАЕМОСТЬ», margin-bottom 10
- Row flex space-between margin-bottom 8:
  - «из записанных событий», 14px secondary
  - `${attended} / ${total}`, Oswald 24px weight 700
- Progress bar: высота 8, bg `var(--green-100)`, border-radius 9999, overflow hidden
  - Fill: высота 100%, width `${pct}%`, bg `var(--green-600)`, border-radius 9999
- Подпись `${pct}%`, 13px secondary, margin-top 6

### Recent events list
- Header «ПОСЛЕДНИЕ СОБЫТИЯ», margin-top 4 + margin-bottom 10
- Контейнер: bg primary, border-radius lg, shadow sm, overflow hidden
- Каждая строка:
  - Padding `14px 16px`, flex align center, gap 10, border-bottom 1px `var(--gray-100)` (последняя без)
  - Маркер 10×10 круг, цвет статуса (`var(--green-600)` для «Был»)
  - Контент flex 1, font 15px:
    - Дата (primary) · Тип события (primary), разделитель серый
  - Status справа: 14px weight 600, цвет статуса

---

## Таб «Награды»

### Hero «coming soon»
- bg `var(--bg-primary)`, padding `24px 20px`, border-radius lg, shadow sm, text-align center
- Title: «Достижения копятся с каждым матчем», 17px weight 700, margin-bottom 6
- Subtitle: «Скоро появятся первые значки за активность и стабильность», 14px secondary, line-height 1.5

### Awards grid (3 колонки)
- Grid `1fr 1fr 1fr`, gap 12
- Каждая ячейка: bg primary, padding `18px 8px 14px`, border-radius lg, shadow sm, text-align center, **opacity 0.45** (lock state)
- Эмодзи 32px, margin-bottom 8, **filter: grayscale(1)**
- Label 13px weight 600 primary, line-height 1.3
- Подпись «скоро» 11px tertiary, margin-top 4

**6 placeholder-наград:**
1. 🥇 Первый матч
2. 🔥 5 матчей подряд
3. 🏅 Капитан
4. ⭐ MVP события
5. ☑️ 100% явка
6. 🏆 50 матчей

---

## Data Model (TypeScript-shape)

```ts
type ProfileUser = {
  name: string;            // "Владислав Абросимов"
  photo: string;           // URL
  city: string;
  district: string;
  age: number;
  lvl: 'aplus' | 'a' | 'b' | 'c' | 'd';
  lvlLetter: 'A+' | 'A' | 'B' | 'C' | 'D';
  rating: number;          // 0-100
  gamesPlayed: number;
  reliability: number;     // 0-100 (%)
  teamsCount: number;
  positions: Array<{
    pos: 'nap' | 'pzsh' | 'zash' | 'vrt';
    label: 'НАП' | 'ПЗЩ' | 'ЗАЩ' | 'ВРТ';
    icon: string;          // path to PNG
  }>;
  teams: Array<{
    name: string;
    color: string;         // OKLCH or hex
    letter: string;        // 1 char initial
  }>;
};
```

---

## Interactions & Behavior

- **Tabs:** клик переключает активный таб, контент свапается мгновенно. Состояние локально (useState).
- **Camera button на аватаре:** открывает picker для смены фото (camera/gallery sheet)
- **Settings:** переход на `/profile/settings`
- **Team row:** переход на `/teams/[id]`
- **Bottom Nav:** активный таб всегда «Профиль» (4-й элемент). Клик на другие — переход на соответствующий маршрут.
- **Empty states:** в табах «Результаты» и «Награды» — placeholder для будущих фич (значки/статы пока заблокированы).

---

## Design Tokens

См. `colors_and_type.css`. Ключевые:
- `--green-50` … `--green-900` (бренд)
- `--gray-50` … `--gray-900` (нейтрали)
- `--primary`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-accent`
- `--bg-primary`, `--bg-secondary`, `--bg-card`, `--border`
- `--radius-md`, `--radius-lg`
- `--shadow-sm`
- `--font-sans` (sans, основной), `--font-display` (Oswald, заголовки/числа)

---

## Assets

| Файл | Описание |
|------|----------|
| `assets/boot-icon.png` | Иконка бутсы (НАП), белая |
| `assets/target-icon.png` | Иконка прицела (ПЗЩ), белая |
| `assets/shield-icon.png` | Иконка щита (ЗАЩ), белая |
| `assets/glove-icon.png` | Иконка перчатки (ВРТ), белая |

Аватары и логотипы команд приходят из БД (URL).

---

## Files

| Файл | Описание |
|------|----------|
| `Profile Page.html` | Hi-fi прототип страницы профиля (React/Babel) |
| `Design System.html` | Все компоненты дизайн-системы на одной странице |
| `colors_and_type.css` | CSS-токены: цвета, тени, радиусы, шрифты |

---

## Open Questions for Implementation

1. Endpoint для смены аватара?
2. Источник списка «последних событий» — `/users/[id]/events?limit=N` ?
3. Логика расчёта `reliability` — на бэке или клиенте?
4. Куда ведёт клик по awards в будущем (страница достижений)?
