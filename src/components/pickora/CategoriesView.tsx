"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { navigate, formatCount } from "@/lib/router";

export function CategoriesView({ products }: { products: Product[] }) {
  const categories = useMemo(() => {
    const map = new Map<string, { count: number; sold: number; image: string }>();
    for (const p of products) {
      const entry = map.get(p.category) || { count: 0, sold: 0, image: p.imageUrl };
      entry.count += 1;
      entry.sold += p.sold;
      map.set(p.category, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [products]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow text-primary">Every aisle</p>
      <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">All Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every aisle in the shop — pick a tile and start exploring.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map(([name, info]) => (
          <button
            key={name}
            type="button"
            onClick={() => navigate(`/products?category=${encodeURIComponent(name)}`)}
            className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
          >
            <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
              { }
              <img
                src={info.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {info.count} {info.count === 1 ? "item" : "items"}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 p-3.5">
              <span>
                <span className="block text-sm font-bold text-foreground group-hover:text-primary">
                  {name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatCount(info.sold)} sold
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
