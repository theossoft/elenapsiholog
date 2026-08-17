"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { trackGoal } from "@/lib/track";
import type { LandingCopy } from "@/lib/copy";
import { validateBookingFields, type BookingField } from "@/lib/booking-form";

type Slot = { start: string; end: string };

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingWidget({ copy }: { copy: LandingCopy }) {
  const { bookingLead, successTitle, successText, successMaxCta, successTelegramCta } = copy;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BookingField, string>>>({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  function clearFieldError(field: BookingField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function fieldClass(hasError: boolean) {
    return hasError
      ? "mt-1 w-full rounded-xl border border-terracotta bg-terracotta/5 px-3 py-2 outline-none ring-2 ring-terracotta/40"
      : "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none ring-sage/40 focus:ring-2";
  }

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      const data = await res.json();
      const list = (data.slots || []) as Slot[];
      setSlots(list);
      if (list.length && !day) setDay(dayKey(list[0].start));
    } catch {
      setError("Не удалось загрузить расписание.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = dayKey(slot.start);
      const list = map.get(key) || [];
      list.push(slot);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [slots]);

  const times = days.find(([key]) => key === day)?.[1] || [];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const nextErrors = validateBookingFields({
      name,
      phone,
      consent,
      slotStart: selected,
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.slot && !nextErrors.name && !nextErrors.phone && !nextErrors.consent) {
        setError(nextErrors.slot);
      }
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStart: selected,
          name,
          phone,
          telegram,
          note,
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const field = data.field as BookingField | undefined;
        if (field) setFieldErrors({ [field]: data.error });
        setError(data.error || "Не получилось записаться.");
        if (res.status === 409) await loadSlots();
        return;
      }
      setDone(true);
      trackGoal("booking_success");
      setSelected(null);
      setName("");
      setPhone("");
      setTelegram("");
      setNote("");
      setConsent(false);
      setFieldErrors({});
      await loadSlots();
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз или напишите в MAX или Telegram.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="zapis" className="bg-ink px-5 py-16 text-cream md:px-8 md:py-24">
      <div className="mx-auto min-w-0 max-w-6xl">
        <p className="text-sm tracking-[0.18em] text-sage uppercase">Запись</p>
        <h2 className="font-serif mt-3 text-3xl md:text-4xl">Выберите удобное время</h2>
        <p className="mt-3 max-w-xl text-cream/75">{bookingLead}</p>

        {done ? (
          <div className="mt-8 max-w-xl rounded-2xl bg-cream p-6 text-ink">
            <p className="font-serif text-2xl">{successTitle}</p>
            <p className="mt-2 text-ink-soft">{successText}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={SITE.max}
                target="_blank"
                rel="noopener noreferrer"
                data-goal="max_click"
                className="inline-flex rounded-full bg-terracotta px-5 py-2.5 text-sm text-white"
              >
                {successMaxCta}
              </a>
              <a
                href={SITE.telegram}
                target="_blank"
                rel="noopener noreferrer"
                data-goal="telegram_click"
                className="inline-flex rounded-full border border-sage px-5 py-2.5 text-sm text-sage-deep"
              >
                {successTelegramCta}
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0">
              {loading ? (
                <p className="text-cream/70">Загружаю свободные слоты…</p>
              ) : days.length === 0 ? (
                <div className="rounded-2xl border border-cream/15 p-6">
                  <p>Свободных слотов пока нет — напишите в MAX или Telegram, подберём время.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={SITE.max}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-goal="max_click"
                      className="inline-flex rounded-full bg-terracotta px-5 py-2.5 text-sm text-white"
                    >
                      Написать в MAX
                    </a>
                    <a
                      href={SITE.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-goal="telegram_click"
                      className="inline-flex rounded-full border border-sage px-5 py-2.5 text-sm text-cream"
                    >
                      Написать в Telegram
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
                    {days.map(([key, list]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setDay(key);
                          setSelected(null);
                        }}
                        className={`min-w-[7.5rem] shrink-0 rounded-2xl px-3 py-3 text-left text-sm transition-colors ${
                          day === key
                            ? "bg-cream text-ink"
                            : "bg-cream/10 text-cream hover:bg-cream/20"
                        }`}
                      >
                        <span className="block capitalize">{dayLabel(list[0].start)}</span>
                        <span className="text-xs opacity-70">{list.length} слотов</span>
                      </button>
                    ))}
                  </div>
                  <div
                    className={`mt-5 flex flex-wrap gap-2 rounded-2xl ${
                      fieldErrors.slot ? "ring-2 ring-terracotta/50 ring-offset-2 ring-offset-ink p-2" : ""
                    }`}
                  >
                    {times.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => {
                          setSelected(slot.start);
                          clearFieldError("slot");
                        }}
                        className={`rounded-full px-4 py-2 text-sm transition-colors ${
                          selected === slot.start
                            ? "bg-terracotta text-white"
                            : "bg-cream/10 hover:bg-cream/20"
                        }`}
                      >
                        {timeLabel(slot.start)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <form
              noValidate
              onSubmit={onSubmit}
              className="min-w-0 w-full max-w-full rounded-3xl bg-cream p-6 text-ink md:p-8"
            >
              <p className="font-serif text-2xl">Заявка</p>
              <p className={`mt-1 text-sm ${fieldErrors.slot ? "text-terracotta-deep" : "text-ink-soft"}`}>
                {selected
                  ? `Время: ${dayLabel(selected)}, ${timeLabel(selected)}`
                  : fieldErrors.slot || "Сначала выберите слот слева"}
              </p>
              <label className="mt-5 block text-sm">
                Имя
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "booking-name-error" : undefined}
                  className={fieldClass(Boolean(fieldErrors.name))}
                />
                {fieldErrors.name ? (
                  <p id="booking-name-error" className="mt-1 text-sm text-terracotta-deep">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </label>
              <label className="mt-4 block text-sm">
                Телефон
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError("phone");
                  }}
                  placeholder="+7"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "booking-phone-error" : undefined}
                  className={fieldClass(Boolean(fieldErrors.phone))}
                />
                {fieldErrors.phone ? (
                  <p id="booking-phone-error" className="mt-1 text-sm text-terracotta-deep">
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </label>
              <label className="mt-4 block text-sm">
                Telegram <span className="text-ink-soft">(по желанию)</span>
                <input
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none ring-sage/40 focus:ring-2"
                />
              </label>
              <label className="mt-4 block text-sm">
                Короткий запрос <span className="text-ink-soft">(по желанию)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none ring-sage/40 focus:ring-2"
                />
              </label>
              <label
                className={`mt-4 flex items-start gap-2 rounded-xl text-sm ${
                  fieldErrors.consent
                    ? "border border-terracotta bg-terracotta/5 p-3 text-terracotta-deep"
                    : "text-ink-soft"
                }`}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    clearFieldError("consent");
                  }}
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "booking-consent-error" : undefined}
                  className="mt-1"
                />
                <span>
                  Соглашаюсь на обработку персональных данных согласно{" "}
                  <Link href="/privacy" className="underline">
                    политике
                  </Link>
                  .
                  {fieldErrors.consent ? (
                    <span id="booking-consent-error" className="mt-1 block">
                      {fieldErrors.consent}
                    </span>
                  ) : null}
                </span>
              </label>
              {error && !fieldErrors.name && !fieldErrors.phone && !fieldErrors.consent ? (
                <p className="mt-3 text-sm text-terracotta-deep">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={sending}
                className="mt-5 w-full rounded-full bg-terracotta py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-deep disabled:opacity-50"
              >
                {sending ? "Отправляю…" : "Оставить заявку"}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
