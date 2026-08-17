import type { Booking } from "@prisma/client";
import {
  daysInMoscowMonth,
  formatCalendarHeading,
  formatMonthTitle,
  formatSlot,
  formatTime,
  moscowDateString,
  moscowParts,
  moscowToUtc,
  pad,
  weekdayOfDate,
} from "./moscow";
import { SITE } from "./site";

export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data?: string; url?: string }[][];
};

export type ReplyKeyboard = {
  keyboard: { text: string }[][];
  resize_keyboard?: boolean;
  is_persistent?: boolean;
};

export type TelegramMarkup = InlineKeyboard | ReplyKeyboard;

type NotifyOptions = {
  replyMarkup?: InlineKeyboard;
  chatIds?: string[];
};

type TelegramChat = { id: number };
type TelegramUser = { id: number };

export type TelegramUpdate = {
  message?: {
    message_id: number;
    chat: TelegramChat;
    from?: TelegramUser;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: TelegramUser;
    data?: string;
    message?: {
      message_id: number;
      chat: TelegramChat;
      text?: string;
    };
  };
};

export function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function adminChatIds() {
  return (process.env.TELEGRAM_CHAT_ID || "")
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminChat(chatId?: string | number, userId?: string | number) {
  const admins = adminChatIds();
  if (!admins.length) return false;
  return (
    (chatId != null && admins.includes(String(chatId))) ||
    (userId != null && admins.includes(String(userId)))
  );
}

export function telegramWebhookUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;
  return new URL("/api/telegram/webhook", `${base.replace(/\/$/, "")}/`).href;
}

export function telegramWebhookSecret() {
  const explicit = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (explicit) return explicit;
  return (process.env.NEXTAUTH_SECRET || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 128);
}

export function pendingKeyboard(id: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "Подтвердить", callback_data: `ok:${id}` },
        { text: "Отменить", callback_data: `no:${id}` },
      ],
    ],
  };
}

export function confirmedKeyboard(id: string): InlineKeyboard {
  return {
    inline_keyboard: [[{ text: "Отменить", callback_data: `no:${id}` }]],
  };
}

export function bookingCard(booking: Booking, title: string) {
  return [
    `<b>${escapeHtml(title)}</b>`,
    formatSlot(booking.slotStart),
    `Имя: ${escapeHtml(booking.name)}`,
    `Телефон: ${escapeHtml(booking.phone)}`,
    booking.telegram ? `Telegram: ${escapeHtml(booking.telegram)}` : "",
    booking.note ? `Запрос: ${escapeHtml(booking.note)}` : "",
    booking.meetLink ? `Ссылка: ${escapeHtml(booking.meetLink)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function guestHelpText() {
  return [
    "Это бот записи на сессии Елены Ивановой, не чат с психологом.",
    "",
    "Чтобы записаться или написать:",
    SITE.url,
    `Telegram: ${SITE.telegram}`,
  ].join("\n");
}

export function adminHelpText() {
  return [
    "Сюда приходят новые заявки. Можно сразу нажать «Подтвердить» или «Отменить».",
    "",
    `Расписание и тексты сайта — в админке: ${SITE.url}/admin`,
    "",
    "Команды:",
    "/calendar — календарь предстоящих встреч",
    "/pending — заявки, которые ждут ответа",
  ].join("\n");
}

export function adminReplyKeyboard(): ReplyKeyboard {
  return {
    keyboard: [[{ text: "Календарь" }, { text: "Ожидают" }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

const CALENDAR_STATUS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
};

function monthGrid(year: number, month: number, busy: Set<string>) {
  const title = formatMonthTitle(moscowToUtc(`${year}-${pad(month)}-01`, "12:00"));
  const weekday = weekdayOfDate(`${year}-${pad(month)}-01`);
  const lastDay = daysInMoscowMonth(year, month);
  const header = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((name) => name.padEnd(4, " ")).join("");
  const cells: string[] = [];
  for (let i = 1; i < weekday; i += 1) cells.push("    ");
  for (let day = 1; day <= lastDay; day += 1) {
    const key = `${year}-${pad(month)}-${pad(day)}`;
    const num = String(day).padStart(2, " ");
    cells.push(busy.has(key) ? `${num}* ` : `${num}  `);
  }
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7).join(""));
  }
  return [`    ${title}`, header, ...rows].join("\n");
}

function calendarMonths(now: Date) {
  const parts = moscowParts(now);
  return [0, 1].map((offset) => {
    let month = parts.month + offset;
    let year = parts.year;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
    return { year, month };
  });
}

export function upcomingCalendarText(bookings: Booking[], now = new Date()) {
  if (!bookings.length) {
    return "Ближайших встреч нет.";
  }

  const busy = new Set(bookings.map((booking) => moscowDateString(booking.slotStart)));
  const grids = calendarMonths(now)
    .map(({ year, month }) => monthGrid(year, month, busy))
    .join("\n\n");

  const groups = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const key = moscowDateString(booking.slotStart);
    const list = groups.get(key) || [];
    list.push(booking);
    groups.set(key, list);
  }

  const days = [...groups.values()].map((dayBookings) => {
    const heading = formatCalendarHeading(dayBookings[0].slotStart);
    const lines = dayBookings.map((booking) => {
      const status = CALENDAR_STATUS[booking.status] || booking.status;
      const telegram = booking.telegram ? `, ${escapeHtml(booking.telegram)}` : "";
      return `${formatTime(booking.slotStart)} — ${escapeHtml(booking.name)}${telegram} · ${status}`;
    });
    return `<b>${escapeHtml(heading)}</b>\n${lines.join("\n")}`;
  });

  return [`<b>Календарь встреч</b>`, `<pre>${grids}\n\n* есть встреча</pre>`, ...days].join("\n\n");
}

export function splitTelegramText(text: string, limit = 3900) {
  if (text.length <= limit) return [text];

  const parts: string[] = [];
  let current = "";
  for (const chunk of text.split("\n\n")) {
    const next = current ? `${current}\n\n${chunk}` : chunk;
    if (next.length > limit && current) {
      parts.push(current);
      current = chunk;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

async function telegramCall(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  if (!res.ok || !payload?.ok) {
    console.error("[telegram]", method, payload);
    return null;
  }
  return payload;
}

export async function notifyTelegram(text: string, options?: NotifyOptions) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = options?.chatIds ?? adminChatIds();
  if (!token || !chatIds.length) {
    console.info("[telegram skipped]", text);
    return;
  }

  await Promise.all(
    chatIds.map((chat_id) =>
      telegramCall("sendMessage", {
        chat_id,
        text,
        parse_mode: "HTML",
        ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
      }),
    ),
  );
}

export async function notifyNewBooking(booking: Booking) {
  await notifyTelegram(`${bookingCard(booking, "Новая заявка на сессию")}\n${SITE.url}/admin`, {
    replyMarkup: pendingKeyboard(booking.id),
  });
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
) {
  await telegramCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup ?? { inline_keyboard: [] },
  });
}

export async function answerCallback(callbackQueryId: string, text: string) {
  await telegramCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: TelegramMarkup,
) {
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function setTelegramWebhook(url: string, dropPending = false) {
  const secret = telegramWebhookSecret();
  const ip = process.env.TELEGRAM_WEBHOOK_IP?.trim();
  const webhook = await telegramCall("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: dropPending,
    ...(ip ? { ip_address: ip } : {}),
  });
  await telegramCall("setMyCommands", {
    commands: [{ command: "start", description: "О боте" }],
  });
  const adminCommands = [
    { command: "start", description: "О боте" },
    { command: "calendar", description: "Календарь встреч" },
    { command: "pending", description: "Заявки в ожидании" },
  ];
  await Promise.all(
    adminChatIds().map((chat_id) =>
      telegramCall("setMyCommands", {
        commands: adminCommands,
        scope: { type: "chat", chat_id: Number(chat_id) || chat_id },
      }),
    ),
  );
  return webhook;
}
