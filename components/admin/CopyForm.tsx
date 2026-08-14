"use client";

import { FormEvent, useEffect, useState } from "react";
import { DEFAULT_COPY, type LandingCopy } from "@/lib/copy";

const GROUPS: { title: string; hint: string; fields: { key: keyof LandingCopy; label: string; rows: number }[] }[] = [
  {
    title: "Главный экран",
    hint: "Это первое, что видит человек. Заголовок — про потребность, без обещания «вылечить». Цифры внизу — только факты.",
    fields: [
      { key: "heroEyebrow", label: "Строка над заголовком", rows: 1 },
      { key: "heroHeadline", label: "Главный заголовок", rows: 3 },
      { key: "heroLead", label: "Короткий абзац под заголовком", rows: 4 },
      { key: "heroStat1Value", label: "Цифра 1 (например, 13 лет)", rows: 1 },
      { key: "heroStat1Label", label: "Подпись 1 (например, практики)", rows: 1 },
      { key: "heroStat2Value", label: "Цифра 2 (например, 800+)", rows: 1 },
      { key: "heroStat2Label", label: "Подпись 2 (например, сессий на Alter)", rows: 1 },
      { key: "heroStat3Value", label: "Цифра 3 (например, 55 мин)", rows: 1 },
      { key: "heroStat3Label", label: "Подпись 3 (например, онлайн-встреча)", rows: 1 },
    ],
  },
  {
    title: "С чем приходят",
    hint: "Заголовок блока и текст про подростков. Карточки тем пока в коде.",
    fields: [
      { key: "topicsTitle", label: "Заголовок блока", rows: 2 },
      { key: "teensLead", label: "Текст про подростков", rows: 4 },
    ],
  },
  {
    title: "Как это устроено",
    hint: "Заголовок сессии. Шаги 1–4 пока в коде.",
    fields: [{ key: "howTitle", label: "Заголовок блока", rows: 2 }],
  },
  {
    title: "Обо мне",
    hint: "Имя и два абзаца. Образование и методы пока в коде.",
    fields: [
      { key: "aboutTitle", label: "Заголовок", rows: 2 },
      { key: "aboutP1", label: "Первый абзац", rows: 5 },
      { key: "aboutP2", label: "Второй абзац", rows: 4 },
    ],
  },
  {
    title: "Стоимость и запись",
    hint: "Цена меняется в «Настройках». Здесь только поясняющий текст.",
    fields: [
      { key: "priceLead", label: "Текст про оплату", rows: 4 },
      { key: "bookingLead", label: "Текст над календарём записи", rows: 4 },
    ],
  },
];

export function CopyForm() {
  const [copy, setCopy] = useState<LandingCopy | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const next = { ...DEFAULT_COPY };
        const source = data.settings || {};
        for (const key of Object.keys(DEFAULT_COPY) as (keyof LandingCopy)[]) {
          if (typeof source[key] === "string" && source[key].trim()) {
            next[key] = source[key];
          }
        }
        setCopy(next);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!copy) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy),
    });
    setSaving(false);
    setMessage(res.ok ? "Сохранено. Обновите главную страницу, чтобы увидеть текст." : "Не удалось сохранить.");
  }

  if (!copy) return <p>Загружаю…</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-10">
      {GROUPS.map((group) => (
        <section key={group.title} className="rounded-2xl border border-line bg-cream p-6 shadow-[0_12px_40px_rgba(44,36,28,0.06)]">
          <h2 className="font-serif text-2xl">{group.title}</h2>
          <p className="mt-1 mb-5 text-sm text-ink-soft">{group.hint}</p>
          <div className="space-y-4">
            {group.fields.map((field) => (
              <label key={field.key} className="block text-sm">
                {field.label}
                {field.rows === 1 ? (
                  <input
                    value={copy[field.key]}
                    onChange={(e) => setCopy({ ...copy, [field.key]: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2"
                  />
                ) : (
                  <textarea
                    value={copy[field.key]}
                    onChange={(e) => setCopy({ ...copy, [field.key]: e.target.value })}
                    rows={field.rows}
                    className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 leading-relaxed"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-sage px-5 py-2.5 text-sm text-white transition-colors hover:bg-sage-deep disabled:opacity-60"
      >
        {saving ? "Сохраняю…" : "Сохранить тексты"}
      </button>
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
    </form>
  );
}
