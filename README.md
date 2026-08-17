# Елена Иванова — лендинг психолога

Сайт онлайн-записи: [elenapsiholog.ru](https://elenapsiholog.ru).

## Запуск локально

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Админка: `/admin`  
Логин и пароль — в `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). После смены пароля снова запустите seed.

## Переменные

Скопируйте `.env.example` в `.env`:

- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` — уведомления о заявках. Несколько получателей: chat_id через запятую, например `111,222`
- `NEXT_PUBLIC_METRIKA_ID` — Яндекс.Метрика (грузится после согласия)
- `NEXTAUTH_SECRET` — длинная случайная строка на проде
- `NEXTAUTH_URL` — публичный URL сайта

Бот сам забирает нажатия кнопок с сервера (опрос), без входящего webhook. Так надёжнее из России.

В боте на новой заявке появляются кнопки «Подтвердить» и «Отменить». Команда `/pending` показывает заявки в ожидании. Если бота откроет клиент, он увидит ссылку на сайт и личный Telegram.

Напоминание за час до сессии: раз в 10 минут вызывайте

`/api/cron/remind?secret=NEXTAUTH_SECRET`

## Стек

Next.js App Router, Tailwind, Prisma, SQLite, NextAuth.
