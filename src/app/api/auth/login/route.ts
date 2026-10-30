import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  OWNER_COOKIE,
  makeOwnerToken,
  getOwnerPasswordHash,
  verifyPassword,
  sessionCookieOptions,
} from "@/lib/auth";
import { recordServerEvent, deviceFromRequest } from "@/lib/server-events";

/** Owner dashboard sign-in. POST { password } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const stored = await getOwnerPasswordHash();
  if (!verifyPassword(password, stored)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, makeOwnerToken(), sessionCookieOptions());
  // Analytics: count the dashboard unlock (owner only, no username stored).
  await recordServerEvent("owner_login", { device: deviceFromRequest(req) });
  return res;
}

/** Owner dashboard sign-out — clears the httpOnly session cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
