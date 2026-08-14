import { STEPS } from "@/lib/content";
import type { LandingCopy } from "@/lib/copy";

export function HowItWorks({ copy }: { copy: LandingCopy }) {
  return (
    <section className="bg-cream-deep/60 px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Как это устроено</p>
        <h2 className="font-serif mt-3 text-3xl md:text-4xl">{copy.howTitle}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.n}>
              <p className="font-serif text-3xl text-sage">{step.n}</p>
              <h3 className="mt-3 font-serif text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
