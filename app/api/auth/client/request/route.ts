import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/origin";
import { requestLoginCode } from "@/lib/login-code";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const result = await requestLoginCode(String(body?.email || ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.error, field: result.field }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
