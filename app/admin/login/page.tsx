"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    setError("Неверный логин или пароль.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl bg-cream-deep p-8 shadow-[0_12px_40px_rgba(44,36,28,0.08)]"
      >
        <p className="font-serif text-2xl">Вход в кабинет</p>
        <label className="mt-6 block text-sm">
          Логин
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm">
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-terracotta-deep">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-sage py-3 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Вхожу…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
