import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUSES, setBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { notifyClientStatus } from "@/lib/telegram-client";
import { bookingCard, confirmedKeyboard, notifyTelegram } from "@/lib/telegram";

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

  if (typeof body.paid === "boolean") {
    const current = await prisma.booking.findUnique({ where: { id: String(body.id) } });
    if (!current) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    const booking = await prisma.booking.update({
      where: { id: current.id },
      data: { paidAt: body.paid ? new Date() : null },
    });
    return NextResponse.json({ booking });
  }

  const status = String(body.status || "") as BookingStatus;
  if (!BOOKING_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
  }

  const incomingLink = typeof body.meetLink === "string" ? body.meetLink.trim() : "";
  const result = await setBookingStatus(String(body.id), status, incomingLink);
  if ("error" in result) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  const { booking } = result;

  if (status === "confirmed") {
    await notifyTelegram(bookingCard(booking, "Запись подтверждена"), {
      replyMarkup: confirmedKeyboard(booking.id),
    });
    await notifyClientStatus(booking);
  }

  if (status === "cancelled") {
    await notifyTelegram(bookingCard(booking, "Запись отменена"));
    await notifyClientStatus(booking);
  }

  return NextResponse.json({ booking });
}
