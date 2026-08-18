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
- `TELEGRAM_BOT_USERNAME` — username бота без `@` (для ссылки после заявки). Если пусто, берётся из Telegram `getMe`
- `TELEGRAM_WEBHOOK_SECRET` — секрет webhook (латиница, цифры, `_` и `-`). Если пусто, используется очищенный `NEXTAUTH_SECRET`
- `TELEGRAM_WEBHOOK_IP` — IPv4 сервера для webhook (чтобы Telegram не ходил на кириллический домен)
- `NEXT_PUBLIC_METRIKA_ID` — Яндекс.Метрика (грузится после согласия)
- `NEXTAUTH_SECRET` — длинная случайная строка на проде
- `NEXTAUTH_URL` — публичный URL сайта

После деплоя один раз зарегистрируйте webhook:

`/api/telegram/setup?secret=NEXTAUTH_SECRET`

В боте у Елены на новой заявке появятся кнопки «Подтвердить» и «Отменить». Команда `/calendar` (или кнопка «Календарь») показывает ближайшие встречи по дням. `/pending` — заявки в ожидании.

Клиент после заявки на сайте открывает бота по ссылке «Открыть бота записи». В боте можно смотреть время встречи, получать напоминание за час и записываться на следующую сессию, не заходя на сайт. Команды клиента: `/booking` — моя запись, `/book` — записаться.

Напоминание за час до сессии (Елене и клиенту, если бот подключён): раз в 10 минут вызывайте

`/api/cron/remind?secret=NEXTAUTH_SECRET`

На сервере, crontab:

```
*/10 * * * * curl -fsS "https://elenapsiholog.ru/api/cron/remind?secret=NEXTAUTH_SECRET" >/dev/null
```

## Стек

Next.js App Router, Tailwind, Prisma, SQLite, NextAuth.
