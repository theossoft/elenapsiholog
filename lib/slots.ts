import { prisma } from "./prisma";
import {
  addMinutes,
  iterateDays,
  minutesToTime,
  moscowToUtc,
  timeToMinutes,
  todayMoscow,
  weekdayOfDate,
} from "./moscow";

export type PublicSlot = {
  start: string;
  end: string;
};

async function getSettings() {
  return (
    (await prisma.setting.findUnique({ where: { id: "default" } })) ?? {
      durationMin: 55,
      slotStepMin: 60,
      pendingHoldHours: 12,
      horizonDays: 21,
    }
  );
}

export async function listAvailableSlots(days?: number): Promise<PublicSlot[]> {
  const settings = await getSettings();
  const horizon = days ?? settings.horizonDays;
  const startDate = todayMoscow();
  const dates = iterateDays(startDate, horizon);

  const [rules, exceptions, bookings] = await Promise.all([
    prisma.weeklyAvailability.findMany(),
    prisma.availabilityException.findMany({
      where: { date: { in: dates } },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
        slotStart: {
          gte: moscowToUtc(startDate, "00:00"),
        },
      },
    }),
  ]);

  const holdMs = settings.pendingHoldHours * 60 * 60 * 1000;
  const now = Date.now();
  const taken = new Set(
    bookings
      .filter((b) => {
        if (b.status === "confirmed") return true;
        return now - b.createdAt.getTime() < holdMs;
      })
      .map((b) => b.slotStart.toISOString()),
  );

  const slots: PublicSlot[] = [];

  for (const date of dates) {
    const weekday = weekdayOfDate(date);
    const dayExceptions = exceptions.filter((e) => e.date === date);
    if (dayExceptions.some((e) => e.kind === "day_off")) continue;

    const times = new Set<string>();
    for (const rule of rules.filter((r) => r.weekday === weekday)) {
      let cursor = timeToMinutes(rule.startTime);
      const end = timeToMinutes(rule.endTime);
      while (cursor + settings.durationMin <= end) {
        times.add(minutesToTime(cursor));
        cursor += settings.slotStepMin;
      }
    }

    for (const extra of dayExceptions.filter((e) => e.kind === "extra" && e.time)) {
      times.add(extra.time!);
    }
    for (const blocked of dayExceptions.filter((e) => e.kind === "block" && e.time)) {
      times.delete(blocked.time!);
    }

    for (const time of [...times].sort()) {
      const start = moscowToUtc(date, time);
      if (start.getTime() <= now + 30 * 60 * 1000) continue;
      if (taken.has(start.toISOString())) continue;
      slots.push({
        start: start.toISOString(),
        end: addMinutes(start, settings.durationMin).toISOString(),
      });
    }
  }

  return slots;
}

export async function isSlotFree(slotStart: Date) {
  const settings = await getSettings();
  const available = await listAvailableSlots(settings.horizonDays);
  return available.some((s) => s.start === slotStart.toISOString());
}
