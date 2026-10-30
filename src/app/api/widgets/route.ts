import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeWidget } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1" && (await isOwner());

  const rows = await db.customWidget.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ widgets: rows.map(serializeWidget) });
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Give the widget a name (only you see it)." }, { status: 400 });
  }
  if (!String(body.html ?? "").trim()) {
    return NextResponse.json({ error: "Add some HTML first." }, { status: 400 });
  }

  const row = await db.customWidget.create({
    data: {
      name: String(body.name).trim(),
      html: String(body.html ?? ""),
      css: String(body.css ?? ""),
      js: String(body.js ?? ""),
      placement: body.placement === "home" ? "home" : "popup",
      delaySeconds: Math.max(0, Math.min(120, Number(body.delaySeconds) || 5)),
      active: Boolean(body.active ?? true),
    },
  });

  return NextResponse.json({ widget: serializeWidget(row) }, { status: 201 });
}
