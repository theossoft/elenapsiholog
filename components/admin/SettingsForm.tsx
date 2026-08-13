"use client";

import { FormEvent, useEffect, useState } from "react";

type Settings = {
  price: number;
  durationMin: number;
  slotStepMin: number;
  meetLink: string;
  successText: string;
  pendingHoldHours: number;
  horizonDays: number;
};

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage(res.ok ? "Сохранено." : "Не удалось сохранить.");
  }

  if (!settings) return <p>Загружаю…</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <label className="block text-sm">
        Цена, ₽
        <input
          type="number"
          value={settings.price}
          onChange={(e) => setSettings({ ...settings, price: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Длительность сессии, мин
        <input
          type="number"
          value={settings.durationMin}
          onChange={(e) => setSettings({ ...settings, durationMin: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Шаг слотов, мин
        <input
          type="number"
          value={settings.slotStepMin}
          onChange={(e) => setSettings({ ...settings, slotStepMin: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Ссылка на видеовстречу по умолчанию
        <input
          value={settings.meetLink}
          onChange={(e) => setSettings({ ...settings, meetLink: e.target.value })}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Текст после записи
        <textarea
          value={settings.successText}
          onChange={(e) => setSettings({ ...settings, successText: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Сколько часов держать неподтверждённый слот
        <input
          type="number"
          value={settings.pendingHoldHours}
          onChange={(e) => setSettings({ ...settings, pendingHoldHours: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        На сколько дней вперёд показывать слоты
        <input
          type="number"
          value={settings.horizonDays}
          onChange={(e) => setSettings({ ...settings, horizonDays: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <button type="submit" className="rounded-full bg-sage px-5 py-2 text-sm text-white">
        Сохранить
      </button>
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
    </form>
  );
}
