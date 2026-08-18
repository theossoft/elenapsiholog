import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/origin";
import { clearClientSessionCookie } from "@/lib/client-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true, redirect: "/" });
  clearClientSessionCookie(response);
  return response;
}
