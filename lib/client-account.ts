import { prisma } from "@/lib/prisma";
import { bookingStatusLabel } from "@/lib/booking-status";
import { isCompletePhone } from "@/lib/booking-form";
import { attachClientBookings } from "@/lib/client-identity";

const ACTIVE = ["pending", "confirmed"];

export type AccountBooking = {
  id: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  statusLabel: string;
  meetLink: string;
  amountRub: number;
  paidAt: string | null;
  paid: boolean;
};

export type AccountView = {
  client: {
    id: string;
    email: string;
    phone: string;
    name: string;
    telegram: string;
    vkLinked: boolean;
    note: string;
    profileComplete: boolean;
  };
  upcoming: AccountBooking[];
  next: AccountBooking | null;
  history: AccountBooking[];
  receipts: AccountBooking[];
};

function serializeBooking(booking: {
  id: string;
  slotStart: Date;
  slotEnd: Date;
  status: string;
  meetLink: string;
  amountRub: number;
  paidAt: Date | null;
}): AccountBooking {
  return {
    id: booking.id,
    slotStart: booking.slotStart.toISOString(),
    slotEnd: booking.slotEnd.toISOString(),
    status: booking.status,
    statusLabel: bookingStatusLabel(booking.status),
    meetLink: booking.meetLink,
    amountRub: booking.amountRub,
    paidAt: booking.paidAt?.toISOString() || null,
    paid: Boolean(booking.paidAt),
  };
}

export async function bookingsForClient(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return [];

  const or: { clientId?: string; email?: string; phone?: string; telegramChatId?: string }[] = [
    { clientId: client.id },
  ];
  if (client.email) or.push({ email: client.email });
  if (isCompletePhone(client.phone)) or.push({ phone: client.phone });
  if (client.telegramChatId) or.push({ telegramChatId: client.telegramChatId });

  return prisma.booking.findMany({
    where: { OR: or },
    orderBy: { slotStart: "desc" },
  });
}

export async function getAccountView(clientId: string): Promise<AccountView | null> {
  await attachClientBookings(clientId);
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return null;

  const rows = await bookingsForClient(client.id);
  const seen = new Set<string>();
  const unique = rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  const now = new Date();
  const serialized = unique.map(serializeBooking);
  const upcoming = serialized
    .filter((row) => ACTIVE.includes(row.status) && new Date(row.slotEnd) >= now)
    .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  const upcomingIds = new Set(upcoming.map((row) => row.id));
  const history = serialized.filter((row) => !upcomingIds.has(row.id));
  const receipts = serialized.filter((row) => row.paid || row.status === "completed" || row.status === "confirmed");

  return {
    client: {
      id: client.id,
      email: client.email || "",
      phone: client.phone,
      name: client.name,
      telegram: client.telegram,
      vkLinked: Boolean(client.vkId),
      note: client.note,
      profileComplete: Boolean(client.name.trim() && isCompletePhone(client.phone) && client.email),
    },
    upcoming,
    next: upcoming[0] || null,
    history,
    receipts,
  };
}
