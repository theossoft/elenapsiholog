"use client";

import { useEffect, useState } from "react";
import { formatSlot } from "@/lib/moscow";

type Booking = {
  id: string;
  slotStart: string;
  name: string;
  phone: string;
  telegram: string;
  note: string;
  status: string;
  meetLink: string;
};

const LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
};

export function BookingsBoard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meetLink, setMeetLink] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/bookings", { cache: "no-store" });
    const data = await res.json();
    setBookings(data.bookings || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, status: string) {
    setError("");
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, meetLink }),
    });
    if (!res.ok) {
      setError("Не удалось обновить заявку");
      return;
    }
    await load();
  }

  return (
    <div>
      <label className="mb-6 block max-w-xl text-sm">
        Ссылка на видеовстречу (подставится при подтверждении)
        <input
          value={meetLink}
          onChange={(e) => setMeetLink(e.target.value)}
          placeholder="https://t.me/..."
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
        />
      </label>
      {error ? <p className="mb-3 text-sm text-terracotta-deep">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream-deep">
            <tr>
              <th className="px-4 py-3">Время</th>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-ink-soft" colSpan={4}>
                  Заявок пока нет. Откройте слоты в разделе «Расписание».
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">{formatSlot(new Date(b.slotStart))}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.name}</p>
                    <p>{b.phone}</p>
                    {b.telegram ? <p className="text-ink-soft">{b.telegram}</p> : null}
                    {b.note ? <p className="mt-1 text-ink-soft">{b.note}</p> : null}
                  </td>
                  <td className="px-4 py-3">{LABELS[b.status] || b.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {b.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => update(b.id, "confirmed")}
                          className="rounded-full bg-sage px-3 py-1 text-white"
                        >
                          Подтвердить
                        </button>
                      ) : null}
                      {b.status === "confirmed" ? (
                        <button
                          type="button"
                          onClick={() => update(b.id, "completed")}
                          className="rounded-full border border-line px-3 py-1"
                        >
                          Завершить
                        </button>
                      ) : null}
                      {b.status === "pending" || b.status === "confirmed" ? (
                        <button
                          type="button"
                          onClick={() => update(b.id, "cancelled")}
                          className="rounded-full border border-line px-3 py-1"
                        >
                          Отменить
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
