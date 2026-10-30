import { NextRequest, NextResponse } from "next/server";
import {
  isOwner,
  verifyPassword,
  hashPassword,
  setOwnerPasswordHash,
} from "@/lib/auth";

/** Owner password change. POST { currentPassword, newPassword } */
export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const current = body?.currentPassword;
  const next = body?.newPassword;
  if (typeof current !== "string" || typeof next !== "string" || next.length < 6) {
    return NextResponse.json(
      { error: "New password needs at least 6 characters." },
      { status: 400 }
    );
  }

  const ok = verifyPassword(current, await setOrGetHash());
  if (!ok) {
    return NextResponse.json({ error: "Current password is wrong." }, { status: 401 });
  }

  await setOwnerPasswordHash(hashPassword(next));
  return NextResponse.json({ ok: true });
}

async function setOrGetHash() {
  const { getOwnerPasswordHash } = await import("@/lib/auth");
  return getOwnerPasswordHash();
}
