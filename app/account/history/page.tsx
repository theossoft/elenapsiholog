import { redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/client-session";
import { getAccountView } from "@/lib/client-account";
import { SessionCard } from "@/components/account/SessionCard";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const client = await getCurrentClient();
  if (!client) redirect("/?login=1");
  const view = await getAccountView(client.id);
  if (!view) redirect("/?login=1");

  const items = [...view.upcoming, ...view.history];

  return (
    <div>
      <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Сессии</p>
      <h1 className="font-serif mt-3 text-3xl">История сеансов</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Предстоящие и прошедшие встречи. Статусы: ожидает подтверждения, подтверждена, завершена
        или отменена.
      </p>
      {items.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((booking) => (
            <SessionCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">Записей пока нет.</p>
      )}
    </div>
  );
}
