import type { Booking } from "@prisma/client";
import { formatSlot } from "./moscow";
import { SITE } from "./site";

export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data?: string; url?: string }[][];
};

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

export function processingKeyboard(): InlineKeyboard {
  return {
    inline_keyboard: [[{ text: "Обрабатываю…", callback_data: "wait" }]],
  };
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
    "/pending — заявки, которые ждут ответа",
  ].join("\n");
}

async function telegramCall(
  method: string,
  body: Record<string, unknown>,
  timeoutMs = 20000,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const payload = (await res.json().catch(() => null)) as { ok?: boolean; result?: unknown } | null;
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
  replyMarkup?: InlineKeyboard,
) {
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function deleteTelegramWebhook() {
  const deleted = await telegramCall("deleteWebhook", { drop_pending_updates: false });
  await telegramCall("setMyCommands", {
    commands: [
      { command: "start", description: "О боте" },
      { command: "pending", description: "Заявки в ожидании" },
    ],
  });
  return deleted;
}

export async function getTelegramUpdates(offset: number) {
  try {
    const payload = await telegramCall(
      "getUpdates",
      {
        offset,
        timeout: 25,
        allowed_updates: ["message", "callback_query"],
      },
      35000,
    );
    if (!payload) return null;
    return (payload.result as (TelegramUpdate & { update_id: number })[]) || [];
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") return [];
    throw error;
  }
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
    commands: [
      { command: "start", description: "О боте" },
      { command: "pending", description: "Заявки в ожидании" },
    ],
  });
  return webhook;
}
