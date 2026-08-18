import { prisma } from "@/lib/prisma";
import { isCompletePhone, isValidEmail, normalizePhone } from "@/lib/booking-form";
import type { Prisma } from "@prisma/client";

export type ClientIdentity = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  telegram?: string | null;
  telegramChatId?: string | null;
  maxUserId?: string | null;
  vkId?: string | null;
  note?: string | null;
  emailVerifiedAt?: Date | null;
  consentAt?: Date | null;
};

function cleanEmail(raw?: string | null) {
  const email = (raw || "").trim().toLowerCase();
  return isValidEmail(email) ? email : "";
}

function cleanPhone(raw?: string | null) {
  const phone = normalizePhone(raw || "");
  return isCompletePhone(phone) ? phone : "";
}

function fillIfEmpty(current: string, next?: string | null) {
  const value = (next || "").trim();
  return current || value;
}

function identityWhere(input: {
  email: string;
  phone: string;
  telegramChatId: string;
  maxUserId: string;
  vkId: string | null;
}): Prisma.ClientWhereInput | null {
  const or: Prisma.ClientWhereInput[] = [];
  if (input.email) or.push({ email: input.email });
  if (input.vkId) or.push({ vkId: input.vkId });
  if (input.phone) or.push({ phone: input.phone });
  if (input.telegramChatId) or.push({ telegramChatId: input.telegramChatId });
  if (input.maxUserId) or.push({ maxUserId: input.maxUserId });
  if (!or.length) return null;
  return { OR: or };
}

export async function mergeClients(primaryId: string, secondaryId: string) {
  if (primaryId === secondaryId) {
    return prisma.client.findUniqueOrThrow({ where: { id: primaryId } });
  }

  const [primary, secondary] = await Promise.all([
    prisma.client.findUnique({ where: { id: primaryId } }),
    prisma.client.findUnique({ where: { id: secondaryId } }),
  ]);
  if (!primary) throw new Error("primary client missing");
  if (!secondary) return primary;

  await prisma.booking.updateMany({
    where: { clientId: secondary.id },
    data: { clientId: primary.id },
  });

  const merged = await prisma.client.update({
    where: { id: primary.id },
    data: {
      email: primary.email || secondary.email,
      phone: fillIfEmpty(primary.phone, secondary.phone),
      name: fillIfEmpty(primary.name, secondary.name),
      telegram: fillIfEmpty(primary.telegram, secondary.telegram),
      telegramChatId: fillIfEmpty(primary.telegramChatId, secondary.telegramChatId),
      maxUserId: fillIfEmpty(primary.maxUserId, secondary.maxUserId),
      vkId: primary.vkId || secondary.vkId,
      note: fillIfEmpty(primary.note, secondary.note),
      emailVerifiedAt: primary.emailVerifiedAt || secondary.emailVerifiedAt,
      consentAt: primary.consentAt || secondary.consentAt,
    },
  });

  await prisma.client.delete({ where: { id: secondary.id } }).catch(() => undefined);
  return merged;
}

export async function attachClientBookings(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return;

  const or: Prisma.BookingWhereInput[] = [];
  if (client.email) or.push({ email: client.email });
  if (cleanPhone(client.phone)) or.push({ phone: client.phone });
  if (client.telegramChatId) or.push({ telegramChatId: client.telegramChatId });
  if (!or.length) return;

  await prisma.booking.updateMany({
    where: { clientId: null, OR: or },
    data: { clientId: client.id },
  });
}

export async function upsertClientIdentity(input: ClientIdentity) {
  const email = cleanEmail(input.email);
  const phone = cleanPhone(input.phone);
  const telegramChatId = (input.telegramChatId || "").trim();
  const maxUserId = (input.maxUserId || "").trim();
  const vkId = (input.vkId || "").trim() || null;
  const name = (input.name || "").trim().slice(0, 80);
  const telegram = (input.telegram || "").trim().replace(/^@/, "").slice(0, 80);
  const note = (input.note || "").trim().slice(0, 1000);
  const where = identityWhere({ email, phone, telegramChatId, maxUserId, vkId });

  const matches = where
    ? await prisma.client.findMany({ where, orderBy: { createdAt: "asc" } })
    : [];

  let client = matches[0];
  if (!client) {
    client = await prisma.client.create({
      data: {
        email: email || null,
        phone,
        name,
        telegram,
        telegramChatId,
        maxUserId,
        vkId,
        note,
        emailVerifiedAt: input.emailVerifiedAt || null,
        consentAt: input.consentAt || new Date(),
      },
    });
  } else {
    for (const extra of matches.slice(1)) {
      client = await mergeClients(client.id, extra.id);
    }
    client = await prisma.client.update({
      where: { id: client.id },
      data: {
        email: client.email || email || null,
        phone: fillIfEmpty(client.phone, phone),
        name: fillIfEmpty(client.name, name),
        telegram: fillIfEmpty(client.telegram, telegram),
        telegramChatId: fillIfEmpty(client.telegramChatId, telegramChatId),
        maxUserId: fillIfEmpty(client.maxUserId, maxUserId),
        vkId: client.vkId || vkId,
        note: fillIfEmpty(client.note, note),
        emailVerifiedAt: client.emailVerifiedAt || input.emailVerifiedAt || null,
        consentAt: client.consentAt || input.consentAt || null,
      },
    });
  }

  await attachClientBookings(client.id);
  return client;
}
