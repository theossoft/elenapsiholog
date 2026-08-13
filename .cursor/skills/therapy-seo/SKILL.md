---
name: therapy-seo
description: SEO for the Russian psychologist landing (Yandex + Google): titles, schema, sitemap, Core Web Vitals, Metrika goals. Use when editing metadata, robots, JSON-LD, headings, or analytics.
---

# Therapy SEO

Target: `elenapsiholog.ru`. Language: `ru`. Region: Russia, online sessions.

## Titles and headings

- Landing title: `Елена Иванова — психолог онлайн | Гештальт и КПТ`
- Description ≤ 160 chars, include «онлайн-сессия» and «запись».
- Exactly one `h1`. Keywords in first 100 words, naturally.
- Open Graph + Twitter: portrait `og:image`, `og:locale` `ru_RU`.

## Technical

- App Router SSR for the landing. No client-only hero copy.
- `app/sitemap.ts`, `app/robots.ts`.
- Images via `next/image`, WebP, explicit width/height or `fill` + sizes.
- JSON-LD in layout/page: `Person`, `ProfessionalService`, `FAQPage` (FAQ answers must match visible text).
- Canonical `https://elenapsiholog.ru`.

## Schema facts

- Name: Елена Иванова
- Job: Психолог, гештальт-терапевт
- Area served: online, Russia
- Telephone: +7 908 129-41-16

## Yandex Metrika

Counter id from `NEXT_PUBLIC_METRIKA_ID`. Goals:

- `zapis_click` — any «Записаться» click
- `booking_success` — successful booking submit
- `whatsapp_click` — WhatsApp link

Load Metrika after cookie consent. Do not block first paint.

## Do not

- Keyword stuffing, hidden text, fake reviews.
- Duplicate H1 on `/privacy` or `/offer`.
- Index `/admin` (`noindex, nofollow`).
