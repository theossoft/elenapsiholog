import type { Booking } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { setBookingStatus } from "@/lib/booking-status";
import {
  adminChatIds,
  adminHelpText,
  answerCallback,
  bookingCard,
  confirmedKeyboard,
  editTelegramMessage,
  guestHelpText,
  isAdminChat,
  notifyTelegram,
  pendingKeyboard,
  sendTelegramMessage,
  telegramWebhookSecret,
  type InlineKeyboard,
  type TelegramUpdate,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = telegramWebhookSecret();
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message) await handleMessage(update.message);
  } catch (error) {
    console.error("[telegram webhook]", error);
  }

  return NextResponse.json({ ok: true });
}

async function handleMessage(message: NonNullable<TelegramUpdate["message"]>) {
  const text = (message.text || "").trim();
  const admin = isAdminChat(message.chat.id, message.from?.id);

  if (!admin) {
    await sendTelegramMessage(message.chat.id, guestHelpText());
    return;
  }

  const command = text.split(/\s+/)[0]?.split("@")[0] || "";
  if (command === "/pending") {
    await sendPendingList(message.chat.id);
    return;
  }

  if (command === "/start" || command === "/help" || command.startsWith("/")) {
    await sendTelegramMessage(message.chat.id, adminHelpText());
  }
}

async function sendPendingList(chatId: number) {
  const pending = await prisma.booking.findMany({
    where: { status: "pending" },
    orderBy: { slotStart: "asc" },
    take: 10,
  });

  if (!pending.length) {
    await sendTelegramMessage(chatId, "Нет заявок в ожидании.");
    return;
  }

  for (const booking of pending) {
    await sendTelegramMessage(chatId, bookingCard(booking, "Заявка в ожидании"), pendingKeyboard(booking.id));
  }
}

async function handleCallback(query: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = query.message?.chat.id;
  const userId = query.from.id;
  const data = query.data || "";
  const match = /^(ok|no):(.+)$/.exec(data);

  if (!isAdminChat(chatId, userId)) {
    await answerCallback(query.id, "Нет доступа");
    return;
  }

  if (!match || chatId == null || !query.message) {
    await answerCallback(query.id, "Не получилось обработать");
    return;
  }

  const action = match[1];
  const id = match[2];
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    await answerCallback(query.id, "Заявка не найдена");
    await editTelegramMessage(chatId, query.message.message_id, "Заявка не найдена.");
    return;
  }

  if (action === "ok") {
    if (booking.status === "cancelled" || booking.status === "completed") {
      await answerCallback(query.id, "Эту заявку уже нельзя подтвердить");
      await editTelegramMessage(chatId, query.message.message_id, bookingCard(booking, titleFor(booking.status)));
      return;
    }

    if (booking.status === "confirmed") {
      await answerCallback(query.id, "Уже подтверждена");
      await editTelegramMessage(
        chatId,
        query.message.message_id,
        confirmedText(booking),
        confirmedKeyboard(booking.id),
      );
      return;
    }

    const result = await setBookingStatus(booking.id, "confirmed");
    if ("error" in result) {
      await answerCallback(query.id, "Не удалось подтвердить");
      return;
    }

    const text = confirmedText(result.booking);
    await answerCallback(query.id, "Запись подтверждена");
    await editTelegramMessage(
      chatId,
      query.message.message_id,
      text,
      confirmedKeyboard(result.booking.id),
    );
    await notifyOthers(chatId, text, confirmedKeyboard(result.booking.id));
    return;
  }

  if (booking.status === "cancelled") {
    await answerCallback(query.id, "Уже отменена");
    await editTelegramMessage(chatId, query.message.message_id, bookingCard(booking, "Запись отменена"));
    return;
  }

  if (booking.status === "completed") {
    await answerCallback(query.id, "Сессия уже завершена");
    await editTelegramMessage(chatId, query.message.message_id, bookingCard(booking, "Сессия завершена"));
    return;
  }

  const result = await setBookingStatus(booking.id, "cancelled");
  if ("error" in result) {
    await answerCallback(query.id, "Не удалось отменить");
    return;
  }

  await answerCallback(query.id, "Запись отменена");
  await editTelegramMessage(chatId, query.message.message_id, bookingCard(result.booking, "Запись отменена"));
  await notifyOthers(chatId, bookingCard(result.booking, "Запись отменена"));
}

function confirmedText(booking: Booking) {
  const card = bookingCard(booking, "Запись подтверждена");
  if (booking.meetLink) return card;
  return `${card}\nСсылку на встречу можно добавить в админке: ${SITE.url}/admin`;
}

function titleFor(status: string) {
  if (status === "confirmed") return "Запись подтверждена";
  if (status === "cancelled") return "Запись отменена";
  if (status === "completed") return "Сессия завершена";
  return "Заявка в ожидании";
}

async function notifyOthers(actorChatId: number, text: string, replyMarkup?: InlineKeyboard) {
  const others = adminChatIds().filter((id) => id !== String(actorChatId));
  if (!others.length) return;
  await notifyTelegram(text, { chatIds: others, replyMarkup });
}
