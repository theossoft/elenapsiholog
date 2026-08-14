import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "@/lib/moscow";
import { bookingCard, notifyTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.NEXTAUTH_SECRET;
  if (url.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const now = new Date();
  const until = addMinutes(now, 70);
  const from = addMinutes(now, 50);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      remindedAt: null,
      slotStart: { gte: from, lte: until },
    },
  });

  for (const booking of bookings) {
    await notifyTelegram(bookingCard(booking, "Напоминание: сессия через час"));
    await prisma.booking.update({
      where: { id: booking.id },
      data: { remindedAt: new Date() },
    });
  }

  return NextResponse.json({ reminded: bookings.length });
}
