import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/client-session";
import { getAccountView } from "@/lib/client-account";
import { formatSlot } from "@/lib/moscow";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getCurrentClient();
  if (!client) redirect("/?login=1");
  const view = await getAccountView(client.id);
  if (!view) redirect("/?login=1");
  const booking = view.receipts.find((row) => row.id === id) || view.history.find((row) => row.id === id) || view.upcoming.find((row) => row.id === id);
  if (!booking) notFound();

  return (
    <div className="max-w-xl">
      <p>
        <Link href="/account/receipts" className="text-sm text-sage-deep underline">
          К списку оплат
        </Link>
      </p>
      <article className="mt-6 rounded-2xl border border-line bg-white p-6">
        <p className="text-sm tracking-[0.16em] text-sage-deep uppercase">Подтверждение оплаты</p>
        <h1 className="font-serif mt-3 text-3xl">{SITE.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">{SITE.job}. Онлайн-сессия.</p>
        <dl className="mt-6 divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-ink-soft">Клиент</dt>
            <dd>{view.client.name || view.client.email || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-ink-soft">Дата и время</dt>
            <dd className="text-right">{formatSlot(new Date(booking.slotStart))} (МСК)</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-ink-soft">Формат</dt>
            <dd>Онлайн-сессия</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-ink-soft">Сумма</dt>
            <dd>{booking.amountRub ? `${formatMoney(booking.amountRub)} ₽` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-ink-soft">Оплата</dt>
            <dd>{booking.paid ? "Отмечена как полученная" : "Ещё не отмечена"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          Это подтверждение записи и оплаты переводом. Не является кассовым чеком.
        </p>
      </article>
    </div>
  );
}
