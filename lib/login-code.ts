import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/booking-form";
import { canSendEmail, sendLoginCodeEmail } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function secret() {
  return process.env.NEXTAUTH_SECRET || "dev-secret";
}

export function normalizeLoginEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function hashCode(email: string, code: string) {
  return createHmac("sha256", secret()).update(`${email}:${code}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function requestLoginCode(rawEmail: string) {
  const email = normalizeLoginEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false as const, error: "Проверьте адрес email", field: "email" as const };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.loginCode.count({
    where: { email, createdAt: { gte: hourAgo } },
  });
  if (recent >= MAX_CODES_PER_HOUR) {
    return { ok: false as const, error: "Слишком много попыток. Подождите немного." };
  }

  const last = await prisma.loginCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_WINDOW_MS) {
    return { ok: false as const, error: "Код уже отправлен. Проверьте почту или подождите минуту." };
  }

  const code = String(randomInt(100000, 1000000));
  await prisma.loginCode.create({
    data: {
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  const sent = await sendLoginCodeEmail(email, code);
  if (!sent.ok) {
    return { ok: false as const, error: sent.error };
  }

  return {
    ok: true as const,
    email,
    devCode: sent.dev || !canSendEmail() ? code : undefined,
  };
}

export async function verifyLoginCode(rawEmail: string, rawCode: string) {
  const email = normalizeLoginEmail(rawEmail);
  const code = rawCode.replace(/\D/g, "");
  if (!isValidEmail(email)) {
    return { ok: false as const, error: "Проверьте адрес email", field: "email" as const };
  }
  if (code.length !== 6) {
    return { ok: false as const, error: "Введите шестизначный код", field: "code" as const };
  }

  const row = await prisma.loginCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) {
    return { ok: false as const, error: "Код устарел. Запросите новый.", field: "code" as const };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "Слишком много попыток. Запросите новый код.", field: "code" as const };
  }

  const matches = safeEqual(row.codeHash, hashCode(email, code));
  if (!matches) {
    await prisma.loginCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, error: "Неверный код. Проверьте письмо.", field: "code" as const };
  }

  await prisma.loginCode.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  await prisma.loginCode.updateMany({
    where: { email, consumedAt: null, id: { not: row.id } },
    data: { consumedAt: new Date() },
  });

  return { ok: true as const, email };
}
