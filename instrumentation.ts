export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  try {
    const { startTelegramPolling } = await import("./lib/telegram-poll");
    await startTelegramPolling();
  } catch (error) {
    console.error("[telegram poll setup]", error);
  }
}
