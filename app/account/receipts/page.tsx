import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/client-session";
import { getAccountView } from "@/lib/client-account";
import { formatSlot } from "@/lib/moscow";

export const dynamic = "force-dynamic";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

export default async function ReceiptsPage() {
  const client = await getCurrentClient();
  if (!client) redirect("/?login=1");
  const view = await getAccountView(client.id);
  if (!view) redirect("/?login=1");

  return (
    <div>
      <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Оплата</p>
      <h1 className="font-serif mt-3 text-3xl">Подтверждения оплаты</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Оплата проходит переводом, не на сайте. Здесь — подтверждение, когда Елена отметит, что
        перевод получен. Это не кассовый чек.
      </p>
      {view.receipts.length ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cream-deep">
              <tr>
                <th className="px-4 py-3">Сессия</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {view.receipts.map((booking) => (
                <tr key={booking.id} className="border-t border-line">
                  <td className="px-4 py-3">{formatSlot(new Date(booking.slotStart))}</td>
                  <td className="px-4 py-3">
                    {booking.amountRub ? `${formatMoney(booking.amountRub)} ₽` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {booking.paid ? "Оплата отмечена" : "Ожидает отметки"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/account/receipts/${booking.id}`} className="text-sage-deep">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">Подтверждений пока нет.</p>
      )}
    </div>
  );
}
