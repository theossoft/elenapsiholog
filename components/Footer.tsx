import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-serif text-xl">{SITE.name}</p>
          <p className="mt-1 text-sm text-ink-soft">{SITE.job}. Онлайн-сессии.</p>
          <p className="mt-3 text-sm">
            <a href={`tel:${SITE.phone}`}>{SITE.phoneDisplay}</a>
            <br />
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-ink-soft">
          <a href="#zapis">Записаться</a>
          <a href={SITE.whatsapp} data-goal="whatsapp_click">
            WhatsApp
          </a>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/offer">Оферта</Link>
          <Link href="/admin" className="opacity-50">
            Вход для психолога
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-ink-soft">
        Не является медицинской услугой. При острых состояниях обратитесь в неотложную
        помощь.
      </p>
    </footer>
  );
}
