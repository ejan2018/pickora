import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializePopup } from "@/lib/server-data";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.type !== undefined)
    data.type = ["portrait", "wheel", "card"].includes(body.type) ? body.type : "card";
  if (body.layout !== undefined)
    data.layout = ["portrait", "landscape", "square"].includes(body.layout) ? body.layout : "portrait";
  if (body.title !== undefined) data.title = String(body.title);
  if (body.body !== undefined) data.body = String(body.body);
  if (body.mediaType !== undefined)
    data.mediaType = ["image", "video", "none"].includes(body.mediaType) ? body.mediaType : "image";
  if (body.media !== undefined) data.media = String(body.media);
  if (body.ctaLabel !== undefined) data.ctaLabel = String(body.ctaLabel);
  if (body.ctaUrl !== undefined) data.ctaUrl = String(body.ctaUrl);
  if (body.segments !== undefined)
    data.segments = JSON.stringify(Array.isArray(body.segments) ? body.segments.slice(0, 12) : []);
  if (body.delaySeconds !== undefined)
    data.delaySeconds = Math.max(0, Math.min(120, Number(body.delaySeconds) || 0));
  if (body.oncePerVisitor !== undefined) data.oncePerVisitor = Boolean(body.oncePerVisitor);
  if (body.active !== undefined) data.active = Boolean(body.active);

  const row = await db.popup.update({ where: { id }, data }).catch(() => null);
  if (!row) {
    return NextResponse.json({ error: "Popup not found." }, { status: 404 });
  }
  return NextResponse.json({ popup: serializePopup(row) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db.popup.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
