import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createBooking } from "@/lib/create-booking";
import { normalizePhone } from "@/lib/booking-form";
import { CLIENT_COOKIE, readClientToken } from "@/lib/client-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const jar = await cookies();
  const clientId = readClientToken(jar.get(CLIENT_COOKIE)?.value || "") || undefined;

  const result = await createBooking({
    name: String(body.name || ""),
    phone: normalizePhone(String(body.phone || "")),
    telegram: String(body.telegram || ""),
    email: String(body.email || ""),
    note: String(body.note || ""),
    slotStart: String(body.slotStart || ""),
    consent: Boolean(body.consent),
    clientId,
    mode: "web",
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
