import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Как обрабатываются персональные данные на сайте психолога Елены Ивановой.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 leading-relaxed">
      <p>
        <Link href="/" className="text-sage-deep underline">
          На главную
        </Link>
      </p>
      <h1 className="font-serif mt-6 text-4xl">Политика конфиденциальности</h1>
      <p className="mt-4 text-ink-soft">
        Настоящая политика описывает обработку персональных данных на сайте{" "}
        {SITE.url.replace("https://", "")} в соответствии с 152-ФЗ.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Оператор</h2>
      <p className="mt-2">
        {SITE.name}, психолог. Контакт: {SITE.phoneDisplay}, {SITE.email}.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Какие данные собираем</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>
          email — если вы оставляете заявку или входите в личный кабинет; одноразовый код входа
          приходит на эту почту;
        </li>
        <li>
          имя, телефон, Telegram, идентификатор VK ID, идентификатор чата в боте записи и текст
          запроса — если вы указываете их в кабинете, в боте или при входе через VK ID;
        </li>
        <li>история записей и отметки об оплате переводом — в кабинете и для связи в ботах;</li>
        <li>технические данные визита (cookies Метрики) — только после согласия.</li>
      </ul>
      <h2 className="font-serif mt-8 text-2xl">Зачем</h2>
      <p className="mt-2">
        Чтобы связаться с вами, подтвердить время сессии, напомнить о встрече, показать историю в
        кабинете и ботах и вести запись. Правовое основание — ваше согласие при отправке формы,
        входе в кабинет или в боте записи.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Срок хранения</h2>
      <p className="mt-2">
        Данные заявки хранятся на сервере сайта, пока нужна запись и коммуникация, затем
        удаляются по вашему запросу или когда утратили актуальность.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Передача третьим лицам</h2>
      <p className="mt-2">
        Содержание сессий не передаётся. Уведомление о новой заявке может приходить в
        Telegram-бот оператора. Бот записи хранит идентификатор вашего чата, чтобы
        показать время встречи и прислать напоминание. Яндекс.Метрика обрабатывает
        обезличенную статистику при вашем согласии.
      </p>
      <h2 className="font-serif mt-8 text-2xl">Ваши права</h2>
      <p className="mt-2">
        Вы можете запросить уточнение, удаление или отзыв согласия, написав на{" "}
        {SITE.email}, в MAX или в Telegram.
      </p>
    </article>
  );
}
