import { deleteTelegramWebhook, getTelegramUpdates } from "./telegram";
import { processTelegramUpdate } from "./telegram-bot";

type PollState = { started: boolean; offset: number };

const state = globalThis as typeof globalThis & { __telegramPoll?: PollState };

function pollState() {
  if (!state.__telegramPoll) state.__telegramPoll = { started: false, offset: 0 };
  return state.__telegramPoll;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startTelegramPolling() {
  const current = pollState();
  if (current.started) return;
  current.started = true;
  void loop();
}

async function loop() {
  const current = pollState();
  let webhookCleared = false;

  while (current.started) {
    if (!webhookCleared) {
      const deleted = await deleteTelegramWebhook();
      webhookCleared = Boolean(deleted);
      if (!webhookCleared) {
        console.error("[telegram] still deleting webhook");
        await sleep(3000);
        continue;
      }
      console.info("[telegram] polling started");
    }

    try {
      const updates = await getTelegramUpdates(current.offset);
      if (updates == null) {
        webhookCleared = false;
        await sleep(2000);
        continue;
      }
      for (const update of updates) {
        current.offset = update.update_id + 1;
        try {
          await processTelegramUpdate(update);
        } catch (error) {
          console.error("[telegram] update", error);
        }
      }
    } catch (error) {
      console.error("[telegram] getUpdates", error);
      webhookCleared = false;
      await sleep(2000);
    }
  }
}
