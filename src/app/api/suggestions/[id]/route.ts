import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** PATCH /api/suggestions/[id] { hidden } — owner hides / unhides a shout. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const hidden = Boolean(body?.hidden);

  const row = await db.suggestion
    .update({ where: { id }, data: { hidden } })
    .catch(() => null);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/suggestions/[id] — owner removes a shout. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.suggestion.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
