import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeProduct } from "@/lib/server-data";

async function findProduct(idOrSlug: string) {
  return (
    await db.product.findUnique({ where: { id: idOrSlug } }).catch(() => null) ||
    db.product.findUnique({ where: { slug: idOrSlug } })
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await params;
  const row = await findProduct(idOrSlug);
  if (!row || (!row.published && !(await isOwner()))) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ product: serializeProduct(row) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { idOrSlug } = await params;
  const row = await findProduct(idOrSlug);
  if (!row) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = String(body.title).trim();
  if (body.description != null) data.description = String(body.description);
  if (body.price != null) data.price = Number(body.price) || 0;
  if (body.oldPrice !== undefined) {
    data.oldPrice = body.oldPrice === null || body.oldPrice === "" ? null : Number(body.oldPrice);
  }
  if (body.currency != null) data.currency = String(body.currency) || "USD";
  if (body.category != null) data.category = String(body.category);
  if (body.imageUrl != null) data.imageUrl = String(body.imageUrl);
  if (body.gallery !== undefined) {
    data.gallery = JSON.stringify(Array.isArray(body.gallery) ? body.gallery : []);
  }
  if (body.buyUrl != null) data.buyUrl = String(body.buyUrl);
  if (body.badge !== undefined) {
    data.badge = ["", "new", "featured"].includes(body.badge) ? body.badge : "";
  }
  if (body.brand !== undefined) data.brand = String(body.brand ?? "").slice(0, 60);
  if (body.video !== undefined) data.video = typeof body.video === "string" ? body.video : "";
  if (body.sold != null) data.sold = Number(body.sold) || 0;
  if (body.rating != null) data.rating = Number(body.rating) || 0;
  if (body.reviews != null) data.reviews = Number(body.reviews) || 0;
  if (body.published !== undefined) data.published = Boolean(body.published);

  const updated = await db.product.update({ where: { id: row.id }, data });
  return NextResponse.json({ product: serializeProduct(updated) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { idOrSlug } = await params;
  const row = await findProduct(idOrSlug);
  if (!row) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  await db.product.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}
