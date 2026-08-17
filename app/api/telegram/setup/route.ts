import { NextResponse } from "next/server";
import { startTelegramPolling } from "@/lib/telegram-poll";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Не задан TELEGRAM_BOT_TOKEN" }, { status: 400 });
  }

  await startTelegramPolling();
  return NextResponse.json({ ok: true, mode: "polling" });
}
