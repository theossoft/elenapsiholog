import { NextResponse } from "next/server";
import {
  createVkOAuth,
  vkAuthorizeUrl,
  vkConfigured,
  writeVkState,
} from "@/lib/vk-id";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!vkConfigured()) {
    return NextResponse.redirect(new URL("/?login=1&error=vk", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  const { verifier, challenge, state } = createVkOAuth();
  const response = NextResponse.redirect(vkAuthorizeUrl(challenge, state));
  writeVkState(response, { state, verifier });
  return response;
}
