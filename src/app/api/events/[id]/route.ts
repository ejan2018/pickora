import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeEvent } from "@/lib/server-data";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await db.storeEvent.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = String(body.title).trim();
  if (body.subtitle != null) data.subtitle = String(body.subtitle);
  if (body.emoji != null) data.emoji = String(body.emoji).slice(0, 8);
  if (body.color != null) data.color = String(body.color);
  if (body.startsAt != null) data.startsAt = new Date(body.startsAt);
  if (body.endsAt != null) data.endsAt = new Date(body.endsAt);
  if (body.active !== undefined) data.active = Boolean(body.active);

  const updated = await db.storeEvent.update({ where: { id }, data });
  return NextResponse.json({ event: serializeEvent(updated) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await db.storeEvent.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  await db.storeEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
