import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const CLIENT_COOKIE = "elena_client";
const MAX_AGE = 60 * 60 * 24 * 30;

type Payload = { sub: string; exp: number };

function secret() {
  const value = process.env.NEXTAUTH_SECRET || "";
  if (!value) throw new Error("NEXTAUTH_SECRET is required");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signClientToken(clientId: string, maxAge = MAX_AGE) {
  const payload = Buffer.from(
    JSON.stringify({ sub: clientId, exp: Math.floor(Date.now() / 1000) + maxAge }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readClientToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sign(payload), sig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Payload;
    if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch {
    return null;
  }
}

export function clientCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export function setClientSessionCookie(response: NextResponse, clientId: string) {
  response.cookies.set(CLIENT_COOKIE, signClientToken(clientId), clientCookieOptions());
  return response;
}

export function clearClientSessionCookie(response: NextResponse) {
  response.cookies.set(CLIENT_COOKIE, "", { ...clientCookieOptions(), maxAge: 0 });
  return response;
}

export const getCurrentClient = cache(async () => {
  const jar = await cookies();
  const token = jar.get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  const clientId = readClientToken(token);
  if (!clientId) return null;
  return prisma.client.findUnique({ where: { id: clientId } });
});
