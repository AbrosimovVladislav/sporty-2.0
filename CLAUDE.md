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
| Авторизация, первый вход | docs/features/onboarding/onboarding.md |
| Команды, состав, заявки | docs/features/team/team.md |
| События, голосование, финансы | docs/features/event/event.md |
| Профиль игрока, навигация | docs/features/player/player.md |
| Таблицы БД, поля, связи | docs/tech/db-entities.md |
| Порядок реализации MVP | docs/mvp-roadmap.md |
| Идеи за рамками MVP | docs/post-mvp.md |
| Цвета, шрифты, компоненты, правила экранов | docs/design/design-system.md |
| Расхождения текущего UI с дизайн-системой | docs/ui-consistency-audit.md |
| Шаблон задачи по UI (обязательно перед любой UI-задачей) | docs/ui-task-template.md |
| Бот, Mini App, деплой | docs/tech/telegram-bot-setup.md |

Документация разбита на три раздела: `docs/features/` — продуктовые эпики, `docs/design/` — дизайн-система и референсы, `docs/tech/` — техническая документация. Эпики организованы по папкам: `docs/features/<эпик>/<эпик>.md` — индекс с обзором и ссылками на под-документы. Под-документы именуются `[<эпик>]-<тема>.md` (например, `[team]-roster-tab.md`).

Читай сначала индекс эпика, затем переходи к нужному под-документу.

## Код-конвенции

- **Язык кода**: английский
- **Язык документации**: русский
- **Компоненты**: functional, именованный экспорт, PascalCase файлы
- **Утилиты**: camelCase файлы
- **CSS**: только Tailwind utility classes + токены из globals.css
- **Импорты**: `@/` алиас
- **API**: `src/app/api/` — Route Handlers

## Правила

- **Git**: не делай коммиты. Пользователь управляет git самостоятельно
- **Миграции**: применяй через Supabase MCP (`apply_migration`), не проси пользователя делать вручную. Project ID: `nxahiklyhwducxoqimoq`
- Не добавляй зависимости без согласования
- Telegram SDK может быть недоступен в браузере — всегда проверяй
- Следуй docs/design/design-system.md при создании UI
- БД: не усложняй схему, следуй docs/tech/db-entities.md и границам сущностей

## Документация

- После любого изменения в приложении (новая фича, рефакторинг экрана, изменение API, новая таблица) обнови соответствующий документ в `docs/`
- Документация описывает текущее состояние приложения, а не историю изменений
- Пиши чётко и лаконично: без воды, без вводных фраз, без повторов
- Один факт — одно место. Если фича на стыке эпиков — описание в одном документе, в других только ссылка
- Структура: `docs/features/<эпик>/<эпик>.md` (индекс) → под-документы `[<эпик>]-<тема>.md`. Кросс-доки в `docs/design/`, `docs/tech/` и в корне `docs/`
- Не создавай новые документы без согласования — сначала предложи место и название

## Переменные окружения

`.env.local` (не коммитить):

```
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # только серверный код, не коммитить!
```
