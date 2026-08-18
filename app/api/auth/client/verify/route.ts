import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/origin";
import { verifyLoginCode } from "@/lib/login-code";
import { upsertClientIdentity } from "@/lib/client-identity";
import { setClientSessionCookie } from "@/lib/client-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const result = await verifyLoginCode(String(body?.email || ""), String(body?.code || ""));
  if (!result.ok) {
    return NextResponse.json({ error: result.error, field: result.field }, { status: 400 });
  }

  const client = await upsertClientIdentity({
    email: result.email,
    emailVerifiedAt: new Date(),
    consentAt: new Date(),
  });

  const response = NextResponse.json({ ok: true, redirect: "/account" });
  setClientSessionCookie(response, client.id);
  return response;
}
