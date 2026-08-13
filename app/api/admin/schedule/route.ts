import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const [rules, exceptions] = await Promise.all([
    prisma.weeklyAvailability.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    prisma.availabilityException.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }),
  ]);

  return NextResponse.json({ rules, exceptions });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rules = Array.isArray(body?.rules) ? body.rules : null;
  if (!rules) return NextResponse.json({ error: "Нет расписания" }, { status: 400 });

  const toHm = (value: string) => {
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return "";
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  };

  const clean = rules
    .map((r: { weekday?: number; startTime?: string; endTime?: string }) => ({
      weekday: Number(r.weekday),
      startTime: toHm(String(r.startTime || "")),
      endTime: toHm(String(r.endTime || "")),
    }))
    .filter(
      (r: { weekday: number; startTime: string; endTime: string }) =>
        r.weekday >= 1 &&
        r.weekday <= 7 &&
        /^\d{2}:\d{2}$/.test(r.startTime) &&
        /^\d{2}:\d{2}$/.test(r.endTime),
    );

  await prisma.$transaction([
    prisma.weeklyAvailability.deleteMany(),
    ...clean.map((r: { weekday: number; startTime: string; endTime: string }) =>
      prisma.weeklyAvailability.create({ data: r }),
    ),
  ]);

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const date = String(body?.date || "");
  const kind = String(body?.kind || "");
  const time = body?.time ? String(body.time) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Укажите дату" }, { status: 400 });
  }
  if (!["day_off", "extra", "block"].includes(kind)) {
    return NextResponse.json({ error: "Неизвестный тип" }, { status: 400 });
  }
  if ((kind === "extra" || kind === "block") && !time) {
    return NextResponse.json({ error: "Укажите время слота" }, { status: 400 });
  }

  const exception = await prisma.availabilityException.create({
    data: { date, kind, time },
  });
  return NextResponse.json({ exception });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Нет id" }, { status: 400 });

  await prisma.availabilityException.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
