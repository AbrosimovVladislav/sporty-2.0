# Дизайн-система Sporty (v2)

Главный документ для любых изменений интерфейса. Перед задачей по UI читать целиком.

Источник: [docs/design/new design handoff/](new%20design%20handoff/) — `design-system/HANDOFF.md`, `tokens.css`, `Players.html`. Все токены — в [src/app/globals.css](../../src/app/globals.css).

> **v2 (2026-05).** Новая палитра: hex-зелёный (`--green-700` основной), ink-нейтрали (`--ink-100..900`), плотные позиции `pos-{fwd|mid|def|gk}-{bg|fg}`, рейтинг — 5 tier'ов с градиентным кольцом (`elite/high/mid/low/poor`). Новые компоненты: `PositionTag` (плоский тег вместо hex+pill), `RatingRing` (градиент-кольцо вместо `RatingCircle`), `SortPill` (зелёная pill-сортировка). Старые `LevelBadge`/`PositionBadge`/`RatingCircle` помечены legacy — мигрируем экранами.
> **Итерация 53 (v1).** Семейство hex-бейджей игрока: `HexBadge`, `PositionBadge` (hex+pill), `LevelBadge` (A+/A/B/C/D), `RatingCircle`. — *Legacy, используется в `TeamPlayerSheet` и публичном профиле до миграции*
> **Итерация 24.** Базовые компоненты `src/components/ui/`. `UIChromeContext` + `BottomTabs`. `BackButton` поддерживает `kind="light"|"on-photo"`.

---

## Принципы

- **Светло.** Базовый фон — белый и тёплый светло-серый. Тёмные блоки — только на фото-баннерах с градиентом.
- **Спокойно.** Много воздуха, тонкие границы, мягкие тени. Никаких контрастных рамок и плотных списков.
- **Спортивно.** Зелёный — единственный акцентный цвет. Красный/оранжевый — только смысл («дефицит», «риск»).
- **Иерархия числами.** Главный показатель — крупно. Подпись — мелко серым. Действие — справа.
- **Один смысл — один блок.** Если цифра уже показана сверху, не дублируй её ниже. Если есть «+12 ещё», не пиши рядом «всего 16».

---

## Цветовые токены

Все цвета — hex, в [src/app/globals.css](../../src/app/globals.css). Никаких хардкод-цветов в компонентах: только `var(--token)`.

### Brand Green

| Переменная | Hex | Где |
|------------|-----|-----|
| `--green-900` | `#0e4a35` | — |
| `--green-800` | `#125a3f` | hover на primary |
| `--green-700` | `#15694a` | **primary**: PageHeader, активный таб, кнопка primary |
| `--green-600` | `#1a7a55` | — |
| `--green-500` | `#1f8a60` | — |
| `--green-100` | `#d8eadf` | мягкие подложки бейджей |
| `--green-50`  | `#eaf3ee` | sort-pill bg, soft-success |

### Ink (нейтрали)

| Переменная | Hex | Где |
|------------|-----|-----|
| `--ink-900` | `#0c1411` | основной текст, имена, активный таб |
| `--ink-700` | `#2b3733` | вторичный текст в чипах |
| `--ink-500` | `#5c6a65` | мета, подписи, неактивный таб |
| `--ink-400` | `#8a9994` | плейсхолдер, disabled |
| `--ink-300` | `#b8c2bd` | тонкие границы |
| `--ink-200` | `#dde3df` | границы карточек, чипов |
| `--ink-100` | `#eef2ef` | разделители, фон-ин-карточке |

Старая шкала `--gray-*` остаётся как алиас на `--ink-*` для не-мигрированных экранов.

### Surfaces

| Переменная | Hex | Где |
|------------|-----|-----|
| `--bg`   | `#f6f7f5` | фон страницы (тёплый off-white) |
| `--card` | `#ffffff` | карточки, sheets, инпуты, фон списков |

Алиасы для совместимости: `--bg-secondary` → `--bg`, `--bg-primary` → `--card`.

### Position Colors

Простой плоский тег: `bg` + `fg` (без бордера, без градиента).

| Позиция | Код | BG | FG | Иконка |
|---------|-----|----|----|--------|
| Нападающий | `fwd` | `#fde8ea` | `#c93545` | boot.png (mask) |
| Полузащитник | `mid` | `#fff4dd` | `#c48a14` | crosshair (SVG) |
| Защитник | `def` | `#e2f3e8` | `#1a7a45` | shield (SVG) |
| Вратарь | `gk` | `#e0effd` | `#2a6ec2` | glove.png (mask) |

CSS: `var(--pos-{fwd|mid|def|gk}-{bg|fg})`. Маппинг кодов — в [`src/lib/playerBadges.ts`](../../src/lib/playerBadges.ts) (`positionKind`).

### Rating Tiers (градиент-кольцо)

5 уровней по `users.rating` (0..100). Используются в `RatingRing`. Цвет числа = `text`, фон кольца = `track`, градиент = `c1 → c2`.

| Tier | Range | c1 → c2 | text | track |
|------|-------|---------|------|-------|
| `elite` | 90-100 | `#6366f1` → `#4338ca` | `#4338ca` | `#e0e0f8` (индиго) |
| `high` | 80-89 | `#f5b800` → `#d4920a` | `#b8860b` | `#fdf0c8` (золото) |
| `mid` | 70-79 | `#b0b5ba` → `#8a8e93` | `#6b7280` | `#e8eaec` (серый) |
| `low` | 55-69 | `#d4783a` → `#a85828` | `#8b4a20` | `#f2e0d0` (бронза) |
| `poor` | <55 | `#3f3f46` → `#18181b` | `#1c1917` | `#e4e4e7` (графит) |

Хелпер `ratingTier(rating)` → tier в [`src/lib/ratingTier.ts`](../../src/lib/ratingTier.ts).

### Семантический текст (legacy-алиасы)

| CSS | Tailwind | Где |
|-----|----------|-----|
| `--text-primary` (= `--ink-900`) | `text-text-primary` | заголовки, имена, числа |
| `--text-secondary` (= `--ink-500`) | `text-text-secondary` | мета, статус |
| `--text-tertiary` (= `--ink-400`) | `text-text-tertiary` | плейсхолдеры |
| `--text-inverse` | `text-text-inverse` | текст на тёмных подложках |

### Смысловые токены

| CSS-переменная | Tailwind | Смысл |
|----------------|----------|-------|
| `--primary` (`--green-500`) | `bg-primary` / `text-primary` | Бренд, позитив, подтверждено |
| `--primary-hover` (`--green-600`) | `bg-primary-hover` | Нажато |
| `--primary-soft` (`--green-100`) | `bg-primary-soft` | Лёгкие бейджи и подложки |
| `--warning` | `bg-warning` / `text-warning` | «Под вопросом», ожидание |
| `--warning-soft` | `bg-warning-soft` | Подложки warning |
| `--danger` | `bg-danger` / `text-danger` | Дефицит, отказ, долг, ошибка |
| `--danger-soft` | `bg-danger-soft` | Подложки danger |
| `--success` | `bg-success` | = primary (алиас) |

> **Важно.** Зелёный — единственный «фирменный» цвет. Красный/оранжевый — только смысл. Нейтральный показатель — серый.

> **Совместимость.** Старые переменные `--background`, `--foreground`, `--border` и их Tailwind-варианты (`bg-background`, `text-foreground` и т.д.) остаются рабочими алиасами на новые токены — всё существующее UI продолжает работать.

### Границы

| Токен | Где |
|-------|-----|
| `--border` (`--gray-200`) | Карточки, разделители |
| `--border-strong` (`--gray-300`) | Инпуты в фокусе, активные тёмные пилюли |

### Тени

| Токен | Где |
|-------|-----|
| `--shadow-sm` | Карточки, поднятые блоки (`shadow-sm`) |
| `--shadow-md` | Bottom-sheet, sticky bottom-bar (`shadow-md`) |
| `--shadow-lg` | Всплывающие оверлеи (`shadow-lg`) |
| `--shadow-card` | Алиас → `shadow-sm` |
| `--shadow-pop` | Алиас → `shadow-md` |

Никаких других теней. Карточки внутри карточек — без теней, только разделитель.

---

## Скругления

| Токен | px | Где |
|-------|----|-----|
| `radius-sm` | 6 | Position-теги, мини-чипы |
| `radius-md` | 10 | Icon-кнопки на хедере (bell, gear) |
| `radius-lg` | 12 | Инпуты, фильтр-кнопки, чипы, карточки |
| `radius-xl` | 18 | Page header bottom corners |
| `radius-2xl` | 24 | Bottom-sheet верхние углы |
| `radius-full` | 9999 | Аватарки, sort-pill, кнопки-пилюли |

Кнопки и pill-сортировка — `radius-full`. Карточки в фиде — `radius-lg`.

---

## Типографика

Два шрифта — **Geist Sans** (`font-sans`) для всего тела интерфейса и **Oswald** (`font-display`) точечно: заголовки страниц в зелёном хедере (uppercase), крупные spоrt-числа (счёт явки, countdown, рейтинг), event type («Тренировка», «Игра»). Везде остальное — Geist.

**Когда применяем `font-display` (Oswald):**
- Заголовок first-level page в `PageHeader` (uppercase, 30px) — «ИГРОКИ», «КОМАНДЫ»
- Большие числа метрик и счётчиков на тёмных хедерах и карточках (28-40px)
- Countdown-плашки («через 2д», «1 день до старта»)
- Event type на hero события («ТРЕНИРОВКА», «ИГРА») — uppercase

**Везде остальное — `font-sans` (Geist):**
- Имена, заголовки секций, кнопки, метa, описания, числа в строках списка

| Назначение | Класс | Пример |
|------------|-------|--------|
| Page title (зелёный хедер) | `font-display text-[30px] uppercase` weight 600, tracking 0.04em | «ИГРОКИ» |
| Имя в строке списка | `text-[16px] font-semibold` | «Илья Петров» |
| Заголовок секции | `text-[17px] font-semibold` | «Управление», «Финансы» |
| Event type (hero) | `font-display text-[22-28px] font-bold uppercase` | «ТРЕНИРОВКА» |
| Sport-метрика главная | `font-display text-[34-40px] font-bold tabular-nums` | «36», «9 / 12» |
| Rating в RatingRing | `font-display text-[24px] font-bold tabular-nums` | «100» |
| Тело | `text-[14-15px]` | Описание события |
| Подпись/мета | `text-[13px]` color `--ink-500` | адрес, дата |
| Эйбрау-секция | `text-[11px] uppercase tracking-[0.06em] font-semibold` | «РЕЗУЛЬТАТЫ · 36» |
| Position tag | `text-[11px] font-semibold` tracking 0.04em | «НАП» |
| Sort pill / tab | `text-[13-14px] font-medium-semibold` | «По рейтингу» |

Числа — всегда `tabular-nums`, чтобы списки не «прыгали».

---

## Плотность и отступы

| Контекст | Значение |
|----------|----------|
| Внешние поля экрана | `px-4` (16px), редко `px-5` для крупных секций |
| Между секциями | `gap-3` (12px) |
| Внутри секции | `gap-2` (8px) |
| Padding карточки | `p-4` (16px), крупные сводки `p-5` (20px) |
| Между строкой списка | `py-3` (12px) с разделителем; группы — `gap-2` без разделителя |
| Высота тапа | мин. 44px (Apple HIG) |

Не лепи карточки впритык — между ними всегда `gap-3`. Не добавляй вертикальные хедеры в каждую секцию — эйбрау достаточно.

---

## Компоненты v2 (TS)

Использовать всегда, когда есть готовый компонент. Все — в [`src/components/ui/`](../../src/components/ui/) кроме отмеченного.

### Layout

| Компонент | Назначение |
|-----------|-----------|
| `PageHeader` | Зелёный хедер (`--green-700`), радиус `0 0 18px 18px`, паттерн полос `-55deg`. Поддерживает `title`/`titleSlot`/`subtitle`/`leadingSlot`/`actions`/`onSettingsClick`/`children` (под title — например `HeaderStatGroup`) |
| `HeaderIconButton` | 34×34, `radius-md`, полупрозрачный белый фон (для bell, поиска и пр. в `actions`-слоте `PageHeader`) |
| `HeaderActionButton` | Pill-кнопка на хедере (`Все события` и т.п.) |
| `UnderlineTabs` | Подчёркнутые табы (sticky или статичные). Активный — `--ink-900` weight 600, индикатор 36×2.5px `--green-700` |
| `BottomActionBar` | Sticky CTA снизу. Скрывает `BottomTabs` |

### Search & Lists

| Компонент | Назначение |
|-----------|-----------|
| `ListSearchBar` | h-42 поисковая строка (bg `--bg`, border `--ink-100`) + опц. `cityPicker` chip + опц. filter-кнопка с бейджем активных |
| `ListMeta` | Левый счётчик «Результаты · N» + правый `SortPill` |
| `SortPill` | Зелёная pill-сортировка: bg `--green-50`, fg `--green-800`, h-8, radius-full |
| `FilterPills` | Grid-разделённый ряд фильтр-кнопок (legacy — на migrated screens прячем в filter sheet) |
| `EmptyState` | Иконка + текст + опц. action |
| `CityPickerSheet` | Bottom-sheet выбора города |

### Player widgets

| Компонент | Назначение |
|-----------|-----------|
| `PositionTag` | Плоский тег позиции: иконка + 3-буквенный label, h-22, radius-6, цвет от `--pos-{kind}-{bg|fg}` |
| `RatingRing` | SVG градиент-кольцо 56×56 (опц. размер). Цвет числа и градиент — от `ratingTier()` |
| `PlayerListRow` ([players/](../../src/components/players/PlayerListRow.tsx)) | Строка списка игрока: аватар 54px + team-badge 22px (bottom-right) + имя 16px/600 + `PositionTag` + `RatingRing` |

### Legacy (мигрируем по экранам)

`HexBadge`, `LevelBadge`, `RatingCircle`, `PositionBadge` (hex+pill), `LevelChip` — используются в `TeamPlayerSheet` и публичном профиле игрока. При переписи экранов — заменять на `PositionTag` + `RatingRing`.

---

## Компоненты (паттерны)

Все паттерны — Tailwind utility-классы. Если паттерн повторяется > 2 раз — выноси компонент в `src/components/ui/` (см. итерация 24).

### Карточка

```html
<section class="bg-background-card rounded-lg p-4 shadow-card">
  ...
</section>
```

Без `border` по умолчанию: разделение даёт фон + тень. Border ставим только где нужна явная рамка (инпут, неактивная пилюля).

### Stat-карточка (верхняя сводка)

Большая основная метрика + бар прогресса/легенда:

```
┌─────────────────────────────┐
│ Состав в сборе              │
│ 9 / 12                      │   ← число большое, дробь приглушена
│ ▓▓▓▓▓▓░░ (3-цветный бар)    │
│ • активные • под ?  • дефицит │
└─────────────────────────────┘
```

Сбоку — мини-карточки одной метрикой (число + одна строка):
```
┌──────────┐  ┌──────────┐
│ 3        │  │ 0        │
│ под ?    │  │ вратарей │
└──────────┘  └──────────┘
```

Мини-карточка = `bg-background-card rounded-lg p-4 shadow-card flex flex-col gap-1`. Цвет числа задаётся смыслом: warning → `text-warning`, danger → `text-danger`, нейтрально → `text-foreground`.

### Фильтр-чип

Активный:
```
bg-primary text-primary-foreground
rounded-full px-4 py-2 text-[13px] font-semibold
shadow-card
```

Неактивный:
```
bg-background-card text-foreground border border-border
rounded-full px-4 py-2 text-[13px] font-medium
```

Контейнер: `flex gap-2 overflow-x-auto pb-1 -mx-4 px-4` — горизонтальный скролл без видимого скроллбара.

### Эйбрау-секции

Заголовок группы внутри списка («ЯДРО · 9», «ПРИДУТ (16)»):

```
text-[11px] uppercase tracking-[0.06em] font-semibold text-primary mb-2
```

Цвет — `primary` для нейтральных групп. Для смысловых: «не придут» → `text-foreground-secondary`, «дефицит» → `text-danger`.

### Аватарка

```
w-11 h-11 rounded-full bg-background-muted overflow-hidden
```

Размеры: `sm` 32px (стек участников), `md` 44px (строка списка), `lg` 64px (карточка профиля), `xl` 96px (профиль hero).

Стек аватарок («4 аватара + +12»):
- Не более 4 аватарок подряд.
- Дальше — пилюля `+N` тех же размеров: `bg-background-muted text-foreground-secondary text-[13px] font-semibold rounded-full`.
- Под стеком — ссылка-текст «Показать всех» (`text-primary text-[13px]`).
- **Не дублируй число.** Если есть «+12», то «16 / 18» уже сверху — снизу его нет. Если снизу «Придут (16)», то цифру справа от стека убираем.

### Строка-игрок (player row)

```
┌──────────────────────────────────────────────┐
│ ●  Иван Петров                  ▌▌▌▌▌  75   │
│    ЦЗ · Основной                              │
└──────────────────────────────────────────────┘
```

```html
<li class="flex items-center gap-3 py-3">
  <Avatar size="md" />
  <div class="flex-1 min-w-0">
    <p class="text-[15px] font-semibold truncate">Имя</p>
    <p class="text-[13px] text-foreground-secondary truncate">Позиция · Статус</p>
  </div>
  <MiniBar value={4} max={5} />
  <span class="text-[13px] font-semibold tabular-nums w-8 text-right">75</span>
</li>
```

Между строками — тонкий `divide-y divide-border`. Группа стартует с эйбрау «ЯДРО · 9», без своей рамки — это часть общего списка.

### Мини-бар (надёжность/уровень)

Пять точек или 5 палочек:
```
bar (active):   bg-primary w-1 h-3 rounded-sm
bar (inactive): bg-border  w-1 h-3 rounded-sm
gap-0.5
```

Используется для: уровня игрока (1–5), надёжности по бакетам, силы команды.

### Числовой бейдж

Просто число с `tabular-nums` справа от строки. Не оборачивай в pill, кроме как для счётчиков уведомлений (там `bg-danger text-white rounded-full px-1.5`).

### Статус-пилюля

Поверх фото-баннера или в правом углу карточки:

| Тип | Стиль |
|-----|-------|
| Тип события (МАТЧ/ТРЕНИРОВКА) | `bg-primary text-primary-foreground` |
| Статус (ЗАПЛАНИРОВАНО) | `bg-background-card/95 text-foreground` |
| Завершено | `bg-background-muted text-foreground-secondary` |
| Отменено | `bg-danger-soft text-danger` |

Класс: `text-[12px] font-semibold uppercase tracking-wide rounded-full px-3 py-1`.

### Фото-баннер (карточка события)

```html
<div class="relative rounded-lg overflow-hidden">
  <img class="w-full aspect-[16/10] object-cover" />
  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
  <div class="absolute top-3 left-3 flex gap-2">
    <StatusPill type="event" />     <!-- МАТЧ -->
    <StatusPill status="planned" /> <!-- ЗАПЛАНИРОВАНО -->
  </div>
  <div class="absolute bottom-3 left-4 right-4 text-foreground-on-dark">
    <p class="text-[20px] font-semibold leading-tight">суббота, 25 апреля в 20:55</p>
    <p class="text-[14px] opacity-90 mt-1">📍 Футбольный манеж Барс</p>
  </div>
</div>
```

Если фото нет — заменяем на градиентный фон: `bg-gradient-to-br from-foreground to-foreground-secondary`. Градиент-плейсхолдер всегда тёмный (читаем белый текст).

### Триплет-метрика (взнос / мин. игроков / участники)

Одна карточка под баннером с тремя колонками:

```html
<div class="bg-background-card rounded-lg p-4 shadow-card grid grid-cols-3 gap-3">
  <Metric icon="₸" value="1 ₸" label="взнос" />
  <Metric icon="👥" value="Мин. 1 игрок" label="" />
  <Metric value="16 / 18" label="участников" hasProgress />
</div>
```

Прогресс-бар внутри третьей колонки — тонкая полоска `h-1.5 bg-background-muted rounded-full` с заливкой `bg-primary`.

### Кнопка primary (главное действие)

```
bg-primary text-primary-foreground
rounded-full px-5 py-2.5
text-[14px] font-semibold
shadow-card
hover:bg-primary-hover
disabled:opacity-50 disabled:shadow-none
```

Размер `lg` (sticky CTA, основное действие на форме): `px-6 py-3 text-[15px]`. Не больше — крупнее буквально не нужно, мобильный экран и так узкий, на 14-15px Geist читается отлично, тапается с запасом 44px (паддинг + текст).

### Кнопка secondary (отмена/нейтральное)

```
bg-background-card text-foreground border border-border
rounded-full px-5 py-2.5
text-[14px] font-semibold
hover:bg-background-muted
```

### Кнопка danger

Та же форма, цвет `bg-danger text-white`. Используем только для подтверждённых разрушительных действий (удалить из команды, отменить событие).

### Пара кнопок «Приду / Не приду»

Wrapper-карточка, две кнопки в `grid-cols-2 gap-3`. После выбора:
- выбранная — primary (зелёная заливка), не выбранная — secondary;
- если ещё не голосовал — обе secondary, под ними строка `text-[13px] text-foreground-secondary text-center mt-2`: «Вы ещё не ответили».

### Bottom action bar (sticky)

Снизу экрана события — закреплённая полоса с двумя кнопками:

```html
<div class="sticky bottom-0 bg-background-card border-t border-border px-4 py-3 grid grid-cols-2 gap-3 shadow-pop">
  <Button kind="primary">Завершить</Button>
  <Button kind="secondary">Отменить</Button>
</div>
```

Должна перекрывать `BottomTabs` — на экранах с bottom-bar нижние табы не показываем (см. правило ниже).

### Список участников «Придут (16)» / «Не придут (2)»

Эйбрау + горизонтальный стек аватарок. Аватарки «не придут» — `grayscale opacity-70`, с маленьким крестиком в правом нижнем углу (24% от размера аватарки, кружок `bg-background-card`, иконка `text-foreground-secondary`).

«Придут» — те же аватарки + зелёная галочка в том же месте (`bg-primary text-white`).

### Список действий (Управление)

Вертикальный стек строк-ссылок внутри одной карточки:

```html
<section class="bg-background-card rounded-lg shadow-card overflow-hidden">
  <h3 class="px-4 pt-4 text-[11px] uppercase tracking-wide font-semibold text-foreground-secondary">Управление</h3>
  <ul class="divide-y divide-border mt-2">
    <li>
      <a class="flex items-center gap-3 px-4 py-3">
        <Icon class="text-primary" />
        <div class="flex-1">
          <p class="text-[15px] font-medium">Площадка</p>
          <p class="text-[13px] text-foreground-secondary">расходы</p>
        </div>
        <span class="text-[13px] text-primary">Указать</span>
        <ChevronRight class="text-foreground-muted" />
      </a>
    </li>
  </ul>
</section>
```

### Инпуты

```
bg-background-card border border-border rounded-md
px-4 py-3 text-[15px]
focus:border-primary focus:outline-none
placeholder:text-foreground-muted
```

Лейбл сверху: `text-[13px] text-foreground-secondary mb-1`. Ошибка снизу: `text-[13px] text-danger mt-1`.

### Пустые состояния

```html
<div class="bg-background-card rounded-lg p-8 text-center shadow-card">
  <Icon class="w-10 h-10 text-foreground-muted mx-auto" />
  <p class="text-[15px] text-foreground-secondary mt-3">В команде пока никого нет</p>
  <button class="text-primary text-[14px] font-semibold mt-3">Пригласить игрока</button>
</div>
```

Без рамки. Иконка (≈40px) — приглушённая. Подпись + одно действие. Не больше.

### Skeleton

Уже есть [Skeleton.tsx](../../src/components/Skeleton.tsx). Цвет блока — `bg-background-muted`, не `bg-border`. Скелетон должен повторять форму конечной карточки, а не быть «серым прямоугольником».

**Правило:** секция, которая рендерит `null` при пустых данных (например, `events.length === 0 → return null`), должна принимать `loading?: boolean` и при `loading=true` рендерить N скелетон-блоков той же формы. Иначе при загрузке секция отсутствует и появляется внезапно — пользователь видит «прыжок» вёрстки. Без скелетона допустимо только если данные точно есть (server-side render с известным non-empty контентом).

### Bottom-sheet (модалка снизу)

```
fixed inset-0 z-50 bg-background-overlay
inner: bg-background-card rounded-t-xl p-6 shadow-pop max-h-[85vh] overflow-y-auto
```

Хедер sheet — `flex justify-between items-center`: заголовок (`text-[17px] font-semibold`) + крестик (`text-foreground-secondary text-2xl`).

---

## Хедер экрана

Универсальный паттерн для всех вложенных экранов (не таб-корней):

```
←  Заголовок                       ⌕  +
```

```html
<header class="flex items-center justify-between px-4 pt-4 pb-3">
  <div class="flex items-center gap-3">
    <BackButton />
    <h1 class="text-[28px] font-bold leading-tight">Состав</h1>
  </div>
  <div class="flex gap-2">
    <IconButton><SearchIcon /></IconButton>
    <IconButton><PlusIcon /></IconButton>
  </div>
</header>
```

`IconButton` = `w-10 h-10 rounded-full bg-background-card shadow-card flex items-center justify-center`. **Не используем тёмные hero-блоки** — заголовок просто крупный чёрный текст на светлом фоне. Тёмный фон оставляем только для фото-баннеров событий (где есть картинка).

Исключение: профиль команды и профиль игрока могут показывать «герой» с фоном-командой (логотип/обложка), но это всё равно картинка с градиентом, а не плоский тёмный блок.

---

## Лэйаут листинг-страниц

Универсальный шаблон для всех first-level каталогов: **Игроки, Команды, Поиск событий, Площадки**. Структура одинаковая, меняется только контент.

```
┌──────────────────────────────────────┐
│ ЗЕЛЁНЫЙ ХЕДЕР (radius 0 0 28 28)     │
│   Title (Oswald uppercase)    🔔     │
│   ┌──────┐ ┌──────┐ ┌──────┐        │
│   │  36  │ │   2  │ │  28  │        │
│   │Всего │ │В моих│ │С опы.│        │
│   └──────┘ └──────┘ └──────┘        │
└──────────────────────────────────────┘
  ┌────────────────────────┐ ┌──┐
  │ 🔍 Поиск…              │ │⊟│  ← search + filter btn
  └────────────────────────┘ └──┘
  Найдено N         По уровню ▾   ← meta + sort
  [ Все ][ВРТ][ЗАЩ][ПЗЩ][НАП]    ← position pills (grid-5)

  [Алматы ✕] [Ищет команду ✕]    ← active filter chips (если есть)

  РЕЗУЛЬТАТЫ · 36                ← эйбрау
  ─────────────────────────────────
  ●  Иван Петров          ▌▌▌▌▌  ← list rows
     ЦЗ · Основной
  ─────────────────────────────────
  ...
```

### `PageHeader` — зелёный хедер первого уровня

Используется на всех first-level вкладках вместо тёмного hero. Тот же зелёный, что в Hero на главной (`var(--green-600)`), скруглён снизу 28px, с диагональной текстурой.

**Структура:**
- Top-row: title (Oswald uppercase, 30px white) слева + опц. action-pill(s) + bell-кнопка справа (40px circle, `bg-white/15`)
  - Action-pill (`<HeaderActionButton>`): h-10 pill `bg-white/18`, иконка + лейбл (например, «+ Создать»). Используется для основного действия страницы, которое не помещается в primary-CTA внизу. Цвет — белый, чтобы оставаться частью зелёного хедера, а не конкурировать с зелёным CTA внутри списка.
- Stats-row: 1-3 stat-карточки в `flex gap-2.5` на тёмной полупрозрачной плашке (`bg-black/18`, radius 16px, padding 18/12/16, backdrop-blur 8px)
  - Число: `font-display text-[34px] font-bold` white
  - Лейбл: `text-[11px] text-white/50 leading-[1.4]`

**Props:** `title?: string` (строка-заголовок) или `titleSlot?: ReactNode` (кастомный узел заголовка — например, кнопка с chevron для team-switcher). `subtitle?: string` — строка под заголовком (`rgba(255,255,255,0.7)`). Остальные: `onBellClick`, `hasBellDot`, `bellAriaLabel`, `actions`, `children`.

**Когда уместен:** корневые вкладки (`/home`, `/teams` лэндинг, `/search/*`) и страницы команды (`/team/[id]/*` — шапка общая для всех 4 табов). На вложенных страницах с back-arrow — обычный `ScreenHeader`.

**Stats:** 1-3 показателя, ценных лично пользователю. Не статистика всей системы. Примеры:
- Игроки: «Всего N», «В моих командах M», «Ищут команду K»
- Команды: «Всего N», «Мои M», «Ищут игроков K»
- События: «Сегодня N», «На этой неделе M», «Свободные K»

### Управление списком (search / sort / filter)

Идёт сразу под `PageHeader`. Фон страницы белый. Реализовано как **четыре независимых примитива**, которые компонуются в нужном порядке прямо в page-компоненте — единого `ListToolbar` нет, чтобы не лишать гибкости (можно опускать ряды, переставлять, кастомизировать).

**Общий принцип контраста:** все интерактивные контролы (input, filter-btn, sort-pill, неактивные quick-pills) имеют `background: var(--bg-card)` (gray-100) + `border: 1.5px solid var(--gray-200)`. Это «карточный» фон против белого фона страницы — выделяется, но не перегружает. Активные состояния (выбранный quick-pill, применённые active-chips) меняют фон на акцентный (`gray-900` для quick, `green-50` для chips).

**1. Search-row** — `<ListSearchBar>` (`src/components/ui/ListSearchBar.tsx`). Контейнер `flex gap-2 mb-3`:
- Поисковый input: `flex-1 pl-10 pr-9 py-3 rounded-[14px]`, `bg-bg-card`, `1.5px solid var(--gray-200)`, focus → `border-green-500`. Лупа слева 18px (`text-tertiary`). При непустом значении — кнопка-крестик справа (`16×16 rounded-full bg-gray-300`).
- City-pill (опц., prop `cityPicker`): `h-[46px] px-3.5 rounded-[14px]`, тот же бэкграунд/бордер, font 14px/600, имя города + chevron-down 12px. Тап → `<CityPickerSheet>` (`src/components/ui/CityPickerSheet.tsx`) — bottom-sheet со списком городов из `KZ_CITIES`. Используется только в `/search/players`; меняет локальный фильтр страницы, в профиль пользователя не пишет. На остальных листингах не рендерим (по умолчанию prop отсутствует).
- Filter-btn: `46×46 rounded-[14px]`, тот же бэкграунд/бордер, иконка funnel 20px. Бейдж справа-сверху (`min-w-[18px] h-[18px] bg-green-500 text-white`) с числом активных sheet-фильтров. Опциональна — если фильтрам некуда уходить в sheet, кнопку не рендерим.

**2. Meta-row** — `<ListMeta>` (`src/components/ui/ListMeta.tsx`). Контейнер `flex justify-between mb-3`:
- Слева: «Найдено N игроков» (`text-[13px] text-text-tertiary`)
- Справа: sort-pill — `pl-3 pr-2 py-1 rounded-full bg-bg-card border-gray-200 text-[13px] font-semibold text-green-700` + chevron. Клик → inline popover (white bg, `shadow-lg`, rounded-12). Текущая опция в попапе — `bg-green-50 text-green-600`.

**3. Quick-pills** — `<FilterPills>` (`src/components/ui/FilterPills.tsx`). `grid` с `gridTemplateColumns: repeat(N, 1fr)` по числу опций, `gap-1.5`:
- Неактивная: `bg-bg-card`, `1px solid var(--gray-200)`, `text-text-secondary`
- Активная: `bg-gray-900 text-white`, `1px solid var(--gray-900)`
- `rounded-[10px] px-1 py-2 text-[12px] font-semibold truncate`
- Используется для **одного главного измерения** (позиция игрока, тип события, спорт). Не пихать сюда всё подряд — это быстрый switch, не комбинированный фильтр.

**4. Active filter chips** — `<ActiveFilterChips>` (`src/components/ui/ActiveFilterChips.tsx`). Опционально, `flex flex-wrap gap-1.5 mt-3.5`:
- Показываются только если применены фильтры из sheet
- `bg-green-50 text-green-700 rounded-full px-3 py-1.5 text-[12px] font-semibold`
- Внутри ✕-кружок (`w-4 h-4 rounded-full bg-[rgba(0,0,0,0.08)]`) — клик по чипу удаляет соответствующий фильтр

**Sheet расширенных фильтров** открывается из filter-btn. Это `fixed inset-0 z-50`, оверлей `bg-[rgba(0,0,0,0.4)]`, body — белый, скругление сверху 24px, drag-handle (`w-10 h-1 bg-gray-300`). Лейбл секции: `text-[12px] uppercase font-semibold tracking-[0.06em] text-text-tertiary`. Внизу — две равные кнопки: «Сбросить» (`bg-bg-secondary`) и «Применить» (`bg-green-500 text-white`).

**Контролы внутри шита** — никаких нативных `<select>` для коротких списков. Используем `<SheetChipGroup>` (`src/components/ui/SheetChipGroup.tsx`): single-select чипы во flex-wrap. Активный чип — `bg-gray-900 text-white`, неактивный — `bg-bg-card 1.5px solid var(--gray-200)`. По дефолту первая опция — пустое значение «Любой» (можно отключить через `emptyLabel={null}`). Для зависимых полей (район по городу) при пустых опциях показываем `emptyHint` («Сначала выбери город»). Boolean-фильтры остаются обычным toggle-блоком (как «Ищут игроков»).

См. эталонную реализацию в [src/app/(app)/search/players/page.tsx](../../src/app/(app)/search/players/page.tsx) и [src/components/players/PlayerFiltersSheet.tsx](../../src/components/players/PlayerFiltersSheet.tsx). Все четыре саб-таба `/search/*` собраны по одному и тому же шаблону.

### `ListRow` — строка списка

Между `PageHeader/Toolbar` и списком — эйбрау (опц.) `text-[11px] uppercase tracking-[0.06em] font-semibold text-text-tertiary`: «РЕЗУЛЬТАТЫ · 36».

```html
<li class="flex items-center gap-3.5 py-3 border-b border-gray-100">
  <Avatar size="md" />                          <!-- 44×44 -->
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-1.5">
      <span class="text-[15px] font-semibold truncate">Имя</span>
      <CaptainBadge />                          <!-- опц.: 18×18 green-500, "C" -->
      <SeekingBadge>Ищет команду</SeekingBadge> <!-- опц. pill -->
    </div>
    <p class="text-[13px] text-text-secondary truncate">Позиция · Район/Город</p>
  </div>
  <div class="flex items-center gap-2 shrink-0">
    <MiniBar value={4} max={5} />               <!-- 5×(4×14) px -->
  </div>
</li>
```

**Аватарка:** `44×44 rounded-full`, `border: 2px white`, `box-shadow: 0 0 0 1px var(--gray-200)` (двойной контур — отделяет от фона). Если фото нет — цветная подложка с инициалом (white 17px font-bold).

**Бейджи рядом с именем:**
- Капитан: 18px circle `bg-green-500` + белая «C» (9px font-extrabold)
- «Ищет команду»: pill `bg-green-50 text-green-600 px-1.5 py-0.5 text-[10px] font-semibold rounded-full`

**Правый блок:** только одна метрика — обычно мини-бар (5 палочек). Для каталога игроков бар отображает **надёжность** (% посещения completed-событий, на которые был ответ «приду»): `100→5, 80-99→4, 60-79→3, 40-59→2, 1-39→1, played=0→прочерк`. Цифра справа от бара только если есть **числовой рейтинг** (post-MVP).

**Разделитель строк:** `border-bottom: 1px var(--gray-100)`. Последняя строка — без border. Никаких карточек-боксов вокруг каждой строки.

### `PlayerListRow` — строка игрока (расширенная, итер 53)

Используется только в `/search/players` (в ростере команды пока остаётся базовая `ListRow` версия). Отличается от базовой строки тем, что под именем — два цветных бейджа (уровень + позиция), а справа — кольцо рейтинга вместо мини-бара или числа.

```
┌────────────────────────────────────────────┐
│ ●●●  Михаил Карпов                  ◯94    │
│  ↑   [A+] [НАП]                            │
│  └ TeamLogosStack                          │
└────────────────────────────────────────────┘
```

- **Аватар:** 52×52, `border: 2px white`, `box-shadow: 0 0 0 1px var(--gray-200)`. Без фото — `bg-card` + инициал 17px font-bold.
- **`TeamLogosStack`:** до 3 кругов 24×24, поверх аватара, `left:32 bottom:-2`, `margin-left:-9` для каждого следующего, `z-index` растёт слева направо. У каждого `border: 2.5px solid white`. Если у команды есть `teams.logo_url` — картинка; если нет — цветной круг (`oklch(0.62 0.14 H)`, `H` детерминированно из `team.id`) + белый инициал 9px font-extrabold.
- **Имя:** 16px font-semibold. Рядом — опц. `SeekingBadge` («Ищет команду»), `RoleBadge` (для ростера — «Организатор»).
- **Бейджи:** ниже имени (gap 6px) — `LevelBadge` + до **2** `PositionBadge` подряд. Третья позиция в `users.position[]` отбрасывается. Позиция «Универсал» в палитре не определена, бейдж для неё не рендерится.
- **Справа:** `RatingCircle` 48×48.

### Бейджи игрока

Семейство декоративных шестиугольных бейджей. Все цвета — CSS-переменные из `--pos-*` и `--lvl-*`. Иконки — белые PNG в `public/badges/`.

**`HexBadge`** ([HexBadge.tsx](../../src/components/players/badges/HexBadge.tsx)) — общий примитив. 26×30, `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`. Двухслойный: outer (border) + inner (gradient + лёгкий белый overlay) с inset 2px. Принимает `borderColor`, `fillFrom`, `fillMid?`, `fillTo` и опц. children.

**`PositionBadge`** — `HexBadge` (PNG-иконка 15px) + примыкающая pill справа (`border-radius: 0 9999px 9999px 0`, h18, font 10px/800, letter-spacing 0.04em, uppercase). Маппинг русского `users.position` → код:

| Русское значение | Код | Иконка | Pill |
|-------|-----|--------|------|
| Вратарь | `vrt` | glove.png | ВРТ |
| Защитник | `zash` | shield.png | ЗАЩ |
| Полузащитник | `pzsh` | target.png | ПЗЩ |
| Нападающий | `nap` | boot.png | НАП |
| Универсал | — | — | (бейдж не рендерится) |

Палитры в `globals.css`: `--pos-{vrt|zash|pzsh|nap}-{border|fill-from|fill-to|pill-bg|pill-fg|pill-border}`. Маппинг — `positionCode()` из [src/lib/playerBadges.ts](../../src/lib/playerBadges.ts).

**`LevelBadge`** — `HexBadge` с буквой Oswald 14px (10px для `A+`), белая, weight 700, text-shadow. Палитры `--lvl-{aplus|a|b|c|d}-*`. Для `code = null` (нет рейтинга) — серый плейсхолдер (`--lvl-empty-*`) с прочерком вместо буквы.

**`RatingCircle`** — SVG-кольцо `size×size` (default 48). Stroke 3.5, `stroke-linecap: round`, rotate −90deg. Фоновый круг `--lvl-{level}-ring-bg`, активный `--lvl-{level}-ring`, цифра в центре `font-display` weight 700, размер `size × 0.36`. Для `rating = null` — серое пустое кольцо без активной заливки и `—` в центре.

**Источник истины «уровня» — `users.rating` (0–100).** Значение `skill_level` (текстовая шкала Новичок…Про из онбординга) на этой странице не отображается. Buckets (см. `levelFromRating()`):

| Rating | Code | Letter | Палитра |
|--------|------|--------|---------|
| 89–100 | `aplus` | A+ | Daimond (фиолетовый) |
| 73–88 | `a` | A | Gold |
| 56–72 | `b` | B | Silver |
| 26–55 | `c` | C | Bronze |
| 0–25 | `d` | D | Graphite |
| `null` | — | — | Empty (gray) |

Сортировка «По уровню» в каталоге игроков сортирует по `users.rating` desc, `nullsFirst:false`.

**`TeamLogosStack`** — абсолютный оверлей `left:32 bottom:-2` для рендера команд игрока на аватаре 52×52. Принимает `teams: { id, name, logo_url? }[]`, рендерит до 3.

### Шаринг между листингами

Готовые переиспользуемые примитивы в `src/components/ui/`:

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `PageHeader` + `HeaderStatGroup` + `HeaderStat` + `HeaderActionButton` | [PageHeader.tsx](../../src/components/ui/PageHeader.tsx) | Зелёный hero первого уровня + опц. bell + stats-плашка + опц. action-pill |
| `ListSearchBar` | [ListSearchBar.tsx](../../src/components/ui/ListSearchBar.tsx) | Search input + опц. filter-btn с бейджем-счётчиком |
| `ListMeta` | [ListMeta.tsx](../../src/components/ui/ListMeta.tsx) | «Найдено N» слева + sort-pill с popover справа |
| `FilterPills` | [FilterPills.tsx](../../src/components/ui/FilterPills.tsx) | Grid быстрых toggle-pills для одного измерения |
| `ActiveFilterChips` + тип `FilterChip` | [ActiveFilterChips.tsx](../../src/components/ui/ActiveFilterChips.tsx) | Массив `{id, label, onRemove}` с ✕ |
| `SheetChipGroup` + тип `ChipOption` | [SheetChipGroup.tsx](../../src/components/ui/SheetChipGroup.tsx) | Single-select чипы для шит-фильтров вместо нативного `<select>` |
| `CityPickerSheet` | [CityPickerSheet.tsx](../../src/components/ui/CityPickerSheet.tsx) | Bottom-sheet выбора города из `KZ_CITIES` (вертикальный список с галочкой на активном) |
| `HexBadge` / `PositionBadge` / `LevelBadge` / `RatingCircle` / `TeamLogosStack` | [src/components/players/badges/](../../src/components/players/badges/) | Семейство бейджей игрока — см. раздел «Бейджи игрока» |
| `UnderlineTabs` + тип `UnderlineTab` | [UnderlineTabs.tsx](../../src/components/ui/UnderlineTabs.tsx) | Underline-табы (nav с flex-1 слотами): активный = `font-bold text-green-700` + 2.5px underline. Принимает `tabs: UnderlineTab[]` (href, label, active, onClick?) + опц. `className` |
| `SearchSubnav` | [SearchSubnav.tsx](../../src/components/search/SearchSubnav.tsx) | Underline-навигация `/search/*` — обёртка над `UnderlineTabs` с автоопределением active по pathname |
| `EventListRow` | [EventListRow.tsx](../../src/components/events/EventListRow.tsx) | Строка списка для `/search/events` (date-tile + team + meta + yes/price) |
| `VenueListRow` | [VenueListRow.tsx](../../src/components/venues/VenueListRow.tsx) | Строка списка для `/search/venues` (pin-tile + name + address) |

Domain-специфичные строки (`PlayerListRow`, будущие `TeamListRow`, `EventListRow`) живут рядом с фичей в `src/components/<domain>/`. Они напрямую рендерят `<Link>` со структурой из «`ListRow` — строка списка» выше — отдельный generic-обёрточный компонент `ListRow` не делаем, чтобы не плодить уровни абстракции (структура из 5 строк HTML — не повод для компонента).

**Эталон применения:** все четыре саб-таба `/search/*` собраны по этой последовательности: `PageHeader` → опц. `SearchSubnav` (только внутри `/search/*`) → `ListSearchBar` → `ListMeta` → опц. `FilterPills` → `ActiveFilterChips` → эйбрау «Результаты · N» → список. `FilterPills` нужен только если есть одно главное измерение быстрого фильтра (позиция, тип события); если такого измерения нет (как у команд и площадок) — пропускай этот ряд. Sheet-фильтров — `<Domain>FiltersSheet` рядом со строкой, чипами через `<SheetChipGroup>`.

---

## Правила экранов

### Главная (`/home`)

1. Приветствие — без тёмного блока. Просто `text-[28px] font-bold`: «Привет, Иван». Под ним строка `text-foreground-secondary` с городом.
2. Карточка ближайшего события — фото-баннер по правилам выше + триплет-метрика (взнос, мин., участники) + кнопки «Приду / Не приду».
3. Сигналы (если есть): мелкие stat-карточки в 2 колонки — задолженность по событию, новые заявки, ожидающие подтверждения. Цвет — по смыслу (warning/danger/нейтральный).
4. Быстрые действия — две кнопки-карточки в grid-2: «Найти игру», «Команды». Иконка + лейбл, без описаний.
5. «Мои команды» — список, по правилам строки команды (см. ниже).

Не делать: тёмный hero, дублирование «Ближайшее событие» эйбрау + h1, «нет событий» как пустую карточку (если нет события — показывай «Найди игру» как primary CTA).

### События — лента (`/team/[id]/events`)

1. Заголовок «События» + кнопка `+` в углу (для организатора).
2. Группы: «Предстоящие», «Прошедшие». Эйбрау сверху каждой.
3. Карточка события в ленте — компактная: фото-обложка слева 80×80, справа дата + место + статус + 1 строка `Придут N · вы: приду`. Без дублей, без ценника в ленте (он внутри события).

### Событие — детали (`/team/[id]/events/[eventId]`)

Структура снизу вверх должна совпадать со скриншотом-референсом:
1. Хедер с back/поделиться.
2. **Фото-баннер** + статус-пилюли + дата + venue.
3. **Триплет-метрика** (взнос / мин. игроков / участники X/Y с прогрессом).
4. **Карточка ответа**: «Приду / Не приду» + строка статуса.
5. **Придут (N)** — стек аватарок + «Показать всех» (без числа справа от стека).
6. **Не придут (N)** — то же самое, аватарки `grayscale`.
7. **Управление** (только организатор) — секция-список: «Площадка → Указать», «Финансы → Ожидаемый сбор: X из Y ₸». Без отдельных карточек на каждый пункт.
8. **Bottom action bar** (только организатор, status=planned): «Завершить» / «Отменить».

Запрещено:
- Карточка финансов отдельно от управления, если организатор уже видит её строкой в «Управление».
- «Голоса (N)» как отдельная секция — только «Придут / Не придут».
- Эйбрау «Тип события» отдельно — это статус-пилюля поверх баннера.
- Любые красные числа, кроме «−N ₸» долга или «не придут N» при N > мин.игроков.

### Состав (`/team/[id]/roster`)

Точно по референсу:
1. Хедер «Состав» + поиск + плюс.
2. **Сводка-карточка**: «Состав в сборе 9 / 12» + 3-цветный бар + легенда (активные/под вопросом/дефицит).
3. **Сбоку две мини-карточки** (col-2 на узких — переносим вниз grid-2): «3 под вопросом» (warning), «0 вратарей» (danger).
4. **Чипы-фильтры**: Все / Вратари / Защитники / Полузащ. / Нападающие. Активный — primary.
5. **Группы**: «ЯДРО · 9», «РЕЗЕРВ · 3» — эйбрау + список строк-игроков с мини-баром и числом справа.

### Финансы (`/team/[id]/finances`, организатор)

1. Большая карточка «Реальный баланс» — крупное число (40px), цвет — primary если ≥0, danger если <0. Подпись пояснением.
2. Сводные мини-метрики (grid-2 или grid-3): касса, долги игроков, остаток к оплате площадкам. Цвет — по смыслу.
3. **Задолженности** — список-строки игроков с числом справа (−N ₸ красным, +N ₸ зелёным). Без эйбрау «−» и «+» как объяснения снизу — это понятно по цвету.
4. **Площадки** — список событий с долгом. Каждая строка — ссылка в событие.
5. **Депозит** — bottom action bar или одна primary-кнопка «Внести депозит» снизу, не нейтральная карточка с плюсом.

### Информационная архитектура: «Моё» отдельно от «Публичного»

Четыре сущности (команды, события, игроки, площадки) — два разных контекста использования:

- **«Моё»** (daily, операционка): моя команда, мои события. Top-tab «Моя команда» (`/teams` → smart-redirect на `/team/[lastId]`); следующее событие — на `/home`.
- **«Публичное»** (discovery, изредка): каталог чего угодно. Top-tab «Поиск» (`/search`) с 4 саб-табами: События / Команды / Игроки / Площадки.

Никаких пересечений: каталог команд не дублируется в «Моя команда», игроков нет как top-level вкладки. Это даёт один путь к каждому интенту.

**Bottom-nav (4 таба):** Главная / Моя команда / Поиск / Профиль.

### Поиск (`/search`)

Единый хаб публичного каталога с саб-навигацией. Корень `/search` → редирект на `/search/events`. Каждый саб-таб — отдельный роут со своим `PageHeader`, своими stats и своей формой listing-паттерна.

**Саб-нав** (`SearchSubnav`, `src/components/search/SearchSubnav.tsx`) — **underline-табы** (не чипы!) под `PageHeader`, в порядке: События / Команды / Игроки / Площадки. 4 равновесных слота через `flex justify-between` + `flex-1` на каждом. Активный — `font-bold text-green-700` + 2.5px зелёный underline снизу; неактивный — `font-medium text-text-secondary`. Под всем рядом — `1px solid var(--gray-100)`. Это сделано визуально отлично от `FilterPills` ниже, чтобы пользователь сразу читал «это навигация», а не «ещё один ряд фильтров».

Каждый саб-таб использует один и тот же шаблон: `PageHeader` (со своими stats) → `SearchSubnav` → `ListSearchBar` → `ListMeta` (count + опц. sort) → опц. `FilterPills` → опц. `ActiveFilterChips` → эйбрау «Результаты · N» → список → infinite scroll.

#### Саб-таб «События» (`/search/events`)
- Stats: Всего / Сегодня / На неделе (только публичные `is_public=true`, status=planned, future)
- Search: ilike по `teams.name`
- Pills: тип события (Все / Игра / Трен. / Сбор / Другое) — фильтр одного измерения
- Sheet: город, район, **Период** (пресеты «Сегодня / Эта неделя / Следующая / 2 недели» + native `<input type="date">` от–до; пресет и custom range взаимоисключающие), **Цена** (пресеты до 1/2/3 тыс. ₸ + «Бесплатно»), toggle **Только со свободными местами** (yes_count < min_players)
- URL `?venue=<id>` — фильтр по площадке (используется кнопкой «Все события на площадке» с `/venues/[id]`)
- Сортировка: дата asc (без диалога)
- Row: `EventListRow` — 44×44 цветной date-tile (`green-50`/`green-700`, day + month) + название команды (+ опц. бейдж «Моя команда») + `тип · время · площадка · район`. Справа: `yes_count` с галочкой + опц. цена

#### Саб-таб «Команды» (`/search/teams`)
- Stats: Всего / Ищут игроков
- Search: ilike по `name`
- Sheet: город, район, спорт, toggle «Ищут игроков»
- Без quick-pills и sort-диалога (сортировка по created_at desc)
- Row: `TeamListRow` — 44px Avatar (инициал) + имя + опц. бейдж (приоритет: «Капитан» > «Я в составе» > «Ищут игроков») + meta «Спорт · Район/Город» + справа `members_count`

#### Саб-таб «Игроки» (`/search/players`)
- Stats: Всего / В моих командах (только для авторизованного) / Ищут команду
- Search: ilike по `name`
- Pills: позиция (Все / ВРТ / ЗАЩ / ПЗЩ / НАП)
- Sheet: город, район, позиция, toggle «Ищет команду»
- Sort: «По уровню» / «Недавние»
- Row: `PlayerListRow` — Avatar + имя + опц. «Ищет команду» + меta + 5-bar надёжность (`100→5, 80-99→4, 60-79→3, 40-59→2, 1-39→1, played=0→прочерк`)

#### Саб-таб «Площадки» (`/search/venues`)
- Stats: Всего
- Search: ilike по `name`/`city`
- Sheet: город, район
- Без pills и sort
- Row: `VenueListRow` — 44px иконка-pin tile + название + адрес · район + город. Тап → `/venues/[id]` (профиль площадки)

### Площадка — детали (`/venues/[id]`)

Структура сверху вниз — **dark hero** (как `EventHero`) + светлый контент:

1. **Dark hero** (`gray-900`, скруглён снизу 28px):
   - Фото 230px (`venues.photo_url`); если null — диагональный градиент `gray-700 → gray-900`. Сверху мягкий dim для back-кнопки, снизу — затемнение в `gray-900`.
   - Back-таблетка (`top-3 left-3 w-10 h-10 rounded-full bg-rgba(0,0,0,0.4)`).
   - Название — `font-display` (Oswald) `text-[24px] uppercase font-bold` white.
   - Адрес — `text-[13px] rgba(255,255,255,0.55)`.
   - Чипы (если есть): район (`PinIcon`), цена-за-час (`CoinIcon` + `formatPrice(default_cost) / час`). Стиль чипа — полупрозрачный белый (`rgba(255,255,255,0.06)` фон, `rgba(255,255,255,0.65)` текст).
2. **Маршрут** — primary full-width зелёная кнопка (`green-500`), белый текст + стрелка-иконка. `<a target=_blank>` на 2GIS (`https://2gis.kz/<city-slug>/search/<address>`).
3. **Контакты** (если есть `phone` или `website`) — карточка `bg-card` с разделителями. Каждая строка: квадратная иконка 36px (`bg-green-50` / `green-600`) + лейбл-эйбрау (`Телефон` / `Сайт`) + значение + chevron. `<a href="tel:...">` для телефона.
4. **Описание** (если есть) — текст 14px в `bg-secondary` плашке.
5. **Ближайшие события · N** — эйбрау + `EventListRow` (первые 5 публичных future-событий). Если `N > 5` — снизу зелёная плашка-ссылка «Все события на площадке» → `/search/events?venue=<id>`. Если событий нет — `EmptyState` «Пока никаких событий».

**Backend.** `GET /api/venues/[id]` — `{ venue, upcomingEvents (≤ 5), upcomingTotal }`.

### Моя команда (`/teams` → `/team/[id]/*`)

`/teams` — **не каталог**, а лэндинг для своих команд:
- 0 команд (или гость) → empty-state с двумя CTA: «Найти команду» (→ `/search/teams`, primary green) и «Создать команду» (→ `/teams/create`, secondary)
- 1+ команд → клиентский `router.replace` на `/team/[lastActiveId]`, где id берётся из `localStorage["sporty:lastTeamId"]` или первой по `joined_at`. Last-active обновляется в `team layout` при каждом рендере `/team/[id]/*`

**Шапка `/team/[id]/*`** — тот же зелёный `PageHeader` что и в `/search/*`, рендерится в `team/[id]/layout.tsx`:
- `titleSlot` (≥ 2 команды): `<button>` с именем команды (Oswald uppercase, 30px, white) + `<ChevronDownIcon>` → `TeamSwitcherSheet`
- `title` (1 команда): обычная строка
- `subtitle`: «Город · Спорт» в `rgba(255,255,255,0.7)`
- Bell справа (только организатор) → `TeamRequestsSheet` (`src/components/team/TeamRequestsSheet.tsx`); `hasBellDot` = `pendingRequestsCount > 0`
- Stats (3 штуки в `HeaderStatGroup`): «В составе N» · «Впереди M» · {«Долгов K ₸» для организатора | «Сыграно K» для игрока/гостя}

Шапка скрывается для `/team/[id]/roster` (iter 36) и `/team/[id]/events/[eventId]` (своя `EventHero`).

**Саб-навигация** — `TeamSubNav` на базе `UnderlineTabs` (тот же примитив, что и `SearchSubnav`): Главная / Состав / События / Финансы (только организатор). `sticky top-0 z-10 bg-white`. Также скрывается для roster и event-detail.

### Team-switcher (для пользователей с ≥ 2 командами)

Имя команды в `PageHeader` становится `<button>` с chevron → `TeamSwitcherSheet`. Bottom-sheet со списком моих команд (Avatar + имя + «Капитан/Игрок · Город» + бейдж «Сейчас» на текущей) + кнопка «+ Создать команду» снизу. При выборе — `router.push('/team/[newId]')` и `setLastActiveTeamId`.

Если у пользователя 1 команда — chevron не рендерится, `title` — обычная строка.

### Профиль игрока

1. Heroбез тёмной плитки. Аватар 96px по центру (или слева для сторонних профилей), имя 28px, под ним «Город · Район».
2. Бейдж «Ищет команду» — `bg-primary-soft text-primary` пилюля, не тёмная.
3. Чипы-табы: Обо мне / Результаты / Надёжность.
4. Внутри табов — карточки с прозрачным фоном страницы (`background`) и обычные `bg-background-card` блоки.

---

## Что мы убираем (анти-паттерны)

Это всё нужно искоренить в итерациях 24–29. Сводный список — в [ui-consistency-audit.md](../ui-consistency-audit.md).

- **Плоские чёрные/тёмно-серые hero-блоки** в профиле команды, в профиле игрока, на старых каталог-страницах (`/players`, `/search`). Заменяем на зелёный `PageHeader` (для first-level вкладок) или обычный светлый header с back-arrow (для вложенных). Тёмные подложки допустимы только на фото-баннерах событий и в hero-карточке события.
- **Oswald uppercase в эйбрау-метках секций** (`text-xs uppercase font-display text-text-tertiary`), кнопках, обычном теле. Используем sans-serif с font-semibold. *Исключение:* page-title в green PageHeader, sport-метрики, countdown, event type — для них Oswald корректен.
- **Олива `#4d5e23`** как primary. Заменяем на vivid green `#22C55E`.
- **`text-green-600` / `text-red-500` / `bg-green-600`** хардкод в коде. Заменяем на `text-primary` / `text-danger` / `bg-primary`.
- **Border вокруг каждой карточки.** По умолчанию карточка без border, отделяется тенью + фоном.
- **Дублирование данных:** «Голоса (N)» сверху и «Придут (N)» снизу; «4 аватара + Показать всех + 16/18» — выбираем одно представление.
- **Эйбрау на каждый блок.** Если карточка одна и её смысл очевиден из заголовка — эйбрау не нужен.
- **Кнопки `.bg-primary/10 text-primary` для бейджей роли.** Заменяем на `bg-primary-soft text-primary`.
- **Нативные `<select>` без обёртки** в формах создания. Используем `Select.tsx` единый.
- **Иконка `+` юникодом или текстом.** Используем SVG из `Icons.tsx`.
- **«Сохраняю…», «Загружаю…»** как состояние кнопки. Используем спиннер-иконку или `disabled + opacity`.

---

## Чек-лист перед коммитом UI-изменений

1. Использую только токены из этого документа? (нет хардкод-хексов, `text-green-600` и т.п.)
2. Карточки имеют `shadow-card`, не border?
3. Заголовки — `font-sans` + жирность, не uppercase Oswald?
4. Числа — `tabular-nums`?
5. Действия пользователя — primary; всё остальное — secondary?
6. Цвет несёт смысл? (нет «красивого красного»)
7. Состояния пустоты, загрузки, ошибки — на месте?
8. Тап-таргеты ≥ 44px?
9. Нет дублирующейся информации в соседних блоках?
10. Изменения вписываются в правила экрана из раздела «Правила экранов»?
