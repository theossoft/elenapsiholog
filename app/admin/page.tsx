import { AdminNav } from "@/components/admin/AdminNav";
import { BookingsBoard } from "@/components/admin/BookingsBoard";

export default function AdminHomePage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-serif text-3xl">Заявки</h1>
        <p className="mt-2 mb-8 text-ink-soft">
          Новые записи приходят сюда и в Telegram. В боте можно сразу подтвердить или отменить заявку.
        </p>
        <BookingsBoard />
      </main>
    </>
  );
}
