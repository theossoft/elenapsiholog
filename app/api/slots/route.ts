import { NextResponse } from "next/server";
import { listAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await listAvailableSlots();
  return NextResponse.json({ slots });
}
