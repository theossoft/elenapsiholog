import Image from "next/image";
import { EDUCATION, METHODS } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(44,36,28,0.08)]">
          <Image
            src="/photos/portrait-b17.jpg"
            alt="Елена Иванова, психолог и гештальт-терапевт"
            fill
            sizes="(max-width: 1024px) 90vw, 420px"
            className="scale-105 object-cover object-[center_15%]"
          />
        </div>
        <div>
          <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Обо мне</p>
          <h2 className="font-serif mt-3 text-3xl md:text-4xl">
            Елена Иванова — психолог, гештальт-терапевт
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            Больше 13 лет помогаю взрослым, подросткам и семьям лучше понимать чувства,
            выстраивать отношения и опираться на себя. В работе соединяю глубину гештальта
            с ясными техниками КПТ: не только «поговорить», но и найти, что можно изменить.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
            Верю, что осознание своих эмоций и мыслей — первый шаг. Дальше идём вместе,
            в диалоге, в темпе, который вам подходит.
          </p>
          <h3 className="mt-8 font-serif text-2xl">Образование</h3>
          <ul className="mt-4 space-y-4">
            {EDUCATION.map((item) => (
              <li key={item.place} className="border-l-2 border-sage/40 pl-4">
                <p className="text-xs tracking-wide text-sage-deep uppercase">{item.year}</p>
                <p className="font-medium">{item.place}</p>
                <p className="text-sm text-ink-soft">{item.detail}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-serif text-2xl">Методы</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {METHODS.map((method) => (
              <li key={method} className="rounded-full bg-cream-deep px-3 py-1.5 text-sm">
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
