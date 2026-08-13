---
name: therapy-visual-design
description: Visual system for Elena Ivanova psychologist landing — palette, typography, photo treatment, motion, CTA hierarchy. Use when editing landing UI, Tailwind, layout, photos, or admin visual polish.
---

# Therapy visual design

Calm, warm, human. Not a clinic, not a spa, not a startup SaaS.

## Palette (CSS variables in `app/globals.css`)

- `--cream` `#F7F1E8` — page background
- `--cream-deep` `#EFE6D8` — cards / alternate bands
- `--ink` `#2C241C` — body text
- `--ink-soft` `#5C534A` — secondary
- `--sage` `#6B7F6A` — primary accent, links, focus
- `--sage-deep` `#4F5F4E` — hover / buttons
- `--terracotta` `#C4785A` — primary CTA only
- `--line` `#E2D6C6` — borders

Do not introduce neon, pure black, medical blue, or purple gradients.

## Type

- Headings: **Source Serif 4** (`font-serif`)
- Body / UI: **Manrope** (`font-sans`)
- One `h1` on the landing. Section titles are `h2`.
- Generous line-height (1.6 body, 1.2 headings). Max measure ~38rem for copy.

## Layout

- Max content width `72rem`, horizontal padding `1.25rem` → `2rem`.
- Cards: `rounded-2xl`, no hard drop shadows — use `shadow-[0_12px_40px_rgba(44,36,28,0.06)]`.
- Hero: portrait left (desktop), copy right. Mobile: photo first, then headline, then CTA.
- Sticky mobile CTA bar: «Записаться» → `#zapis`.

## Photos

- Use files in `public/photos/` only. Warm, slightly soft contrast.
- `object-cover`, faces not cropped at the chin.
- Always real `alt` in Russian (who / what), never empty or "image".

## Motion

- Subtle fade/slide on first view (`translateY(8px)`, 400–600ms). No bounce, no infinite loops.
- Buttons: 150ms color/opacity. Respect `prefers-reduced-motion`.

## CTA hierarchy

1. Terracotta filled: «Записаться на сессию»
2. Sage outline: MAX / Telegram / secondary
3. Text link: legal, footer

Never stack two filled terracotta buttons in one viewport.
