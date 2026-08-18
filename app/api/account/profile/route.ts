import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isCompletePhone, isValidEmail, normalizePhone } from "@/lib/booking-form";
import { attachClientBookings, mergeClients } from "@/lib/client-identity";
import { CLIENT_COOKIE, readClientToken } from "@/lib/client-session";
import { isSameOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

async function currentClient() {
  const jar = await cookies();
  const clientId = readClientToken(jar.get(CLIENT_COOKIE)?.value || "");
  if (!clientId) return null;
  return prisma.client.findUnique({ where: { id: clientId } });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const client = await currentClient();
  if (!client) return NextResponse.json({ error: "Нужно войти" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const name = String(body.name || "").trim().slice(0, 80);
  const phoneRaw = String(body.phone || "");
  const phone = phoneRaw.trim() ? normalizePhone(phoneRaw) : "";
  const telegram = String(body.telegram || "").trim().replace(/^@/, "").slice(0, 80);
  const note = String(body.note || "").trim().slice(0, 1000);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 120);

  if (name && name.length < 2) {
    return NextResponse.json({ error: "Имя слишком короткое", field: "name" }, { status: 400 });
  }
  if (phone && !isCompletePhone(phone)) {
    return NextResponse.json(
      { error: "Неполный номер. Введите все 11 цифр, например +7 908 129-41-16", field: "phone" },
      { status: 400 },
    );
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Проверьте адрес email", field: "email" }, { status: 400 });
  }
  if (!email && !client.vkId) {
    return NextResponse.json({ error: "Укажите email — он нужен для входа и чеков", field: "email" }, { status: 400 });
  }

  if (email && email !== client.email) {
    const taken = await prisma.client.findUnique({ where: { email } });
    if (taken && taken.id !== client.id) {
      await mergeClients(client.id, taken.id);
    }
  }

  if (phone && phone !== client.phone) {
    const takenPhone = await prisma.client.findFirst({
      where: { phone, id: { not: client.id } },
    });
    if (takenPhone) await mergeClients(client.id, takenPhone.id);
  }

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      name,
      phone,
      telegram,
      note,
      email: email || client.email,
    },
  });

  await attachClientBookings(updated.id);

  await prisma.booking.updateMany({
    where: { clientId: updated.id },
    data: {
      name: updated.name,
      phone: updated.phone,
      telegram: updated.telegram ? `@${updated.telegram.replace(/^@/, "")}` : "",
      email: updated.email || "",
    },
  });

  return NextResponse.json({ ok: true });
}
