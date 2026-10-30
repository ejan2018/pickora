import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeEvent } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1" && (await isOwner());

  const rows = await db.storeEvent.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const events = rows
    .map(serializeEvent)
    .filter(
      (e) =>
        includeInactive ||
        (new Date(e.startsAt).getTime() <= now && new Date(e.endsAt).getTime() > now)
    );

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const row = await db.storeEvent.create({
    data: {
      title: String(body.title).trim(),
      subtitle: String(body.subtitle ?? ""),
      emoji: String(body.emoji ?? "⚡").slice(0, 8),
      color: String(body.color ?? "amber"),
      startsAt: new Date(body.startsAt || Date.now()),
      endsAt: new Date(body.endsAt || Date.now() + 7 * 86400_000),
      active: Boolean(body.active ?? true),
    },
  });

  return NextResponse.json({ event: serializeEvent(row) }, { status: 201 });
}
