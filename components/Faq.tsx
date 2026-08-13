import { FAQ } from "@/lib/content";

export function Faq() {
  return (
    <section id="faq" className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Вопросы</p>
        <h2 className="font-serif mt-3 text-3xl md:text-4xl">Коротко о терапии и записи</h2>
        <div className="mt-8 divide-y divide-line">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="cursor-pointer list-none font-serif text-xl marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {item.q}
                  <span className="text-sage transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
