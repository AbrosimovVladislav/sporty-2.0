# Дизайн-система Sporty 2.0

Референс: [docs/design/ref.png](design/ref.png)

## Палитра

| Токен | Значение | Где используется |
|-------|----------|------------------|
| `background` | `#f5f4ef` | Основной фон (тёплый off-white) |
| `background-card` | `#ffffff` | Карточки, списки |
| `background-dark` | `#1a1a1a` | Тёмные секции, хедеры, герои |
| `background-dark-elevated` | `#2a2a2a` | Элементы поверх тёмного фона |
| `foreground` | `#1a1a1a` | Основной текст |
| `foreground-secondary` | `#6b6b6b` | Второстепенный текст, подписи |
| `foreground-on-dark` | `#ffffff` | Текст на тёмном фоне |
| `foreground-on-dark-muted` | `#a0a0a0` | Приглушённый текст на тёмном |
| `primary` | `#4d5e23` | Кнопки, активные табы, акценты (оливковый) |
| `primary-hover` | `#5e7129` | Ховер-состояние primary |
| `primary-foreground` | `#ffffff` | Текст на primary-кнопках |
| `border` | `#e5e5e0` | Разделители, границы карточек |
| `border-dark` | `#333333` | Границы на тёмном фоне |

## Типографика

| Назначение | Шрифт | Tailwind-класс | Пример |
|------------|-------|----------------|--------|
| Заголовки (display) | Oswald (condensed, bold, uppercase) | `font-display font-bold uppercase` | ALL MATCHES, SCORE CARD |
| Основной текст | Geist Sans | `font-sans` | описания, подписи |
| Моноширинный | Geist Mono | `font-mono` | код, данные |

### Размеры заголовков

- Hero-заголовок: `text-3xl font-display font-bold uppercase`
- Заголовок секции: `text-xl font-display font-semibold uppercase`
- Заголовок карточки: `text-lg font-display font-semibold`
- Подзаголовок: `text-sm font-sans text-foreground-secondary`

## Скругления

| Токен | Значение | Где |
|-------|----------|-----|
| `rounded-sm` | 8px | Мелкие элементы |
| `rounded-md` | 12px | Карточки, инпуты |
| `rounded-lg` | 16px | Крупные карточки, модалки |
| `rounded-full` | 9999px | Pill-кнопки, табы, аватарки |

## Компоненты (паттерны)

### Кнопка primary
```
bg-primary text-primary-foreground font-display font-semibold uppercase
rounded-full px-6 py-3
hover:bg-primary-hover transition-colors
```

### Pill-таб (активный)
```
bg-primary text-primary-foreground rounded-full px-4 py-2
font-sans text-sm font-medium
```

### Pill-таб (неактивный)
```
bg-background-card text-foreground border border-border rounded-full px-4 py-2
font-sans text-sm font-medium
```

### Карточка
```
bg-background-card rounded-lg p-4 border border-border
```

### Тёмная секция (герой/хедер)
```
bg-background-dark text-foreground-on-dark p-6 rounded-lg
```

### Аватарка
```
w-10 h-10 rounded-full bg-background-dark-elevated overflow-hidden
```
