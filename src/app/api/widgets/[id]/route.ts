import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeWidget } from "@/lib/server-data";

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
  if (body.html !== undefined) data.html = String(body.html);
  if (body.css !== undefined) data.css = String(body.css);
  if (body.js !== undefined) data.js = String(body.js);
  if (body.placement !== undefined) data.placement = body.placement === "home" ? "home" : "popup";
  if (body.delaySeconds !== undefined)
    data.delaySeconds = Math.max(0, Math.min(120, Number(body.delaySeconds) || 0));
  if (body.active !== undefined) data.active = Boolean(body.active);

  const row = await db.customWidget.update({ where: { id }, data }).catch(() => null);
  if (!row) {
    return NextResponse.json({ error: "Widget not found." }, { status: 404 });
  }
  return NextResponse.json({ widget: serializeWidget(row) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db.customWidget.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
