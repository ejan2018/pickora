import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  USER_COOKIE,
  makeUserToken,
  hashPassword,
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

function publicUser(row: {
  username: string;
  displayName: string;
  favorites: string;
  cart: string;
  country: string | null;
}) {
  return {
    username: row.username,
    displayName: row.displayName,
    favorites: safeParse<string[]>(row.favorites, []),
    cart: safeParse<{ slug: string; qty: number }[]>(row.cart, []),
    country: row.country || null,
  };
}

/** Create a visitor account. POST { username, password, displayName?, country? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const displayName = String(body?.displayName || "").trim();
  const country = String(body?.country || "").trim().toUpperCase();
  const validCountry = /^[A-Z]{2}$/.test(country) ? country : null;

  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    return NextResponse.json(
      { error: "Usernames use 3–24 letters, numbers, dot, dash or underscore." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password needs at least 6 characters." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  const row = await db.user.create({
    data: {
      username,
      displayName: displayName.slice(0, 40),
      passwordHash: hashPassword(password),
      country: validCountry,
    },
  });

  const res = NextResponse.json({ user: publicUser(row) }, { status: 201 });
  res.cookies.set(USER_COOKIE, makeUserToken(username), sessionCookieOptions());
  // Analytics: a brand-new account also counts as a sign-in.
  await recordServerEvent("sign_up", {
    username,
    device: deviceFromRequest(req),
  });
  await recordServerEvent("sign_in", {
    username,
    device: deviceFromRequest(req),
  });
  return res;
}
