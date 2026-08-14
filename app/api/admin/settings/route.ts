import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_COPY } from "@/lib/copy";

export const dynamic = "force-dynamic";

const COPY_KEYS = Object.keys(DEFAULT_COPY) as (keyof typeof DEFAULT_COPY)[];
const DEFAULT_SUCCESS =
  "Заявка принята. Я напишу в MAX или Telegram, чтобы подтвердить время.";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });

  const data: Record<string, string | number> = {};

  if (body.price != null) data.price = Number(body.price) || 4000;
  if (body.durationMin != null) data.durationMin = Number(body.durationMin) || 55;
  if (body.slotStepMin != null) data.slotStepMin = Number(body.slotStepMin) || 60;
  if (body.meetLink != null) data.meetLink = String(body.meetLink);
  if (body.successText != null) data.successText = String(body.successText);
  if (body.pendingHoldHours != null) {
    data.pendingHoldHours = Number(body.pendingHoldHours) || 12;
  }
  if (body.horizonDays != null) data.horizonDays = Number(body.horizonDays) || 21;

  for (const key of COPY_KEYS) {
    if (body[key] != null) data[key] = String(body[key]);
  }
  if (typeof data.successText === "string") {
    data.successText = data.successText.replaceAll("WhatsApp", "MAX");
  }

  const copyFromBody = Object.fromEntries(
    COPY_KEYS.filter((key) => body[key] != null).map((key) => [key, String(body[key])]),
  );

  const settings = await prisma.setting.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      price: Number(body.price) || 4000,
      durationMin: Number(body.durationMin) || 55,
      slotStepMin: Number(body.slotStepMin) || 60,
      meetLink: String(body.meetLink || ""),
      successText: String(body.successText || DEFAULT_SUCCESS),
      pendingHoldHours: Number(body.pendingHoldHours) || 12,
      horizonDays: Number(body.horizonDays) || 21,
      ...DEFAULT_COPY,
      ...copyFromBody,
    },
  });

  return NextResponse.json({ settings });
}
