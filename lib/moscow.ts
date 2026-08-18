const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function moscowParts(date: Date) {
  const d = new Date(date.getTime() + MOSCOW_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay() === 0 ? 7 : d.getUTCDay(),
  };
}

export function moscowDateString(date: Date) {
  const p = moscowParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function moscowToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, 0));
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function formatSlot(date: Date) {
  return date.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatCalendarHeading(date: Date) {
  const text = date.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    month: "long",
    year: "numeric",
  });
}

export function daysInMoscowMonth(year: number, month: number) {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const last = addMinutes(moscowToUtc(`${nextYear}-${pad(nextMonth)}-01`, "12:00"), -24 * 60);
  return moscowParts(last).day;
}

export function todayMoscow() {
  return moscowDateString(new Date());
}

export function shiftMoscowDate(date: string, days: number) {
  const utc = moscowToUtc(date, "12:00");
  return moscowDateString(addMinutes(utc, days * 24 * 60));
}

export function weekdayOfDate(date: string) {
  return moscowParts(moscowToUtc(date, "12:00")).weekday;
}

export function iterateDays(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => shiftMoscowDate(from, i));
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number) {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function parseMoscowDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function shiftMoscowMonth(year: number, month: number, delta: number) {
  let nextMonth = month + delta;
  let nextYear = year;
  while (nextMonth > 12) {
    nextMonth -= 12;
    nextYear += 1;
  }
  while (nextMonth < 1) {
    nextMonth += 12;
    nextYear -= 1;
  }
  return { year: nextYear, month: nextMonth };
}

export function compareMoscowMonth(
  a: { year: number; month: number },
  b: { year: number; month: number },
) {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function moscowMonthDays(year: number, month: number) {
  const weekday = weekdayOfDate(`${year}-${pad(month)}-01`);
  const lastDay = daysInMoscowMonth(year, month);
  const cells: (string | null)[] = [];
  for (let i = 1; i < weekday; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(`${year}-${pad(month)}-${pad(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
