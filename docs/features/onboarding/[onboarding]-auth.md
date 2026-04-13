# Вход через Telegram

Авторизация автоматическая — по `initData` при открытии Mini App. Отдельной формы логина нет.

## Флоу

Во время загрузки Mini App показывается спиннер. Параллельно:

1. Приложение вызывает `POST /api/auth/telegram` с `initData`.
2. Бэкенд валидирует подпись, создаёт или находит пользователя в таблице `User`.
3. Возвращает запись `User`.

## Маршрутизация после авторизации

- `onboarding_completed === false` → экран онбординга ([profile-setup]([onboarding]-profile-setup.md))
- `onboarding_completed === true` → главный экран (`/home`)
