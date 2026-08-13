import { AdminNav } from "@/components/admin/AdminNav";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default function SettingsPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-serif text-3xl">Настройки</h1>
        <p className="mt-2 mb-8 text-ink-soft">Цена на лендинге берётся отсюда.</p>
        <SettingsForm />
      </main>
    </>
  );
}
