import { AdminNav } from "@/components/admin/AdminNav";
import { CopyForm } from "@/components/admin/CopyForm";

export default function CopyPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-serif text-3xl">Тексты сайта</h1>
        <p className="mt-2 mb-8 max-w-xl text-ink-soft">
          Здесь можно править основные формулировки лендинга, включая окно после
          записи. Пустое поле при показе заменится текстом по умолчанию. Не обещайте
          результат и не вставляйте отзывы, которых нет.
        </p>
        <CopyForm />
      </main>
    </>
  );
}
