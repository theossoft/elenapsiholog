export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  try {
    const { setTelegramWebhook, telegramWebhookUrl } = await import("./lib/telegram");
    await setTelegramWebhook(telegramWebhookUrl());
  } catch (error) {
    console.error("[telegram webhook setup]", error);
  }
}
