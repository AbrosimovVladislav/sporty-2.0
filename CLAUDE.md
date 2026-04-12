# Sporty 2.0

Telegram Mini App для управления любительскими спортивными командами.

## Стек

- **Framework**: Next.js 16 (App Router, TypeScript strict)
- **Стили**: Tailwind CSS 4 (конфиг через `@theme` в globals.css, без tailwind.config)
- **БД + Auth**: Supabase (PostgreSQL, Row Level Security)
- **Telegram**: @tma.js/sdk-react
- **Деплой**: Vercel

## Структура проекта

```
src/
├── app/              ← страницы, layout, API routes
├── components/       ← React-компоненты
├── lib/              ← утилиты, конфигурация, Supabase-клиент
└── types/            ← TypeScript типы
docs/                 ← продуктовая документация
```

## Команды

```bash
npm run dev       # dev-сервер (Turbopack)
npm run build     # production-билд
npm run lint      # ESLint
```

## Какую доку читать

| Задача | Документ |
|--------|----------|
| Общий обзор, список эпиков | README.md |
| Авторизация, первый вход | docs/onboarding.md |
| Команды, состав, заявки | docs/team.md |
| События, голосование, финансы | docs/event.md |
| Профиль игрока, поиск, лента | docs/player.md |
| Таблицы БД, поля, связи | docs/entities.md |
| Порядок реализации | docs/roadmap.md |
| Цвета, шрифты, компоненты | docs/design-system.md |
| Бот, Mini App, деплой | docs/telegram-bot-setup.md |

Читай только тот документ, который нужен для текущей задачи.

## Код-конвенции

- **Язык кода**: английский
- **Язык документации**: русский
- **Компоненты**: functional, именованный экспорт, PascalCase файлы
- **Утилиты**: camelCase файлы
- **CSS**: только Tailwind utility classes + токены из globals.css
- **Импорты**: `@/` алиас
- **API**: `src/app/api/` — Route Handlers

## Правила

- Не добавляй зависимости без согласования
- Не создавай и не перезаписывай docs/ без согласования
- Telegram SDK может быть недоступен в браузере — всегда проверяй
- Следуй docs/design-system.md при создании UI
- БД: не усложняй схему, следуй docs/entities.md и границам сущностей

## Переменные окружения

`.env.local` (не коммитить):

```
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
