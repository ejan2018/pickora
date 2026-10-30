import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  USER_COOKIE,
  makeUserToken,
  verifyPassword,
  sessionCookieOptions,
} from "@/lib/auth";
import { recordServerEvent, deviceFromRequest } from "@/lib/server-events";

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function publicUser(row: { username: string; displayName: string; favorites: string; cart: string }) {
  return {
    username: row.username,
    displayName: row.displayName,
    favorites: safeParse<string[]>(row.favorites, []),
    cart: safeParse<{ slug: string; qty: number }[]>(row.cart, []),
  };
}

/** Visitor sign-in. POST { username, password } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const row = await db.user.findUnique({ where: { username } });
  if (!row || !verifyPassword(password, row.passwordHash)) {
    return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  }

  const res = NextResponse.json({ user: publicUser(row) });
  res.cookies.set(USER_COOKIE, makeUserToken(username), sessionCookieOptions());
  // Analytics: a sign-in is only recorded when analytics is enabled.
  await recordServerEvent("sign_in", {
    username,
    device: deviceFromRequest(req),
  });
  return res;
}
