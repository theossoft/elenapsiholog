import { SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a href="#top" className="font-serif text-lg text-ink md:text-xl">
          {SITE.name}
          <span className="mt-0.5 block text-xs font-sans tracking-wide text-ink-soft">
            Психолог · онлайн-сессии
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          <a href="#topics" className="hover:text-ink">
            С чем работаю
          </a>
          <a href="#about" className="hover:text-ink">
            Обо мне
          </a>
          <a href="#price" className="hover:text-ink">
            Стоимость
          </a>
          <a href="#faq" className="hover:text-ink">
            Вопросы
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={SITE.max}
            target="_blank"
            rel="noopener noreferrer"
            data-goal="max_click"
            className="hidden rounded-full border border-sage px-4 py-2 text-sm text-sage-deep transition-colors hover:bg-sage hover:text-cream md:inline-flex"
          >
            MAX
          </a>
          <a
            href={SITE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            data-goal="telegram_click"
            className="hidden rounded-full border border-sage px-4 py-2 text-sm text-sage-deep transition-colors hover:bg-sage hover:text-cream md:inline-flex"
          >
            Telegram
          </a>
          <a
            href="#zapis"
            data-goal="zapis_click"
            className="rounded-full bg-terracotta px-4 py-2 text-sm text-white transition-colors hover:bg-terracotta-deep"
          >
            Записаться
          </a>
        </div>
      </div>
    </header>
  );
}
