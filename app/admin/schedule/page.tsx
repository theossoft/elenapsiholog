import { AdminNav } from "@/components/admin/AdminNav";
import { ScheduleEditor } from "@/components/admin/ScheduleEditor";

export default function SchedulePage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-serif text-3xl">Расписание</h1>
        <p className="mt-2 mb-8 text-ink-soft">
          Задайте рабочие интервалы на неделю и точечные исключения.
        </p>
        <ScheduleEditor />
      </main>
    </>
  );
}
