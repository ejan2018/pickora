import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/server-data";

/** Autocomplete for the storefront search box. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  if (!q) return NextResponse.json({ products: [], categories: [] });

  const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const rows = await db.product.findMany({
    where: {
      published: true,
      OR: [{ title: { contains: pattern } }, { description: { contains: pattern } }],
    },
    take: 6,
    orderBy: { sold: "desc" },
  });

  const products = rows.map((r) => {
    const p = serializeProduct(r);
    return {
      slug: p.slug,
      title: p.title,
      imageUrl: p.imageUrl,
      price: p.price,
      currency: p.currency,
    };
  });

  // Category suggestions come from every published product's category
  // (not just the matched ones) so "ele" surfaces Electronics even when
  // no product title matched.
  const categoryRows = await db.product.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ["category"],
  });
  const categories = categoryRows
    .map((r) => r.category)
    .filter((c) => c.toLowerCase().includes(q))
    .sort();

  return NextResponse.json({ products, categories });
}
