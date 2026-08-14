import Image from "next/image";
import { SITE } from "@/lib/site";
import type { LandingCopy } from "@/lib/copy";

export function Hero({ copy }: { copy: LandingCopy }) {
  return (
    <section id="top" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-stretch md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-5 py-12 md:px-8 md:py-20 lg:py-24">
          <p className="reveal text-sm tracking-[0.18em] text-sage-deep uppercase">
            {copy.heroEyebrow}
          </p>
          <h1 className="reveal font-serif mt-4 max-w-xl text-[2.05rem] leading-[1.15] text-ink md:text-5xl">
            {copy.heroHeadline}
          </h1>
          <p className="reveal mt-5 max-w-lg text-base leading-relaxed text-ink-soft md:text-lg">
            {copy.heroLead}
          </p>
          <div className="reveal mt-8 flex flex-wrap gap-3">
            <a
              href="#zapis"
              data-goal="zapis_click"
              className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-deep"
            >
              Записаться на сессию
            </a>
            <a
              href={SITE.max}
              target="_blank"
              rel="noopener noreferrer"
              data-goal="max_click"
              className="rounded-full border border-sage px-6 py-3 text-sm text-sage-deep transition-colors hover:bg-sage hover:text-cream"
            >
              Написать в MAX
            </a>
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              data-goal="telegram_click"
              className="rounded-full border border-sage px-6 py-3 text-sm text-sage-deep transition-colors hover:bg-sage hover:text-cream"
            >
              Написать в Telegram
            </a>
          </div>
          <ul className="reveal mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
            <li>
              <strong className="block font-serif text-xl text-ink">13 лет</strong>
              практики
            </li>
            <li>
              <strong className="block font-serif text-xl text-ink">800+</strong>
              сессий на Alter
            </li>
            <li>
              <strong className="block font-serif text-xl text-ink">55 мин</strong>
              онлайн-встреча
            </li>
          </ul>
        </div>
        <div className="relative min-h-[420px] bg-ink md:min-h-full">
          <Image
            src="/photos/hero-yasno.png"
            alt="Психолог Елена Иванова — портрет для онлайн-сессий"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-6 text-cream md:hidden">
            <p className="font-serif text-xl">{SITE.name}</p>
            <p className="text-sm text-cream/80">{SITE.job}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
