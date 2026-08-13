import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

  const settings = await prisma.setting.upsert({
    where: { id: "default" },
    update: {
      price: Number(body.price) || 4000,
      durationMin: Number(body.durationMin) || 55,
      slotStepMin: Number(body.slotStepMin) || 60,
      meetLink: String(body.meetLink || ""),
      successText: String(body.successText || ""),
      pendingHoldHours: Number(body.pendingHoldHours) || 12,
      horizonDays: Number(body.horizonDays) || 21,
    },
    create: {
      id: "default",
      price: Number(body.price) || 4000,
      durationMin: Number(body.durationMin) || 55,
      slotStepMin: Number(body.slotStepMin) || 60,
      meetLink: String(body.meetLink || ""),
      successText: String(body.successText || ""),
      pendingHoldHours: Number(body.pendingHoldHours) || 12,
      horizonDays: Number(body.horizonDays) || 21,
    },
  });

  return NextResponse.json({ settings });
}
