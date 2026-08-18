import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Публичная оферта",
  description: "Условия записи на онлайн-сессию к психологу Елене Ивановой.",
};

export default function OfferPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 leading-relaxed">
      <p>
        <Link href="/" className="text-sage-deep underline">
          На главную
        </Link>
      </p>
      <h1 className="font-serif mt-6 text-4xl">Публичная оферта</h1>
      <p className="mt-4 text-ink-soft">
        Заявка на сайте — это запрос на консультацию психолога, а не медицинская услуга
        и не договор оказания медицинской помощи.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Предмет</h2>
      <p className="mt-2">
        Онлайн-сессия психологического консультирования длительностью около 55 минут в
        согласованное время.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Запись и оплата</h2>
      <p className="mt-2">
        Вы выбираете свободный слот и оставляете email для чека. Имя и телефон можно добавить в
        личном кабинете. {SITE.name} подтверждает время в мессенджере и сообщает способ оплаты
        переводом. Оплата на сайте не производится.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Отмена</h2>
      <p className="mt-2">
        Перенос или отмена — не позднее чем за 24 часа до начала. При более позднем
        отказе слот может считаться состоявшимся.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Конфиденциальность</h2>
      <p className="mt-2">
        Содержание встреч не разглашается, за исключением случаев, предусмотренных
        законом (угроза жизни, судебный запрос).
      </p>
    </article>
  );
}
