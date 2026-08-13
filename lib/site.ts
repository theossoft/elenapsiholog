export const SITE = {
  name: "Елена Иванова",
  title: "Елена Иванова — психолог онлайн | Гештальт и КПТ",
  description:
    "Онлайн-сессии с психологом Еленой Ивановой. Гештальт-терапия и техники КПТ. Запись на удобное время — без оплаты на сайте.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://elenapsiholog.ru",
  phone: "+79081294116",
  phoneDisplay: "+7 908 129-41-16",
  email: "elena-9081294116@yandex.ru",
  max:
    process.env.NEXT_PUBLIC_MAX_URL ||
    "https://max.ru/u/f9LHodD0cOJJqU3Z1_EFx27cARnFsgmhBKrMStGK1XTya_w6O_RxdNcSMFU",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/elena_psy88",
  city: "Курск",
  job: "Психолог, гештальт-терапевт",
  sessionMin: 55,
  defaultPrice: 4000,
} as const;

export const FALLBACK_SUCCESS =
  "Заявка принята. Я напишу в MAX или Telegram, чтобы подтвердить время.";
