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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  const price = settings?.price ?? SITE.defaultPrice;
  const duration = settings?.durationMin ?? SITE.sessionMin;
  const copy = landingCopyFrom(settings);

  return (
    <>
      <JsonLd price={price} />
      <GoalClicks />
      <Header />
      <main className="pb-20 md:pb-0">
        <Hero copy={copy} />
        <Topics copy={copy} />
        <HowItWorks copy={copy} />
        <About copy={copy} />
        <Pricing price={price} duration={duration} copy={copy} />
        <Faq />
        <BookingWidget bookingLead={copy.bookingLead} />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
