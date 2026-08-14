import type { Booking } from "@prisma/client";
import { prisma } from "./prisma";

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export async function setBookingStatus(
  id: string,
  status: BookingStatus,
  incomingMeetLink = "",
): Promise<{ booking: Booking } | { error: "not_found" | "bad_status" }> {
  if (!BOOKING_STATUSES.includes(status)) return { error: "bad_status" };

  const current = await prisma.booking.findUnique({ where: { id } });
  if (!current) return { error: "not_found" };

  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  const meetLink = incomingMeetLink.trim() || current.meetLink || settings?.meetLink || "";

  const booking = await prisma.booking.update({
    where: { id: current.id },
    data: { status, meetLink },
  });

  return { booking };
}
