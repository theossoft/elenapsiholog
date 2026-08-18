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
  keyboard: { text: string; request_contact?: boolean }[][];
  resize_keyboard?: boolean;
  is_persistent?: boolean;
  one_time_keyboard?: boolean;
};

export type TelegramMarkup = InlineKeyboard | ReplyKeyboard;

type NotifyOptions = {
  replyMarkup?: InlineKeyboard;
  chatIds?: string[];
};

type TelegramChat = { id: number };
type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramContact = {
  phone_number: string;
  first_name: string;
  user_id?: number;
};

export type TelegramUpdate = {
  message?: {
    message_id: number;
    chat: TelegramChat;
    from?: TelegramUser;
    text?: string;
    contact?: TelegramContact;
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

type TelegramApiResponse = {
  ok?: boolean;
  result?: unknown;
};

let cachedBotUsername = (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "").trim();

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
    booking.name ? `Имя: ${escapeHtml(booking.name)}` : "Имя: пока не указано",
    booking.phone ? `Телефон: ${escapeHtml(booking.phone)}` : "",
    booking.telegram ? `Telegram: ${escapeHtml(booking.telegram)}` : "",
    booking.email ? `Email: ${escapeHtml(booking.email)}` : "",
    booking.note ? `Запрос: ${escapeHtml(booking.note)}` : "",
    booking.meetLink ? `Ссылка: ${escapeHtml(booking.meetLink)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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

function postTelegram(path: string, payload: string, family: 4 | 6) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const https = require(/* webpackIgnore: true */ "https") as typeof import("https");
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path,
        method: "POST",
        family,
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function telegramCall(method: string, body: Record<string, unknown> = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const path = `/bot${token}/${method}`;
  const payload = JSON.stringify(body);
  // This host has working IPv6 to Telegram and a black-holed IPv4.
  // Next.js fetch races both and hits ConnectTimeoutError.
  let res: { status: number; text: string };
  try {
    res = await postTelegram(path, payload, 6);
  } catch (error) {
    console.error("[telegram]", method, "ipv6 failed", error);
    try {
      res = await postTelegram(path, payload, 4);
    } catch (fallback) {
      console.error("[telegram]", method, fallback);
      return null;
    }
  }

  const parsed = (() => {
    try {
      return JSON.parse(res.text) as TelegramApiResponse;
    } catch {
      return null;
    }
  })();
  if (res.status >= 400 || !parsed?.ok) {
    console.error("[telegram]", method, parsed || res.text);
    return null;
  }
  return parsed;
}

export async function telegramBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  const payload = await telegramCall("getMe");
  const result = payload?.result as { username?: string } | undefined;
  const username = (result?.username || "").replace(/^@/, "").trim();
  if (username) cachedBotUsername = username;
  return username;
}

export async function telegramBotStartUrl(token?: string) {
  const username = await telegramBotUsername();
  if (!username) return "";
  if (token) return `https://t.me/${username}?start=${encodeURIComponent(token)}`;
  return `https://t.me/${username}`;
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
  await telegramBotUsername();
  await telegramCall("setMyCommands", {
    commands: [
      { command: "start", description: "О боте" },
      { command: "booking", description: "Моя запись" },
      { command: "book", description: "Записаться" },
    ],
    scope: { type: "default" },
  });
  await Promise.all(
    adminChatIds().map((chat_id) =>
      telegramCall("setMyCommands", {
        commands: [
          { command: "start", description: "О боте" },
          { command: "calendar", description: "Календарь встреч" },
          { command: "pending", description: "Заявки в ожидании" },
        ],
        scope: { type: "chat", chat_id },
      }),
    ),
  );
  return webhook;
}
