import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSlot } from "@/lib/moscow";
import { notifyTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    orderBy: { slotStart: "asc" },
  });
  return NextResponse.json({ bookings });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Нет id" }, { status: 400 });

  const status = String(body.status || "");
  const allowed = ["pending", "confirmed", "cancelled", "completed"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
  }

  const incomingLink = typeof body.meetLink === "string" ? body.meetLink.trim() : "";
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });

  const current = await prisma.booking.findUnique({ where: { id: String(body.id) } });
  if (!current) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

  const meetLink =
    incomingLink || current.meetLink || settings?.meetLink || "";

  const booking = await prisma.booking.update({
    where: { id: current.id },
    data: {
      status,
      meetLink,
    },
  });

  if (status === "confirmed") {
    await notifyTelegram(
      [
        "<b>Запись подтверждена</b>",
        formatSlot(booking.slotStart),
        `${booking.name}, ${booking.phone}`,
        booking.meetLink ? `Ссылка: ${booking.meetLink}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (status === "cancelled") {
    await notifyTelegram(
      [
        "<b>Запись отменена</b>",
        formatSlot(booking.slotStart),
        `${booking.name}, ${booking.phone}`,
      ].join("\n"),
    );
  }

  return NextResponse.json({ booking });
}
