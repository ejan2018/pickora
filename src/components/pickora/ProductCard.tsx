"use client";

import { memo, useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { navigate, formatCount, discountPercent } from "@/lib/router";
import { useStore } from "@/lib/store";
import { track } from "@/lib/track";
import { QuickView, QuickViewPill } from "./QuickView";

function BadgeChip({ badge }: { badge: string }) {
  if (badge === "new")
    return (
      <span className="rounded-md bg-neon-2 px-1.5 py-0.5 text-[10px] font-bold leading-none text-black shadow-sm">
        New
      </span>
    );
  if (badge === "featured")
    return (
      <span className="rounded-md bg-neon-1 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
        ★ Hot
      </span>
    );
  return null;
}

export const ProductCard = memo(function ProductCard({
  product,
  onToast,
}: {
  product: Product;
  onToast?: (msg: string) => void;
}) {
  const { isFavorite, toggleFavorite, addToCart, fmtPrice } = useStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const discount = discountPercent(product.price, product.oldPrice);
  const fav = isFavorite(product.slug);

  const go = () => navigate(`/product/${product.slug}`);

  const onQuick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickOpen(true);
    track("product_view", { slug: product.slug });
  };

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.slug);
    onToast?.(fav ? "Removed from favorites" : "Added to favorites ❤");
  };

  const onCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.slug, 1);
    track("cart_add", { slug: product.slug });
    onToast?.("Added to cart");
  };

  return (
    <article className="neon-hover group relative flex h-full flex-col rounded-xl border border-border bg-card shadow-[var(--card-shadow)] transition-shadow hover:shadow-[var(--card-shadow-hover)]">
      <a
        href={`#/product/${product.slug}`}
        aria-label={product.title}
        className="relative block aspect-square w-full overflow-hidden rounded-t-xl bg-muted"
      >
        { }
        <img
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          src={product.imageUrl}
        />
        <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
          {discount !== null && (
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
              -{discount}%
            </span>
          )}
          <BadgeChip badge={product.badge} />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1.5 -translate-x-1/2 opacity-80">
          <span className="flex h-3 items-end rounded-full bg-black/25 px-1 py-0.5 backdrop-blur-[2px]">
            <span className="inline-flex h-2 items-end gap-[2px]" aria-hidden="true">
              <span className="eq-bar" style={{ height: "100%", ["--eq-color" as string]: "var(--neon-2)" }} />
              <span className="eq-bar" style={{ height: "100%", ["--eq-color" as string]: "var(--neon-3)" }} />
              <span className="eq-bar" style={{ height: "100%", ["--eq-color" as string]: "var(--glow)" }} />
              <span className="eq-bar" style={{ height: "100%", ["--eq-color" as string]: "var(--neon-1)" }} />
              <span className="eq-bar" style={{ height: "100%", ["--eq-color" as string]: "var(--neon-2)" }} />
            </span>
          </span>
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={onFav}
          onKeyDown={(e) => e.key === "Enter" && onFav(e as unknown as React.MouseEvent)}
          aria-hidden={false}
          className={`absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all hover:scale-105 active:scale-95 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
            fav ? "bg-primary text-primary-foreground" : "bg-white/95 text-neutral-800"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} aria-hidden="true" />
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label="Add to cart"
          onClick={onCart}
          onKeyDown={(e) => e.key === "Enter" && onCart(e as unknown as React.MouseEvent)}
          className="absolute bottom-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md transition-all hover:scale-105 active:scale-95 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <QuickViewPill onClick={onQuick} />
      </a>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <a
          href={`#/product/${product.slug}`}
          onClick={go}
          className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/90 transition-colors hover:text-primary"
        >
          {product.title}
        </a>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[17px] font-bold leading-none text-primary">
            {fmtPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs leading-none text-muted-foreground line-through">
              {fmtPrice(product.oldPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 pt-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 font-semibold text-foreground/80">
            <Star className="h-3 w-3 fill-[#ffb01f] text-[#ffb01f]" aria-hidden="true" />
            {product.rating.toFixed(1)}
            {product.reviews > 0 && (
              <span className="font-normal text-muted-foreground">
                ({formatCount(product.reviews)})
              </span>
            )}
          </span>
          <span className="truncate">{formatCount(product.sold)} sold</span>
        </div>
        {product.brand && (
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
            {product.brand}
          </p>
        )}
      </div>

      {quickOpen && (
        <QuickView
          product={product}
          open={quickOpen}
          onOpenChange={setQuickOpen}
          onToast={onToast}
        />
      )}
    </article>
  );
});
