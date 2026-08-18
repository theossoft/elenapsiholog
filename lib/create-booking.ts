import { randomBytes } from "crypto";
import type { Booking } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSlotFree } from "@/lib/slots";
import { addMinutes } from "@/lib/moscow";
import { notifyNewBooking, telegramBotStartUrl } from "@/lib/telegram";
import { landingCopyFrom } from "@/lib/copy";
import {
  normalizePhone,
  validateBookingFields,
  type BookingField,
  type BookingMode,
} from "@/lib/booking-form";
import { upsertClientIdentity } from "@/lib/client-identity";

export type CreateBookingInput = {
  name?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  note?: string;
  slotStart: Date | string;
  consent: boolean;
  telegramChatId?: string;
  clientId?: string;
  mode?: BookingMode;
};

export type CreateBookingOk = {
  ok: true;
  booking: Booking;
  botUrl: string;
  message: string;
};

export type CreateBookingErr = {
  ok: false;
  error: string;
  field?: BookingField;
  status: number;
};

export type CreateBookingResult = CreateBookingOk | CreateBookingErr;

function newLinkToken() {
  return randomBytes(12).toString("base64url");
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const mode: BookingMode = input.mode || (input.telegramChatId ? "messenger" : "web");
  const name = String(input.name || "").trim();
  const phone = normalizePhone(String(input.phone || ""));
  const telegram = String(input.telegram || "").trim().slice(0, 80);
  const email = String(input.email || "").trim().toLowerCase().slice(0, 120);
  const note = String(input.note || "").trim().slice(0, 1000);
  const telegramChatId = String(input.telegramChatId || "").trim();
  const slotStartRaw = input.slotStart instanceof Date ? input.slotStart.toISOString() : String(input.slotStart || "");
  const consent = Boolean(input.consent);

  const fieldErrors = validateBookingFields({
    name,
    phone: String(input.phone || ""),
    email,
    consent,
    slotStart: slotStartRaw,
    mode,
  });
  const firstField = (["name", "phone", "email", "consent", "slot"] as const).find(
    (field) => fieldErrors[field],
  );
  if (firstField) {
    return { ok: false, error: fieldErrors[firstField] || "Проверьте форму", field: firstField, status: 400 };
  }

  const slotStart = new Date(slotStartRaw);
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  const duration = settings?.durationMin ?? 55;
  const amountRub = settings?.price ?? 4000;

  const loggedIn = input.clientId
    ? await prisma.client.findUnique({ where: { id: input.clientId } })
    : null;

  const free = await isSlotFree(slotStart);
  if (!free) {
    return { ok: false, error: "Это время уже занято. Выберите другой слот.", field: "slot", status: 409 };
  }

  const client = await upsertClientIdentity({
    email: email || loggedIn?.email,
    phone: phone || loggedIn?.phone,
    name: name || loggedIn?.name,
    telegram: telegram || loggedIn?.telegram,
    telegramChatId: telegramChatId || loggedIn?.telegramChatId,
    consentAt: new Date(),
  });

  try {
    const booking = await prisma.booking.create({
      data: {
        slotStart,
        slotEnd: addMinutes(slotStart, duration),
        name: name || client.name,
        phone: phone || client.phone,
        telegram: telegram || (client.telegram ? `@${client.telegram.replace(/^@/, "")}` : ""),
        telegramChatId: telegramChatId || client.telegramChatId,
        linkToken: newLinkToken(),
        email: email || client.email || "",
        note: note || client.note,
        status: "pending",
        amountRub,
        clientId: client.id,
        consentAt: new Date(),
      },
    });

    await notifyNewBooking(booking);
    const botUrl = booking.linkToken ? await telegramBotStartUrl(booking.linkToken) : await telegramBotStartUrl();

    return {
      ok: true,
      booking,
      botUrl,
      message: landingCopyFrom(settings).successText,
    };
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? error.code : "";
    if (code === "P2002") {
      return { ok: false, error: "Это время уже занято. Выберите другой слот.", field: "slot", status: 409 };
    }
    console.error(error);
    return { ok: false, error: "Не удалось записаться. Попробуйте ещё раз.", status: 500 };
  }
}
