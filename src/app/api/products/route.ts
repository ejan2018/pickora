import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { serializeProduct, slugify } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const includeUnpublished = searchParams.get("all") === "1" && (await isOwner());

  const where: Record<string, unknown> = {};
  if (!includeUnpublished) where.published = true;
  if (category && category !== "All") where.category = category;
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    where.OR = [{ title: { contains: pattern } }, { description: { contains: pattern } }];
  }

  const rows = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: rows.map(serializeProduct) });
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  let slug: string = body.slug?.trim() || slugify(body.title);
  const exists = await db.product.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const row = await db.product.create({
    data: {
      slug,
      title: body.title.trim(),
      description: body.description ?? "",
      price: Number(body.price) || 0,
      oldPrice: body.oldPrice != null && body.oldPrice !== "" ? Number(body.oldPrice) : null,
      currency: body.currency || "USD",
      category: body.category || "Electronics",
      imageUrl: body.imageUrl || "",
      gallery: JSON.stringify(Array.isArray(body.gallery) ? body.gallery : []),
      buyUrl: body.buyUrl || "",
      badge: ["", "new", "featured"].includes(body.badge) ? body.badge : "",
      brand: String(body.brand ?? "").slice(0, 60),
      video: typeof body.video === "string" ? body.video : "",
      sold: Number(body.sold) || 0,
      rating: Number(body.rating) || 0,
      reviews: Number(body.reviews) || 0,
      published: Boolean(body.published ?? false),
    },
  });

  return NextResponse.json({ product: serializeProduct(row) }, { status: 201 });
}
