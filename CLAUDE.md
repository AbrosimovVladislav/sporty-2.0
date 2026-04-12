# Sporty 2.0

Telegram Mini App для управления любительскими спортивными командами.

## Стек

- **Frontend + Backend**: Next.js 16 (App Router, TypeScript)
- **Стили**: Tailwind CSS 4
- **Telegram**: @tma.js/sdk-react + telegram-web-app.js
- **Язык**: TypeScript (strict mode)

## Структура проекта

```
src/
├── app/              ← Next.js App Router (страницы, layout, API routes)
├── components/       ← React-компоненты
├── lib/              ← Утилиты, хелперы, конфигурация
└── types/            ← TypeScript типы
docs/                 ← Продуктовая документация (эпики, гайды)
```

## Команды

```bash
npm run dev       # dev-сервер (Turbopack)
npm run build     # production-билд
npm run start     # запуск production
npm run lint      # ESLint
```

## Перед началом работы

1. **Прочитай README.md** — описание проекта и список эпиков
2. **Прочитай документ эпика**, над которым работаешь (в docs/)
3. Если эпика нет в docs/ — уточни у пользователя

## Код-конвенции

- **Язык кода**: английский (переменные, функции, компоненты)
- **Язык документации**: русский
- **Компоненты**: functional components, именованный экспорт
- **Файлы компонентов**: PascalCase (например, `PlayerCard.tsx`)
- **Утилиты/хелперы**: camelCase (например, `formatDate.ts`)
- **CSS**: только Tailwind utility classes, без кастомного CSS (кроме globals.css)
- **Импорты**: использовать `@/` алиас (например, `@/components/PlayerCard`)
- **API routes**: `src/app/api/` — Next.js Route Handlers

## Правила

- **Не добавляй зависимости** без согласования с пользователем
- **Не создавай файлы документации** — только по запросу
- **Telegram SDK**: всегда проверяй, запущено ли приложение внутри Telegram (SDK может быть недоступен в dev-режиме в браузере)
- **Не удаляй и не перезаписывай** существующие docs/ файлы без согласования
- **Дизайн**: следуй docs/design-system.md (когда будет создан)

## Переменные окружения

Файл `.env.local` (не коммитить):

```
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
```


