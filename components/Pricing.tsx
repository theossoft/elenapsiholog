import { SITE } from "@/lib/site";

export function Pricing({ price, duration }: { price: number; duration: number }) {
  const formatted = new Intl.NumberFormat("ru-RU").format(price);

  return (
    <section id="price" className="bg-cream-deep/60 px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Стоимость</p>
          <h2 className="font-serif mt-3 text-3xl md:text-4xl">Прозрачные условия</h2>
          <p className="mt-4 max-w-xl text-ink-soft">
            Оплата — переводом после того, как я подтвержу время. На сайте ничего
            списывать не нужно: сначала договариваемся, потом встречаемся.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink-soft">
            <li>Формат: онлайн, видеосвязь</li>
            <li>Отмена или перенос — не позднее чем за 24 часа</li>
            <li>Работаю со взрослыми и подростками от 11 лет</li>
          </ul>
        </div>
        <div className="rounded-3xl bg-cream p-8 shadow-[0_12px_40px_rgba(44,36,28,0.06)]">
          <p className="text-sm text-ink-soft">Индивидуальная сессия</p>
          <p className="font-serif mt-2 text-5xl text-ink">
            {formatted} ₽
          </p>
          <p className="mt-1 text-ink-soft">{duration} минут</p>
          <a
            href="#zapis"
            data-goal="zapis_click"
            className="mt-8 inline-flex rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-deep"
          >
            Выбрать время
          </a>
          <p className="mt-4 text-xs text-ink-soft">
            Цена на сайте может обновляться. Актуальная стоимость всегда в этом блоке.
            Вопросы — в{" "}
            <a
              href={SITE.max}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              data-goal="max_click"
            >
              MAX
            </a>{" "}
            или{" "}
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              data-goal="telegram_click"
            >
              Telegram
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
