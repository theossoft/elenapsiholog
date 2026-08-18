import type { Booking } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { createBooking } from "@/lib/create-booking";
import { isCompletePhone, normalizePhone } from "@/lib/booking-form";
import { formatDayLabel, formatSlot, moscowDateString } from "@/lib/moscow";
import { listAvailableSlots, type PublicSlot } from "@/lib/slots";
import {
  answerCallback,
  editTelegramMessage,
  escapeHtml,
  sendTelegramMessage,
  type InlineKeyboard,
  type ReplyKeyboard,
  type TelegramUpdate,
} from "@/lib/telegram";

const DAYS_PER_PAGE = 8;
const CLIENT_STATUS: Record<string, string> = {
  pending: "ожидает подтверждения",
  confirmed: "подтверждена",
  cancelled: "отменена",
  completed: "завершена",
};

type SessionStep = "ask_name" | "ask_phone" | "ask_consent";
type SessionPayload = {
  name?: string;
  phone?: string;
  username?: string;
};

export function clientReplyKeyboard(): ReplyKeyboard {
  return {
    keyboard: [[{ text: "Моя запись" }, { text: "Записаться" }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

function phoneKeyboard(): ReplyKeyboard {
  return {
    keyboard: [[{ text: "Отправить телефон", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function nameKeyboard(suggested?: string): ReplyKeyboard | undefined {
  const name = suggested?.trim();
  if (!name) return undefined;
  return {
    keyboard: [[{ text: name }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function consentKeyboard(): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "Согласен", callback_data: "cconsent" }],
      [{ text: "Политика конфиденциальности", url: `${SITE.url}/privacy` }],
    ],
  };
}

export function clientWelcomeText() {
  return [
    "Это бот записи на сессии Елены Ивановой, не чат с психологом.",
    "",
    "Здесь можно посмотреть время встречи, получить напоминание и выбрать следующую сессию.",
    "",
    `Чтобы написать Елене: ${SITE.telegram}`,
    `Сайт: ${SITE.url}`,
  ].join("\n");
}

function clientStatus(status: string) {
  return CLIENT_STATUS[status] || status;
}

export function clientBookingCard(booking: Booking, title: string) {
  return [
    `<b>${escapeHtml(title)}</b>`,
    `${escapeHtml(formatSlot(booking.slotStart))} (МСК)`,
    `Статус: ${clientStatus(booking.status)}`,
    booking.meetLink ? `Ссылка: ${escapeHtml(booking.meetLink)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function clientReminderText(booking: Booking) {
  return [
    "<b>Напоминание: сессия через час</b>",
    `${escapeHtml(formatSlot(booking.slotStart))} (МСК)`,
    booking.meetLink ? `Ссылка: ${escapeHtml(booking.meetLink)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyClientBooking(booking: Booking, text: string) {
  if (!booking.telegramChatId) return;
  await sendTelegramMessage(booking.telegramChatId, text, clientReplyKeyboard());
}

export async function notifyClientStatus(booking: Booking) {
  if (!booking.telegramChatId) return;
  if (booking.status === "confirmed") {
    await notifyClientBooking(booking, clientBookingCard(booking, "Запись подтверждена"));
    return;
  }
  if (booking.status === "cancelled") {
    await notifyClientBooking(
      booking,
      [
        clientBookingCard(booking, "Запись отменена"),
        "",
        "Если нужно другое время — нажмите «Записаться».",
      ].join("\n"),
    );
  }
}

async function getSession(chatId: string) {
  return prisma.telegramSession.findUnique({ where: { chatId } });
}

async function setSession(chatId: string, step: SessionStep, payload: SessionPayload) {
  const data = { step, payload: JSON.stringify(payload) };
  await prisma.telegramSession.upsert({
    where: { chatId },
    create: { chatId, ...data },
    update: data,
  });
}

async function clearSession(chatId: string) {
  await prisma.telegramSession.deleteMany({ where: { chatId } });
}

function readPayload(raw: string): SessionPayload {
  try {
    const parsed = JSON.parse(raw || "{}") as SessionPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function getClient(chatId: string) {
  return prisma.telegramClient.findUnique({ where: { chatId } });
}

async function upsertClient(input: {
  chatId: string;
  name: string;
  phone: string;
  username?: string;
}) {
  const phone = normalizePhone(input.phone);
  const username = (input.username || "").replace(/^@/, "").slice(0, 80);
  const consentAt = new Date();
  const client = await prisma.telegramClient.upsert({
    where: { chatId: input.chatId },
    create: {
      chatId: input.chatId,
      name: input.name.trim(),
      phone,
      username,
      consentAt,
    },
    update: {
      name: input.name.trim(),
      phone,
      username,
      consentAt,
    },
  });
  await prisma.booking.updateMany({
    where: {
      phone,
      telegramChatId: "",
      status: { in: ["pending", "confirmed"] },
    },
    data: { telegramChatId: input.chatId },
  });
  return client;
}

async function upcomingBookings(chatId: string) {
  return prisma.booking.findMany({
    where: {
      telegramChatId: chatId,
      status: { in: ["pending", "confirmed"] },
      slotEnd: { gte: new Date() },
    },
    orderBy: { slotStart: "asc" },
  });
}

function parseCommand(text: string) {
  const trimmed = text.trim();
  const [rawCommand, ...rest] = trimmed.split(/\s+/);
  const command = (rawCommand || "").replace(/^\\/, "/").split("@")[0].toLowerCase();
  const payload = rest.join(" ").trim();
  const label = trimmed.replace(/^[\\/]+/, "").split("@")[0].toLowerCase();
  return { command, payload, label };
}

function isBookingCommand(command: string, label: string) {
  return command === "/booking" || command === "/my" || label === "моя запись";
}

function isBookCommand(command: string, label: string) {
  return (
    command === "/book" ||
    command === "/zapis" ||
    label === "записаться" ||
    label === "записаться на сессию"
  );
}

async function sendWelcome(chatId: number | string) {
  await sendTelegramMessage(chatId, clientWelcomeText(), clientReplyKeyboard());
}

async function sendMyBooking(chatId: number | string) {
  const bookings = await upcomingBookings(String(chatId));
  if (!bookings.length) {
    await sendTelegramMessage(
      chatId,
      "Ближайшей записи нет. Можно выбрать время кнопкой «Записаться».",
      clientReplyKeyboard(),
    );
    return;
  }

  const [next, ...rest] = bookings;
  const extra = rest.length ? `\n\nЕщё записей: ${rest.length}.` : "";
  await sendTelegramMessage(chatId, `${clientBookingCard(next, "Ваша запись")}${extra}`, clientReplyKeyboard());
}

async function startOnboarding(
  chatId: string,
  from?: { first_name?: string; username?: string },
) {
  const suggested = from?.first_name?.trim() || "";
  await setSession(chatId, "ask_name", { username: from?.username || "" });
  await sendTelegramMessage(
    chatId,
    suggested
      ? `Как к вам обращаться? Можно нажать кнопку или написать имя.`
      : "Как к вам обращаться? Напишите имя.",
    nameKeyboard(suggested),
  );
}

async function askPhone(chatId: string, payload: SessionPayload) {
  await setSession(chatId, "ask_phone", payload);
  await sendTelegramMessage(
    chatId,
    "Отправьте номер телефона кнопкой ниже или напишите его, как в заявке на сайте.",
    phoneKeyboard(),
  );
}

async function askConsent(chatId: string, payload: SessionPayload) {
  await setSession(chatId, "ask_consent", payload);
  await sendTelegramMessage(chatId, "Телефон получен.", clientReplyKeyboard());
  await sendTelegramMessage(
    chatId,
    "Чтобы вести запись и присылать напоминания, нужно согласие на обработку персональных данных.",
    consentKeyboard(),
  );
}

function groupSlotsByDay(slots: PublicSlot[]) {
  const map = new Map<string, PublicSlot[]>();
  for (const slot of slots) {
    const key = moscowDateString(new Date(slot.start));
    const list = map.get(key) || [];
    list.push(slot);
    map.set(key, list);
  }
  return [...map.entries()];
}

function daysKeyboard(slots: PublicSlot[], page = 0): InlineKeyboard | undefined {
  const days = groupSlotsByDay(slots);
  if (!days.length) return undefined;
  const start = page * DAYS_PER_PAGE;
  const slice = days.slice(start, start + DAYS_PER_PAGE);
  const rows = slice.map(([key, list]) => [
    {
      text: `${formatDayLabel(new Date(list[0].start))} · ${list.length}`,
      callback_data: `cday:${key}`,
    },
  ]);
  const nav: { text: string; callback_data: string }[] = [];
  if (page > 0) nav.push({ text: "Раньше", callback_data: `cdays:${page - 1}` });
  if (start + DAYS_PER_PAGE < days.length) {
    nav.push({ text: "Ещё даты", callback_data: `cdays:${page + 1}` });
  }
  if (nav.length) rows.push(nav);
  return { inline_keyboard: rows };
}

function timesKeyboard(day: string, slots: PublicSlot[]): InlineKeyboard {
  const times = slots.filter((slot) => moscowDateString(new Date(slot.start)) === day);
  const rows: { text: string; callback_data: string }[][] = [];
  const buttons = times.map((slot) => ({
    text: new Date(slot.start).toLocaleTimeString("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
    }),
    callback_data: `ctime:${slot.start}`,
  }));
  for (let i = 0; i < buttons.length; i += 3) {
    rows.push(buttons.slice(i, i + 3));
  }
  rows.push([{ text: "← К датам", callback_data: "cdays:0" }]);
  return { inline_keyboard: rows };
}

async function showDayPicker(
  chatId: number | string,
  page = 0,
  messageId?: number,
) {
  const slots = await listAvailableSlots();
  const keyboard = daysKeyboard(slots, page);
  const text = keyboard
    ? "Выберите день. Часовой пояс — Москва."
    : "Свободных слотов пока нет — напишите Елене в MAX или Telegram, подберём время.";
  if (messageId != null && keyboard) {
    await editTelegramMessage(chatId, messageId, text, keyboard);
    return;
  }
  await sendTelegramMessage(chatId, text, keyboard ?? clientReplyKeyboard());
}

async function beginBooking(chatId: string, from?: { first_name?: string; username?: string }) {
  const client = await getClient(chatId);
  if (!client) {
    await startOnboarding(chatId, from);
    return;
  }
  await clearSession(chatId);
  await showDayPicker(chatId);
}

async function linkByToken(chatId: string, token: string, username?: string) {
  const booking = await prisma.booking.findUnique({ where: { linkToken: token } });
  if (!booking) {
    const existing = await upcomingBookings(chatId);
    if (existing[0]) {
      await sendTelegramMessage(
        chatId,
        `${clientBookingCard(existing[0], "Бот записи уже подключен")}\n\nСюда придёт напоминание за час до сессии.`,
        clientReplyKeyboard(),
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "Ссылка уже не действует. Если заявка была с сайта, нажмите «Моя запись» или запишитесь заново.",
      clientReplyKeyboard(),
    );
    return;
  }
  if (booking.telegramChatId && booking.telegramChatId !== chatId) {
    await sendTelegramMessage(
      chatId,
      "Эта заявка уже привязана к другому Telegram.",
      clientReplyKeyboard(),
    );
    return;
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      telegramChatId: chatId,
      linkToken: null,
      telegram: booking.telegram || (username ? `@${username}` : ""),
    },
  });
  await upsertClient({
    chatId,
    name: updated.name,
    phone: updated.phone,
    username,
  });
  await clearSession(chatId);
  await sendTelegramMessage(
    chatId,
    `${clientBookingCard(updated, "Бот записи подключен")}\n\nСюда придёт напоминание за час до сессии. Следующую встречу можно выбрать кнопкой «Записаться».`,
    clientReplyKeyboard(),
  );
}

export async function handleClientMessage(message: NonNullable<TelegramUpdate["message"]>) {
  const chatId = String(message.chat.id);
  const from = message.from;
  const session = await getSession(chatId);

  if (message.contact?.phone_number) {
    await handlePhoneInput(chatId, message.contact.phone_number, session, from?.username);
    return;
  }

  const text = (message.text || "").trim();
  if (!text) {
    await sendWelcome(chatId);
    return;
  }

  const { command, payload, label } = parseCommand(text);

  if (command === "/start") {
    if (payload) {
      await linkByToken(chatId, payload, from?.username);
      return;
    }
    await clearSession(chatId);
    await sendWelcome(chatId);
    const bookings = await upcomingBookings(chatId);
    if (bookings[0]) {
      await sendTelegramMessage(chatId, clientBookingCard(bookings[0], "Ваша запись"), clientReplyKeyboard());
    }
    return;
  }

  if (command === "/help") {
    await sendWelcome(chatId);
    return;
  }

  if (isBookingCommand(command, label)) {
    await sendMyBooking(chatId);
    return;
  }

  if (isBookCommand(command, label)) {
    await beginBooking(chatId, from);
    return;
  }

  if (session?.step === "ask_name") {
    const name = text.trim();
    if (name.length < 2) {
      await sendTelegramMessage(chatId, "Имя слишком короткое. Напишите, как к вам обращаться.");
      return;
    }
    await askPhone(chatId, { ...readPayload(session.payload), name });
    return;
  }

  if (session?.step === "ask_phone") {
    await handlePhoneInput(chatId, text, session, from?.username);
    return;
  }

  if (session?.step === "ask_consent") {
    await sendTelegramMessage(
      chatId,
      "Нажмите «Согласен» под сообщением выше — так сохранится согласие на обработку данных.",
      consentKeyboard(),
    );
    return;
  }

  await sendWelcome(chatId);
}

async function handlePhoneInput(
  chatId: string,
  raw: string,
  session: { step: string; payload: string } | null,
  username?: string,
) {
  if (session?.step !== "ask_phone") {
    await sendWelcome(chatId);
    return;
  }
  if (!isCompletePhone(raw)) {
    await sendTelegramMessage(
      chatId,
      "Неполный номер. Нажмите «Отправить телефон» или введите 11 цифр, например +7 908 129-41-16.",
      phoneKeyboard(),
    );
    return;
  }
  const payload = { ...readPayload(session.payload), phone: normalizePhone(raw), username: username || "" };
  if (!payload.name) {
    await startOnboarding(chatId, { username });
    return;
  }
  await askConsent(chatId, payload);
}

export async function handleClientCallback(query: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = query.message?.chat.id;
  const data = query.data || "";
  if (chatId == null || !query.message) {
    await answerCallback(query.id, "Не получилось обработать");
    return;
  }

  if (data === "cconsent") {
    const session = await getSession(String(chatId));
    if (session?.step !== "ask_consent") {
      await answerCallback(query.id, "Сначала заполните имя и телефон");
      return;
    }
    const payload = readPayload(session.payload);
    if (!payload.name || !payload.phone) {
      await answerCallback(query.id, "Не хватает данных");
      await startOnboarding(String(chatId), query.from);
      return;
    }
    await upsertClient({
      chatId: String(chatId),
      name: payload.name,
      phone: payload.phone,
      username: payload.username || query.from.username,
    });
    await clearSession(String(chatId));
    await answerCallback(query.id, "Согласие сохранено");
    await editTelegramMessage(
      chatId,
      query.message.message_id,
      "Согласие сохранено. Теперь можно выбрать время.",
    );
    await showDayPicker(chatId);
    return;
  }

  const daysMatch = /^cdays:(\d+)$/.exec(data);
  if (daysMatch) {
    await answerCallback(query.id, "Даты");
    await showDayPicker(chatId, Number(daysMatch[1]), query.message.message_id);
    return;
  }

  const dayMatch = /^cday:(\d{4}-\d{2}-\d{2})$/.exec(data);
  if (dayMatch) {
    const day = dayMatch[1];
    const slots = await listAvailableSlots();
    const times = slots.filter((slot) => moscowDateString(new Date(slot.start)) === day);
    if (!times.length) {
      await answerCallback(query.id, "На этот день слотов уже нет");
      await showDayPicker(chatId, 0, query.message.message_id);
      return;
    }
    await answerCallback(query.id, "Время");
    await editTelegramMessage(
      chatId,
      query.message.message_id,
      `Выберите время на ${escapeHtml(formatDayLabel(new Date(times[0].start)))}. Часовой пояс — Москва.`,
      timesKeyboard(day, slots),
    );
    return;
  }

  const timeMatch = /^ctime:(.+)$/.exec(data);
  if (timeMatch) {
    await bookSelectedSlot(query, timeMatch[1]);
    return;
  }

  await answerCallback(query.id, "Не получилось обработать");
}

async function bookSelectedSlot(
  query: NonNullable<TelegramUpdate["callback_query"]>,
  slotStartRaw: string,
) {
  const chatId = query.message?.chat.id;
  if (chatId == null || !query.message) {
    await answerCallback(query.id, "Не получилось обработать");
    return;
  }

  const client = await getClient(String(chatId));
  if (!client) {
    await answerCallback(query.id, "Сначала укажите имя и телефон");
    await startOnboarding(String(chatId), query.from);
    return;
  }

  const result = await createBooking({
    name: client.name,
    phone: client.phone,
    telegram: client.username ? `@${client.username}` : "",
    slotStart: slotStartRaw,
    consent: true,
    telegramChatId: String(chatId),
  });

  if (!result.ok) {
    await answerCallback(query.id, result.error);
    if (result.status === 409) {
      await showDayPicker(chatId, 0, query.message.message_id);
    }
    return;
  }

  await answerCallback(query.id, "Заявка отправлена");
  await editTelegramMessage(chatId, query.message.message_id, "Слот выбран.");
  await sendTelegramMessage(
    chatId,
    `${clientBookingCard(result.booking, "Заявка принята")}\n\nЕлена подтвердит время. Напоминание придёт сюда за час до сессии.`,
    clientReplyKeyboard(),
  );
}

export function isClientCallback(data: string) {
  return /^(cconsent|cdays:\d+|cday:\d{4}-\d{2}-\d{2}|ctime:)/.test(data);
}
