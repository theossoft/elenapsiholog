"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountView } from "@/lib/client-account";

export function ProfileForm({
  client,
  vkEnabled = false,
}: {
  client: AccountView["client"];
  vkEnabled?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email);
  const [telegram, setTelegram] = useState(client.telegram.replace(/^@/, ""));
  const [note, setNote] = useState(client.note);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, telegram, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl rounded-2xl border border-line bg-white p-6">
      <label className="block text-sm">
        Имя
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
        />
      </label>
      <label className="mt-4 block text-sm">
        Телефон
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7"
          className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
        />
        <span className="mt-1 block text-xs text-ink-soft">
          Нужен, чтобы боты MAX и Telegram узнали вас.
        </span>
      </label>
      <label className="mt-4 block text-sm">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
        />
      </label>
      <label className="mt-4 block text-sm">
        Telegram <span className="text-ink-soft">(по желанию)</span>
        <input
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          placeholder="username"
          className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
        />
      </label>
      <label className="mt-4 block text-sm">
        Короткий запрос <span className="text-ink-soft">(по желанию)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
        />
      </label>
      {client.vkLinked ? (
        <p className="mt-4 text-sm text-ink-soft">VK ID привязан — можно входить через него.</p>
      ) : vkEnabled ? (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/vk/start";
          }}
          className="mt-4 text-sm text-sage-deep underline"
        >
          Привязать VK ID
        </button>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          Вход через VK ID появится здесь, когда приложение VK будет подключено.
        </p>
      )}
      {error ? <p className="mt-3 text-sm text-terracotta-deep">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-sage-deep">Сохранено.</p> : null}
      <button
        type="submit"
        disabled={sending}
        className="mt-5 rounded-full bg-sage px-5 py-2.5 text-sm text-cream transition-colors hover:bg-sage-deep disabled:opacity-50"
      >
        {sending ? "Сохраняю…" : "Сохранить"}
      </button>
    </form>
  );
}
