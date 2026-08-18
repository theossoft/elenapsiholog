export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return;

  setTimeout(() => {
    void fetch(`http://127.0.0.1:3000/api/telegram/setup?secret=${encodeURIComponent(secret)}`).catch((error) => {
      console.error("[telegram webhook setup]", error);
    });
  }, 1500);
}
