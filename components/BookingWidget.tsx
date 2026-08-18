"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { trackGoal } from "@/lib/track";
import type { LandingCopy } from "@/lib/copy";
import { validateBookingFields, type BookingField } from "@/lib/booking-form";
import {
  compareMoscowMonth,
  formatMonthTitle,
  formatTime,
  moscowDateString,
  moscowMonthDays,
  moscowToUtc,
  pad,
  parseMoscowDate,
  shiftMoscowMonth,
} from "@/lib/moscow";

type Slot = { start: string; end: string };
type MonthView = { year: number; month: number };

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function monthFromDate(date: string): MonthView {
  const { year, month } = parseMoscowDate(date);
  return { year, month };
}

function monthTitle({ year, month }: MonthView) {
  const raw = formatMonthTitle(moscowToUtc(`${year}-${pad(month)}-01`, "12:00"));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatSummaryDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatNearestDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
  });
}

function formatTimesHeading(date: string) {
  const label = moscowToUtc(date, "12:00").toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
  });
  return `${label} — свободное время`;
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d={dir === "prev" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookingWidget({
  copy,
  price = SITE.defaultPrice,
  duration = SITE.sessionMin,
}: {
  copy: LandingCopy;
  price?: number;
  duration?: number;
}) {
  const { bookingLead, successTitle, successText, successMaxCta, successTelegramCta } = copy;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<MonthView>(() => monthFromDate(moscowDateString(new Date())));
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BookingField, string>>>({});
  const [done, setDone] = useState(false);
  const [botUrl, setBotUrl] = useState("");
  const [sending, setSending] = useState(false);

  const formattedPrice = new Intl.NumberFormat("ru-RU").format(price);

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
      ? "mt-1 w-full rounded-xl border border-terracotta bg-terracotta/5 px-3 py-2.5 outline-none ring-2 ring-terracotta/40"
      : "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-sage/40 focus:ring-2";
  }

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      const data = await res.json();
      const list = (data.slots || []) as Slot[];
      setSlots(list);
      if (list.length) {
        setView(monthFromDate(moscowDateString(new Date(list[0].start))));
      }
    } catch {
      setError("Не удалось загрузить расписание.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = moscowDateString(new Date(slot.start));
      const list = map.get(key) || [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots]);

  const availableDates = useMemo(() => new Set(days.keys()), [days]);
  const times = (day && days.get(day)) || [];
  const nearest = slots[0] ?? null;
  const monthCells = moscowMonthDays(view.year, view.month);
  const monthBounds = useMemo(() => {
    if (!slots.length) return { min: view, max: view };
    return {
      min: monthFromDate(moscowDateString(new Date(slots[0].start))),
      max: monthFromDate(moscowDateString(new Date(slots[slots.length - 1].start))),
    };
  }, [slots, view]);
  const canPrev = compareMoscowMonth(view, monthBounds.min) > 0;
  const canNext = compareMoscowMonth(view, monthBounds.max) < 0;
  const nearestSelected = Boolean(nearest && selected === nearest.start);

  function selectDay(nextDay: string) {
    setDay(nextDay);
    setSelected(null);
    clearFieldError("slot");
  }

  function selectSlot(start: string) {
    const key = moscowDateString(new Date(start));
    setDay(key);
    setSelected(start);
    setView(monthFromDate(key));
    clearFieldError("slot");
  }

  function scrollToDetails() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("booking-details")?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const nextErrors = validateBookingFields({
      name,
      phone,
      email,
      consent,
      slotStart: selected,
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.slot && !nextErrors.name && !nextErrors.phone && !nextErrors.email && !nextErrors.consent) {
        setError(nextErrors.slot);
      }
      if (nextErrors.slot) scrollToDetails();
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
          email,
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
      setBotUrl(typeof data.botUrl === "string" ? data.botUrl : "");
      trackGoal("booking_success");
      setSelected(null);
      setDay(null);
      setName("");
      setPhone("");
      setEmail("");
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

  const continueLabel = !day
    ? "Сначала выберите дату"
    : !selected
      ? "Сначала выберите время"
      : "К заявке";

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
              {botUrl ? (
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-goal="telegram_click"
                  className="inline-flex rounded-full bg-terracotta px-5 py-2.5 text-sm text-white"
                >
                  Открыть бота записи
                </a>
              ) : null}
              <a
                href={SITE.max}
                target="_blank"
                rel="noopener noreferrer"
                data-goal="max_click"
                className={`inline-flex rounded-full px-5 py-2.5 text-sm ${
                  botUrl ? "border border-sage text-sage-deep" : "bg-terracotta text-white"
                }`}
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
        ) : loading ? (
          <p className="mt-10 text-cream/70">Загружаю свободные слоты…</p>
        ) : days.size === 0 ? (
          <div className="mt-10 rounded-2xl border border-cream/15 p-6">
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
          <div className="mt-10 overflow-hidden rounded-3xl bg-cream text-ink shadow-[0_12px_40px_rgba(44,36,28,0.06)]">
            <div className="border-b border-line px-5 py-4 md:px-8 lg:hidden">
              <p className="rounded-2xl bg-cream-deep px-4 py-3 text-sm leading-relaxed text-ink">
                Выберите дату и время в календаре ниже — слоты указаны по московскому времени.
              </p>
            </div>

            <div className="grid min-w-0 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div className="min-w-0 p-5 md:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-sm font-medium text-cream">
                    1
                  </span>
                  <p className="text-sm tracking-[0.16em] text-sage-deep uppercase">Дата и время</p>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-serif text-xl capitalize">{monthTitle(view)}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!canPrev}
                        onClick={() => setView((prev) => shiftMoscowMonth(prev.year, prev.month, -1))}
                        aria-label="Предыдущий месяц"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Chevron dir="prev" />
                      </button>
                      <button
                        type="button"
                        disabled={!canNext}
                        onClick={() => setView((prev) => shiftMoscowMonth(prev.year, prev.month, 1))}
                        aria-label="Следующий месяц"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Chevron dir="next" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] tracking-[0.12em] text-ink-soft uppercase">
                    {WEEKDAYS.map((label) => (
                      <span key={label} className="py-1">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`grid grid-cols-7 gap-1 ${fieldErrors.slot ? "rounded-2xl ring-2 ring-terracotta/50 ring-offset-2" : ""}`}
                    role="grid"
                    aria-label="Календарь свободных дат"
                  >
                    {monthCells.map((date, index) => {
                      if (!date) return <span key={`empty-${index}`} />;
                      const available = availableDates.has(date);
                      const isSelected = day === date;
                      const dayNum = parseMoscowDate(date).day;
                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={!available}
                          onClick={() => selectDay(date)}
                          aria-pressed={isSelected}
                          aria-label={`${date}${available ? ", есть слоты" : ", нет слотов"}`}
                          className={`flex aspect-square min-h-10 items-center justify-center rounded-xl text-sm transition-colors ${
                            isSelected
                              ? "bg-sage font-medium text-cream"
                              : available
                                ? "border border-sage/70 text-ink hover:bg-sage/10"
                                : "cursor-default text-ink/30"
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] tracking-[0.14em] text-ink-soft uppercase">Часовой пояс</p>
                  <div
                    className="mt-1 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
                    aria-label="Часовой пояс слотов: Москва, GMT+3"
                  >
                    <span>Москва (GMT+3)</span>
                    <span className="text-ink-soft">фиксированный</span>
                  </div>
                </div>

                {day ? (
                  <div className="mt-6">
                    <p className="text-[11px] tracking-[0.14em] text-ink-soft uppercase">
                      {formatTimesHeading(day)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {times.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => selectSlot(slot.start)}
                          className={`rounded-full px-4 py-2 text-sm transition-colors ${
                            selected === slot.start
                              ? "bg-sage text-cream"
                              : "border border-line bg-white hover:border-sage hover:bg-sage/10"
                          }`}
                        >
                          {formatTime(new Date(slot.start))}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={!selected}
                  onClick={scrollToDetails}
                  className="mt-6 w-full rounded-full bg-cream-deep py-3 text-sm font-medium text-ink-soft transition-colors enabled:bg-sage enabled:text-cream enabled:hover:bg-sage-deep lg:hidden"
                >
                  {continueLabel}
                </button>

                {nearest ? (
                  <div className="mt-5 rounded-2xl border border-line px-4 py-4">
                    <p className="text-[11px] tracking-[0.14em] text-ink-soft uppercase">
                      Ближайшая свободная дата
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-serif text-xl">
                        {formatNearestDate(nearest.start)}, {formatTime(new Date(nearest.start))}
                      </p>
                      <button
                        type="button"
                        onClick={() => selectSlot(nearest.start)}
                        className={`rounded-full px-4 py-2 text-sm transition-colors ${
                          nearestSelected
                            ? "bg-sage text-cream"
                            : "border border-sage text-sage-deep hover:bg-sage hover:text-cream"
                        }`}
                      >
                        {nearestSelected ? "Выбрано" : "Выбрать это время"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <form
                id="booking-details"
                noValidate
                onSubmit={onSubmit}
                className="min-w-0 scroll-mt-24 border-t border-line p-5 md:p-8 lg:border-t-0 lg:border-l"
              >
                <p className="text-sm tracking-[0.16em] text-sage-deep uppercase">Ваша запись</p>
                <dl className="mt-4 divide-y divide-line text-sm">
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-ink-soft">Формат</dt>
                    <dd className="text-right font-medium">Онлайн-сессия · {duration} мин</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-ink-soft">Дата</dt>
                    <dd className={`text-right ${selected ? "font-medium" : "text-ink-soft"}`}>
                      {selected ? formatSummaryDate(selected) : "не выбрана"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-ink-soft">Время</dt>
                    <dd className={`text-right ${selected ? "font-medium" : "text-ink-soft"}`}>
                      {selected ? formatTime(new Date(selected)) : "не выбрано"}
                    </dd>
                  </div>
                </dl>
                {fieldErrors.slot ? (
                  <p className="mt-1 text-sm text-terracotta-deep">{fieldErrors.slot}</p>
                ) : null}

                <label className="mt-6 block text-sm">
                  Имя
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError("name");
                    }}
                    autoComplete="name"
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
                  Email <span className="text-ink-soft">(по желанию)</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "booking-email-error" : undefined}
                    className={fieldClass(Boolean(fieldErrors.email))}
                  />
                  {fieldErrors.email ? (
                    <p id="booking-email-error" className="mt-1 text-sm text-terracotta-deep">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </label>

                <label className="mt-4 block text-sm">
                  Telegram <span className="text-ink-soft">(по желанию)</span>
                  <input
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
                  />
                </label>

                <label className="mt-4 block text-sm">
                  Короткий запрос <span className="text-ink-soft">(по желанию)</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-sage/40 focus:ring-2"
                  />
                </label>

                <div className="mt-6 flex items-baseline justify-between gap-4">
                  <p className="text-sm text-ink-soft">Итого</p>
                  <p className="font-serif text-3xl text-sage-deep">{formattedPrice} ₽</p>
                </div>
                <p className="mt-1 text-right text-xs text-ink-soft">
                  Оплата — после подтверждения времени, не на сайте.
                </p>

                {error && !fieldErrors.name && !fieldErrors.phone && !fieldErrors.email && !fieldErrors.consent ? (
                  <p className="mt-3 text-sm text-terracotta-deep">{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-5 w-full rounded-full bg-terracotta py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-deep disabled:opacity-50"
                >
                  {sending ? "Отправляю…" : "Записаться →"}
                </button>

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
                    <Link href="/privacy" className="text-sage-deep underline">
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
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
