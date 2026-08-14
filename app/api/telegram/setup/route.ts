import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { setTelegramWebhook, telegramWebhookSecret } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Не задан TELEGRAM_BOT_TOKEN" }, { status: 400 });
  }

  const secret = telegramWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Задайте TELEGRAM_WEBHOOK_SECRET или NEXTAUTH_SECRET" },
      { status: 400 },
    );
  }

  const webhookUrl = `${SITE.url.replace(/\/$/, "")}/api/telegram/webhook`;
  const result = await setTelegramWebhook(webhookUrl);
  if (!result) {
    return NextResponse.json({ error: "Telegram не принял webhook" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: webhookUrl, result });
}
