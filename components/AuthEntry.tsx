"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoginModal } from "@/components/LoginModal";

const LOGIN_EVENT = "open-client-login";

export function AuthEntry({
  vkEnabled,
  loggedIn,
  initialOpen = false,
  initialError = "",
}: {
  vkEnabled: boolean;
  loggedIn: boolean;
  initialOpen?: boolean;
  initialError?: string;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [prefill, setPrefill] = useState("");

  useEffect(() => {
    if (!initialOpen) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("login");
    url.searchParams.delete("error");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  }, [initialOpen]);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ email?: string }>).detail;
      if (detail?.email) setPrefill(detail.email);
      setOpen(true);
    }
    window.addEventListener(LOGIN_EVENT, onOpen);
    return () => window.removeEventListener(LOGIN_EVENT, onOpen);
  }, []);

  if (loggedIn) {
    return (
      <Link
        href="/account"
        className="rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink md:px-4"
      >
        Кабинет
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink md:px-4"
      >
        Войти
      </button>
      <LoginModal
        vkEnabled={vkEnabled}
        open={open}
        prefillEmail={prefill}
        initialError={initialError}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
