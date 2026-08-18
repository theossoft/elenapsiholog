import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/AccountNav";
import { getCurrentClient } from "@/lib/client-session";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const client = await getCurrentClient();
  if (!client) redirect("/?login=1");

  return (
    <>
      <AccountNav />
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">{children}</main>
    </>
  );
}
