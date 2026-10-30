import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const base = siteUrl.replace(/\/$/, "");

  try {
    const products = await db.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    return [
      { url: base, changeFrequency: "weekly", priority: 1 },
      ...products.map((p) => ({
        url: `${base}/#/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return [{ url: base, changeFrequency: "weekly", priority: 1 }];
  }
}
