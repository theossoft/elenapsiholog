"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

export function openClientLogin(email?: string) {
  window.dispatchEvent(new CustomEvent("open-client-login", { detail: { email } }));
}

export function LoginModal({
  vkEnabled,
  open,
  onClose,
  prefillEmail = "",
  initialError = "",
}: {
  vkEnabled: boolean;
  open: boolean;
  onClose: () => void;
  prefillEmail?: string;
  initialError?: string;
}) {
  const titleId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState(
    initialError === "vk" ? "Не получилось войти через VK ID. Попробуйте код на email." : "",
  );
  const [sending, setSending] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  useEffect(() => {
    if (!open) {
      setStep("email");
      setCode("");
      setDevCode("");
      setSending(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      (step === "code" ? codeRef : emailRef).current?.focus();
    }, reduce ? 0 : 50);
    return () => window.clearTimeout(timer);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || resendAt < Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [open, resendAt]);

  const waitSec = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    setSending(true);
    setError("");
    setDevCode("");
    try {
      const res = await fetch("/api/auth/client/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось отправить код.");
        return;
      }
      setStep("code");
      setResendAt(Date.now() + 60_000);
      if (data.devCode) setDevCode(String(data.devCode));
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/client/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный код.");
        setSending(false);
        return;
      }
      window.location.href = data.redirect || "/account";
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-[0_12px_40px_rgba(44,36,28,0.12)] md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-serif text-3xl text-ink">
              Войти
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {step === "email"
                ? "Введите email — пришлём одноразовый код."
                : `Код отправлен на ${email}. Если письма нет во входящих, загляните в «Спам».`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full px-2 py-1 text-lg text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </div>

        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-6">
            <label className="block text-sm">
              Email
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-sage/40 focus:border-sage focus:ring-2"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-terracotta-deep">{error}</p> : null}
            <button
              type="submit"
              disabled={sending}
              className="mt-5 w-full rounded-full bg-sage py-3 text-sm font-medium text-cream transition-colors hover:bg-sage-deep disabled:opacity-50"
            >
              {sending ? "Отправляю…" : "Получить код →"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-6">
            <label className="block text-sm">
              Код из письма
              <input
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 tracking-[0.3em] outline-none ring-sage/40 focus:border-sage focus:ring-2"
              />
            </label>
            {devCode ? (
              <p className="mt-2 text-xs text-ink-soft">Код для отладки: {devCode}</p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-terracotta-deep">{error}</p> : null}
            <button
              type="submit"
              disabled={sending || code.length !== 6}
              className="mt-5 w-full rounded-full bg-sage py-3 text-sm font-medium text-cream transition-colors hover:bg-sage-deep disabled:opacity-50"
            >
              {sending ? "Вхожу…" : "Войти →"}
            </button>
            <button
              type="button"
              disabled={sending || waitSec > 0}
              onClick={() => requestCode()}
              className="mt-3 w-full text-sm text-sage-deep disabled:text-ink-soft"
            >
              {waitSec > 0 ? `Отправить код ещё раз через ${waitSec} с` : "Отправить код ещё раз"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="mt-2 w-full text-sm text-ink-soft"
            >
              Изменить email
            </button>
          </form>
        )}

        {vkEnabled ? (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/vk/start";
            }}
            className="mt-4 flex w-full items-center justify-center rounded-full border border-sage px-4 py-3 text-sm text-sage-deep transition-colors hover:bg-sage hover:text-cream"
          >
            Войти через VK ID
          </button>
        ) : null}

        <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft">
          Нажимая «Войти», вы принимаете{" "}
          <Link href="/offer" className="underline" onClick={onClose}>
            оферту
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="underline" onClick={onClose}>
            политику обработки персональных данных
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
