"use client";

import { FormEvent, useEffect, useState } from "react";
import { WEEKDAYS } from "@/lib/content";

type Rule = { id?: string; weekday: number; startTime: string; endTime: string };
type Exception = { id: string; date: string; kind: string; time: string | null };

const KIND: Record<string, string> = {
  day_off: "Выходной",
  extra: "Доп. слот",
  block: "Закрыть час",
};

export function ScheduleEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState("day_off");
  const [time, setTime] = useState("10:00");

  async function load() {
    const res = await fetch("/api/admin/schedule", { cache: "no-store" });
    const data = await res.json();
    setRules(data.rules || []);
    setExceptions(data.exceptions || []);
  }

  useEffect(() => {
    load();
  }, []);

  function addRange(weekday: number) {
    setRules((prev) => [...prev, { weekday, startTime: "10:00", endTime: "19:00" }]);
  }

  function updateRule(index: number, patch: Partial<Rule>) {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveRules() {
    setMessage("");
    const res = await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    setMessage(res.ok ? "Расписание недели сохранено." : "Не удалось сохранить.");
  }

  async function addException(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, kind, time: kind === "day_off" ? null : time }),
    });
    if (res.ok) {
      setDate("");
      await load();
    }
  }

  async function removeException(id: string) {
    await fetch(`/api/admin/schedule?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-10">
      <section>
        <h2 className="font-serif text-2xl">Шаблон недели</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Интервалы, из которых собираются слоты. Длительность сессии задаётся в настройках.
        </p>
        <div className="mt-6 grid gap-4">
          {WEEKDAYS.map((day) => {
            const dayRules = rules
              .map((rule, index) => ({ rule, index }))
              .filter(({ rule }) => rule.weekday === day.id);
            return (
              <div key={day.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{day.label}</p>
                  <button type="button" onClick={() => addRange(day.id)} className="text-sm text-sage-deep">
                    Добавить интервал
                  </button>
                </div>
                {dayRules.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-soft">Выходной</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {dayRules.map(({ rule, index }) => (
                      <div key={index} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={rule.startTime}
                          onChange={(e) => updateRule(index, { startTime: e.target.value })}
                          className="rounded-lg border border-line px-2 py-1"
                        />
                        <span>—</span>
                        <input
                          type="time"
                          value={rule.endTime}
                          onChange={(e) => updateRule(index, { endTime: e.target.value })}
                          className="rounded-lg border border-line px-2 py-1"
                        />
                        <button type="button" onClick={() => removeRule(index)} className="text-sm text-ink-soft">
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={saveRules}
          className="mt-4 rounded-full bg-sage px-5 py-2 text-sm text-white"
        >
          Сохранить неделю
        </button>
        {message ? <p className="mt-2 text-sm text-ink-soft">{message}</p> : null}
      </section>

      <section>
        <h2 className="font-serif text-2xl">Исключения</h2>
        <form onSubmit={addException} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Дата
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block rounded-lg border border-line px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Тип
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="mt-1 block rounded-lg border border-line px-2 py-1"
            >
              <option value="day_off">Выходной день</option>
              <option value="extra">Дополнительный слот</option>
              <option value="block">Закрыть час</option>
            </select>
          </label>
          {kind !== "day_off" ? (
            <label className="text-sm">
              Время
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 block rounded-lg border border-line px-2 py-1"
              />
            </label>
          ) : null}
          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-cream">
            Добавить
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {exceptions.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-xl bg-cream-deep px-3 py-2">
              <span>
                {item.date} · {KIND[item.kind]} {item.time || ""}
              </span>
              <button type="button" onClick={() => removeException(item.id)}>
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
