# Настройка Telegram-бота и Mini App

## 1. Создание бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь `/newbot`
3. Укажи имя бота (например, `Sporty 2.0`)
4. Укажи username (например, `sporty2_bot`) — должен заканчиваться на `bot`
5. Скопируй токен бота — он понадобится в `.env.local`

## 2. Настройка Mini App

1. В BotFather отправь `/mybots` → выбери бота
2. **Bot Settings** → **Menu Button** → задай URL Vercel-деплоя:
   - Например: `https://sporty-2-0.vercel.app`
3. Или настрой через `/newapp`:
   - Title: `Sporty 2.0`
   - Web App URL: URL приложения на Vercel

## 3. Переменные окружения

Создай `.env.local` в корне проекта:

```env
TELEGRAM_BOT_TOKEN=<токен от BotFather>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<username бота без @>
```

В Vercel: Settings → Environment Variables — добавь те же переменные.

## 4. Деплой на Vercel

1. Импортируй репозиторий на [vercel.com](https://vercel.com)
2. Добавь переменные окружения (см. выше)
3. После деплоя скопируй URL и обнови его в BotFather (Menu Button или Web App URL)

## 5. Проверка работы

- Приложение должно открываться внутри Telegram
- В консоли браузера (Telegram Desktop → DevTools) не должно быть ошибок инициализации SDK
- `window.Telegram.WebApp` должен быть доступен

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| Белый экран в Mini App | Проверь URL в BotFather, убедись что деплой прошёл успешно |
| SDK init failed | Проверь что `telegram-web-app.js` подключён в layout.tsx |
| Бот не показывает кнопку меню | Настрой Menu Button в BotFather → Bot Settings |
