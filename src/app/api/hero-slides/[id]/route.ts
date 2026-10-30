import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeHeroSlide } from "@/lib/server-data";

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
  if (body.order !== undefined) data.order = Number(body.order) || 0;
  if (body.mediaType !== undefined) data.mediaType = body.mediaType === "video" ? "video" : "image";
  if (body.media !== undefined) data.media = String(body.media).trim();
  if (body.headline !== undefined) data.headline = String(body.headline);
  if (body.subHeadline !== undefined) data.subHeadline = String(body.subHeadline);
  if (body.ctaLabel !== undefined) data.ctaLabel = String(body.ctaLabel);
  if (body.ctaUrl !== undefined) data.ctaUrl = String(body.ctaUrl);
  if (body.active !== undefined) data.active = Boolean(body.active);

  const row = await db.heroSlide.update({ where: { id }, data }).catch(() => null);
  if (!row) {
    return NextResponse.json({ error: "Slide not found." }, { status: 404 });
  }
  return NextResponse.json({ slide: serializeHeroSlide(row) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db.heroSlide.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
