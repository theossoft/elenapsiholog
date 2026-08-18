import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Topics } from "@/components/Topics";
import { HowItWorks } from "@/components/HowItWorks";
import { About } from "@/components/About";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { BookingWidget } from "@/components/BookingWidget";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { JsonLd } from "@/components/JsonLd";
import { GoalClicks } from "@/components/GoalClicks";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { landingCopyFrom } from "@/lib/copy";
import { getCurrentClient } from "@/lib/client-session";
import { vkConfigured } from "@/lib/vk-id";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string; error?: string }>;
}) {
  const query = await searchParams;
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  const price = settings?.price ?? SITE.defaultPrice;
  const duration = settings?.durationMin ?? SITE.sessionMin;
  const copy = landingCopyFrom(settings);
  const client = await getCurrentClient();

  return (
    <>
      <JsonLd price={price} />
      <GoalClicks />
      <Header
        loggedIn={Boolean(client)}
        vkEnabled={vkConfigured()}
        openLogin={query.login === "1"}
        loginError={query.error || ""}
      />
      <main className="pb-20 md:pb-0">
        <Hero copy={copy} />
        <Topics copy={copy} />
        <HowItWorks copy={copy} />
        <About copy={copy} />
        <Pricing price={price} duration={duration} copy={copy} />
        <Faq />
        <BookingWidget copy={copy} price={price} duration={duration} />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
