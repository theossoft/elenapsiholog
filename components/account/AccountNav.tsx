"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SITE } from "@/lib/site";

const LINKS = [
  { href: "/account", label: "Кабинет" },
  { href: "/account/history", label: "История" },
  { href: "/account/receipts", label: "Оплаты" },
  { href: "/account/profile", label: "Профиль" },
];

export function AccountNav() {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/client/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
        <Link href="/" className="font-serif text-lg text-ink">
          {SITE.name}
          <span className="mt-0.5 block text-xs font-sans tracking-wide text-ink-soft">
            Личный кабинет
          </span>
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={path === link.href ? "text-sage-deep" : "text-ink-soft hover:text-ink"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-3 text-sm">
          <Link href="/#zapis" className="text-ink-soft hover:text-ink">
            Записаться
          </Link>
          <button type="button" onClick={logout} className="text-ink-soft hover:text-ink">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
