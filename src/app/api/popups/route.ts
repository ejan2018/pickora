import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializePopup } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1" && (await isOwner());

  const rows = await db.popup.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ popups: rows.map(serializePopup) });
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Give the popup a name (only you see it)." }, { status: 400 });
  }

  const row = await db.popup.create({
    data: {
      name: String(body.name).trim(),
      type: ["portrait", "wheel", "card"].includes(body.type) ? body.type : "card",
      layout: ["portrait", "landscape", "square"].includes(body.layout) ? body.layout : "portrait",
      title: String(body.title ?? ""),
      body: String(body.body ?? ""),
      mediaType: ["image", "video", "none"].includes(body.mediaType) ? body.mediaType : "image",
      media: String(body.media ?? ""),
      ctaLabel: String(body.ctaLabel ?? ""),
      ctaUrl: String(body.ctaUrl ?? ""),
      segments: JSON.stringify(Array.isArray(body.segments) ? body.segments.slice(0, 12) : []),
      delaySeconds: Math.max(0, Math.min(120, Number(body.delaySeconds) || 5)),
      oncePerVisitor: Boolean(body.oncePerVisitor ?? true),
      active: Boolean(body.active ?? true),
    },
  });

  return NextResponse.json({ popup: serializePopup(row) }, { status: 201 });
}
