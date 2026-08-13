import type { Metadata, Viewport } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import { SITE } from "@/lib/site";
import { CookieBanner } from "@/components/CookieBanner";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: SITE.url },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: "/photos/hero-yasno.png", width: 800, height: 1000, alt: "Психолог Елена Иванова" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: ["/photos/hero-yasno.png"],
  },
  robots: { index: true, follow: true },
  verification: {
    yandex: process.env.YANDEX_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F1E8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
