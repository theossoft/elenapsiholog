"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const KEY = "metrika-consent";

export function CookieBanner() {
  const id = process.env.NEXT_PUBLIC_METRIKA_ID;
  const [consent, setConsent] = useState<"unknown" | "yes" | "no">("unknown");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "yes" || saved === "no") setConsent(saved);
  }, []);

  function choose(value: "yes" | "no") {
    window.localStorage.setItem(KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === "yes" && id ? (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${id}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false });
          `}
        </Script>
      ) : null}

      {consent === "unknown" ? (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-xl px-4 md:bottom-4">
          <div className="rounded-2xl border border-line bg-cream p-4 shadow-[0_12px_40px_rgba(44,36,28,0.12)]">
            <p className="text-sm text-ink-soft">
              На сайте может работать Яндекс.Метрика — чтобы понимать, какие страницы
              полезны. Подробнее в{" "}
              <Link href="/privacy" className="underline">
                политике
              </Link>
              .
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => choose("yes")}
                className="rounded-full bg-sage px-4 py-2 text-sm text-white"
              >
                Принимаю
              </button>
              <button
                type="button"
                onClick={() => choose("no")}
                className="rounded-full border border-line px-4 py-2 text-sm"
              >
                Только необходимое
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
