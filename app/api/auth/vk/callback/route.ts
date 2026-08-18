import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { upsertClientIdentity } from "@/lib/client-identity";
import { setClientSessionCookie } from "@/lib/client-session";
import { exchangeVkCode, readVkState, VK_STATE_COOKIE, vkConfigured } from "@/lib/vk-id";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
}

function fail(reason = "vk") {
  const response = NextResponse.redirect(`${siteUrl()}/?login=1&error=${reason}`);
  response.cookies.set(VK_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  if (!vkConfigured()) return fail();

  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const deviceId = url.searchParams.get("device_id") || "";
  if (url.searchParams.get("error") || !code || !state) return fail();

  const jar = await cookies();
  const stored = readVkState(jar.get(VK_STATE_COOKIE)?.value);
  if (!stored || stored.state !== state) return fail();

  const profile = await exchangeVkCode({
    code,
    deviceId,
    verifier: stored.verifier,
    state,
  });
  if (!profile) return fail();

  const client = await upsertClientIdentity({
    vkId: profile.vkId,
    email: profile.email,
    phone: profile.phone,
    name: profile.name,
    emailVerifiedAt: profile.email ? new Date() : null,
    consentAt: new Date(),
  });

  const response = NextResponse.redirect(`${siteUrl()}/account`);
  response.cookies.set(VK_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  setClientSessionCookie(response, client.id);
  return response;
}
