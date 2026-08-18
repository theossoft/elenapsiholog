import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CLIENT_COOKIE, readClientToken } from "@/lib/client-session";
import { vkConfigured } from "@/lib/vk-id";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const clientId = readClientToken(jar.get(CLIENT_COOKIE)?.value || "");
  if (!clientId) {
    return NextResponse.json({ loggedIn: false, vkEnabled: vkConfigured() });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ loggedIn: false, vkEnabled: vkConfigured() });
  }

  return NextResponse.json({
    loggedIn: true,
    vkEnabled: vkConfigured(),
    email: client.email || "",
    name: client.name,
    phone: client.phone,
  });
}
