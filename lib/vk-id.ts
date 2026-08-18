import { createHash, randomBytes } from "crypto";
import type { NextResponse } from "next/server";
import { SITE } from "@/lib/site";

export const VK_STATE_COOKIE = "vk_oauth";
const VK_AUTHORIZE = "https://id.vk.com/authorize";
const VK_TOKEN = "https://id.vk.com/oauth2/auth";
const VK_USER = "https://id.vk.com/oauth2/user_info";

export type VkProfile = {
  vkId: string;
  email: string;
  phone: string;
  name: string;
};

type StoredState = {
  state: string;
  verifier: string;
};

export function vkConfigured() {
  return Boolean(process.env.VK_CLIENT_ID);
}

export function vkRedirectUri() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
  return `${base}/api/auth/vk/callback`;
}

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

export function createVkOAuth() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(16));
  return { verifier, challenge, state };
}

export function vkAuthorizeUrl(challenge: string, state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.VK_CLIENT_ID || "",
    redirect_uri: vkRedirectUri(),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "email phone",
  });
  return `${VK_AUTHORIZE}?${params.toString()}`;
}

export function vkStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  };
}

export function writeVkState(response: NextResponse, data: StoredState) {
  response.cookies.set(
    VK_STATE_COOKIE,
    Buffer.from(JSON.stringify(data)).toString("base64url"),
    vkStateCookieOptions(),
  );
}

export function readVkState(raw?: string): StoredState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString()) as StoredState;
    if (!data.state || !data.verifier) return null;
    return data;
  } catch {
    return null;
  }
}

export async function exchangeVkCode(input: {
  code: string;
  deviceId: string;
  verifier: string;
  state: string;
}): Promise<VkProfile | null> {
  const clientId = process.env.VK_CLIENT_ID || "";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    code_verifier: input.verifier,
    client_id: clientId,
    device_id: input.deviceId,
    redirect_uri: vkRedirectUri(),
    state: input.state,
  });
  if (process.env.VK_CLIENT_SECRET) {
    body.set("client_secret", process.env.VK_CLIENT_SECRET);
  }

  const tokenRes = await fetch(VK_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as {
    access_token?: string;
    user_id?: number | string;
    email?: string;
    error?: string;
  } | null;
  if (!tokenJson?.access_token) {
    console.error("[vk]", tokenJson);
    return null;
  }

  const infoRes = await fetch(VK_USER, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      access_token: tokenJson.access_token,
    }),
  });
  const infoJson = (await infoRes.json().catch(() => null)) as {
    user?: {
      user_id?: number | string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
  } | null;

  const user = infoJson?.user;
  const vkId = String(user?.user_id || tokenJson.user_id || "");
  if (!vkId) return null;

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return {
    vkId,
    email: (user?.email || tokenJson.email || "").trim().toLowerCase(),
    phone: (user?.phone || "").trim(),
    name,
  };
}
