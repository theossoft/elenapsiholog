import { TEEN_TOPICS, TOPICS } from "@/lib/content";
import type { LandingCopy } from "@/lib/copy";

export function Topics({ copy }: { copy: LandingCopy }) {
  return (
    <section id="topics" className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">С чем приходят</p>
        <h2 className="font-serif mt-3 max-w-2xl text-3xl md:text-4xl">
          {copy.topicsTitle}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <article
              key={topic.title}
              className="rounded-2xl bg-cream-deep/80 p-6 shadow-[0_12px_40px_rgba(44,36,28,0.06)]"
            >
              <h3 className="font-serif text-xl">{topic.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{topic.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-cream p-6 md:p-8">
          <h3 className="font-serif text-2xl">Подростки 11–18 лет</h3>
          <p className="mt-2 max-w-2xl text-ink-soft">{copy.teensLead}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {TEEN_TOPICS.map((item) => (
              <li
                key={item}
                className="rounded-full bg-cream-deep px-3 py-1.5 text-sm text-ink-soft"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
