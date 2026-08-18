import { NextResponse } from "next/server";
import { createBooking } from "@/lib/create-booking";
import { normalizePhone } from "@/lib/booking-form";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const result = await createBooking({
    name: String(body.name || ""),
    phone: normalizePhone(String(body.phone || "")),
    telegram: String(body.telegram || ""),
    email: String(body.email || ""),
    note: String(body.note || ""),
    slotStart: String(body.slotStart || ""),
    consent: Boolean(body.consent),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, field: result.field },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    id: result.booking.id,
    botUrl: result.botUrl,
    message: result.message,
  });
}
