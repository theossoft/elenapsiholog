import { NextResponse } from "next/server";
import { processTelegramUpdate } from "@/lib/telegram-bot";
import { telegramWebhookSecret, type TelegramUpdate } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = telegramWebhookSecret();
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (update) {
    try {
      await processTelegramUpdate(update);
    } catch (error) {
      console.error("[telegram webhook]", error);
    }
  }

  return NextResponse.json({ ok: true });
}
