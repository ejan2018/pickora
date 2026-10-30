import { NextResponse } from "next/server";
import { USER_COOKIE, sessionCookieOptions } from "@/lib/auth";

/** Visitor sign-out. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
