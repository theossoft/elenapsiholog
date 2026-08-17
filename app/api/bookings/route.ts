import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSlotFree } from "@/lib/slots";
import { addMinutes } from "@/lib/moscow";
import { notifyNewBooking } from "@/lib/telegram";
import { landingCopyFrom } from "@/lib/copy";
import { normalizePhone, validateBookingFields } from "@/lib/booking-form";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const phone = normalizePhone(String(body.phone || ""));
  const telegram = String(body.telegram || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().slice(0, 120);
  const note = String(body.note || "").trim().slice(0, 1000);
  const slotStartRaw = String(body.slotStart || "");
  const consent = Boolean(body.consent);

  const fieldErrors = validateBookingFields({
    name,
    phone: String(body.phone || ""),
    consent,
    slotStart: slotStartRaw,
  });
  const firstField = (["name", "phone", "consent", "slot"] as const).find((field) => fieldErrors[field]);
  if (firstField) {
    return NextResponse.json(
      { error: fieldErrors[firstField], field: firstField },
      { status: 400 },
    );
  }

  const slotStart = new Date(slotStartRaw);

  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  const duration = settings?.durationMin ?? 55;

  const free = await isSlotFree(slotStart);
  if (!free) {
    return NextResponse.json(
      { error: "Это время уже занято. Выберите другой слот." },
      { status: 409 },
    );
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        slotStart,
        slotEnd: addMinutes(slotStart, duration),
        name,
        phone,
        telegram,
        email,
        note,
        status: "pending",
        consentAt: new Date(),
      },
    });

    await notifyNewBooking(booking);

    return NextResponse.json({
      ok: true,
      id: booking.id,
      message: landingCopyFrom(settings).successText,
    });
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? error.code : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Это время уже занято. Выберите другой слот." },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Не удалось записаться. Попробуйте ещё раз." }, { status: 500 });
  }
}
