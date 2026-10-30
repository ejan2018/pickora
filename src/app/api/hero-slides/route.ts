import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeHeroSlide } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1" && (await isOwner());

  const rows = await db.heroSlide.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ slides: rows.map(serializeHeroSlide) });
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.media?.trim()) {
    return NextResponse.json(
      { error: "A slide needs an image or video — upload one or paste a URL." },
      { status: 400 }
    );
  }

  const count = await db.heroSlide.count();
  const row = await db.heroSlide.create({
    data: {
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : count,
      mediaType: body.mediaType === "video" ? "video" : "image",
      media: String(body.media).trim(),
      headline: String(body.headline ?? ""),
      subHeadline: String(body.subHeadline ?? ""),
      ctaLabel: String(body.ctaLabel ?? ""),
      ctaUrl: String(body.ctaUrl ?? ""),
      active: Boolean(body.active ?? true),
    },
  });

  return NextResponse.json({ slide: serializeHeroSlide(row) }, { status: 201 });
}
