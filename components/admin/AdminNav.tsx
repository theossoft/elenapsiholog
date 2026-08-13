"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Заявки" },
  { href: "/admin/schedule", label: "Расписание" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <header className="border-b border-line bg-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="font-serif text-lg">Кабинет</p>
        <nav className="flex gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={path === link.href ? "text-sage-deep" : "text-ink-soft"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-3 text-sm">
          <Link href="/" className="text-ink-soft">
            На сайт
          </Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
