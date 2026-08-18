import Link from "next/link";
import { getCurrentClient } from "@/lib/client-session";
import { getAccountView } from "@/lib/client-account";
import { SessionCard } from "@/components/account/SessionCard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const client = await getCurrentClient();
  if (!client) redirect("/?login=1");
  const view = await getAccountView(client.id);
  if (!view) redirect("/?login=1");

  const greeting = view.client.name || view.client.email || "в кабинете";

  return (
    <div>
      <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Личный кабинет</p>
      <h1 className="font-serif mt-3 text-3xl md:text-4xl">Здравствуйте, {greeting}</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Здесь ближайшая запись, история сессий и подтверждения оплаты. То же будет видно в ботах,
        когда привяжете телефон.
      </p>

      {!view.client.profileComplete ? (
        <div className="mt-6 rounded-2xl border border-line bg-cream-deep/70 px-5 py-4">
          <p className="text-sm leading-relaxed">
            Добавьте имя и телефон в профиле — так проще написать вам в MAX или Telegram и узнать
            вас в ботах.
          </p>
          <Link
            href="/account/profile"
            className="mt-3 inline-flex text-sm text-sage-deep underline"
          >
            Заполнить профиль
          </Link>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Ближайшая запись</h2>
        {view.next ? (
          <div className="mt-4 max-w-xl">
            <SessionCard booking={view.next} />
          </div>
        ) : (
          <div className="mt-4 max-w-xl rounded-2xl border border-line p-5">
            <p className="text-ink-soft">Сейчас нет предстоящей сессии.</p>
            <Link
              href="/#zapis"
              className="mt-4 inline-flex rounded-full bg-terracotta px-5 py-2.5 text-sm text-white"
            >
              Записаться на сессию
            </Link>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl">История</h2>
          <Link href="/account/history" className="text-sm text-sage-deep">
            Вся история
          </Link>
        </div>
        {view.history.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {view.history.slice(0, 4).map((booking) => (
              <SessionCard key={booking.id} booking={booking} showLink={false} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-ink-soft">Прошедших сессий пока нет.</p>
        )}
      </section>
    </div>
  );
}
