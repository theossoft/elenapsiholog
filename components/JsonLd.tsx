import { FAQ } from "@/lib/content";
import { SITE } from "@/lib/site";

export function JsonLd({ price }: { price: number }) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE.url}#person`,
        name: SITE.name,
        jobTitle: SITE.job,
        image: `${SITE.url}/photos/hero-yasno.png`,
        telephone: SITE.phone,
        email: SITE.email,
        url: SITE.url,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.city,
          addressCountry: "RU",
        },
      },
      {
        "@type": "ProfessionalService",
        name: `${SITE.name} — психолог онлайн`,
        url: SITE.url,
        image: `${SITE.url}/photos/hero-yasno.png`,
        telephone: SITE.phone,
        areaServed: "RU",
        availableLanguage: "Russian",
        founder: { "@id": `${SITE.url}#person` },
        offers: {
          "@type": "Offer",
          price,
          priceCurrency: "RUB",
          description: "Индивидуальная онлайн-сессия 55 минут",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
