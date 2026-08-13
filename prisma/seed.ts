import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "ChangeMeNow123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  const successText =
    "Заявка принята. Я напишу в MAX или Telegram, чтобы подтвердить время.";

  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      price: 4000,
      durationMin: 55,
      slotStepMin: 60,
      successText,
      pendingHoldHours: 12,
      horizonDays: 21,
    },
  });

  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  if (settings?.successText.includes("WhatsApp")) {
    await prisma.setting.update({
      where: { id: "default" },
      data: { successText: settings.successText.replaceAll("WhatsApp", "MAX") },
    });
  }

  const existing = await prisma.weeklyAvailability.count();
  if (existing === 0) {
    await prisma.weeklyAvailability.createMany({
      data: [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        startTime: "10:00",
        endTime: "19:00",
      })),
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
