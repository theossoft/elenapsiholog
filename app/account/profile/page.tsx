import { redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/client-session";
import { getAccountView } from "@/lib/client-account";
import { ProfileForm } from "@/components/account/ProfileForm";
import { vkConfigured } from "@/lib/vk-id";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const client = await getCurrentClient();
  if (!client) redirect("/?login=1");
  const view = await getAccountView(client.id);
  if (!view) redirect("/?login=1");

  return (
    <div>
      <p className="text-sm tracking-[0.18em] text-sage-deep uppercase">Профиль</p>
      <h1 className="font-serif mt-3 text-3xl">Ваши данные</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Имя и телефон нужны, чтобы связаться с вами и узнать вас в ботах MAX и Telegram. Email —
        для входа и подтверждений оплаты.
      </p>
      <div className="mt-8">
        <ProfileForm client={view.client} vkEnabled={vkConfigured()} />
      </div>
    </div>
  );
}
