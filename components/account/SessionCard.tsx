import type { AccountBooking } from "@/lib/client-account";
import { formatSlot, formatTime } from "@/lib/moscow";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

export function SessionCard({
  booking,
  showLink = true,
}: {
  booking: AccountBooking;
  showLink?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(44,36,28,0.04)]">
      <p className="text-sm text-ink-soft">{booking.statusLabel}</p>
      <p className="font-serif mt-1 text-xl">{formatSlot(new Date(booking.slotStart))}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {formatTime(new Date(booking.slotStart))} · МСК
        {booking.amountRub ? ` · ${formatMoney(booking.amountRub)} ₽` : ""}
      </p>
      {booking.paid ? (
        <p className="mt-2 text-sm text-sage-deep">Оплата отмечена</p>
      ) : booking.status === "confirmed" || booking.status === "completed" ? (
        <p className="mt-2 text-sm text-ink-soft">Оплата — переводом, не на сайте</p>
      ) : null}
      {showLink && booking.meetLink && booking.status === "confirmed" ? (
        <a
          href={booking.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-sage px-4 py-2 text-sm text-cream"
        >
          Открыть встречу
        </a>
      ) : null}
    </article>
  );
}
