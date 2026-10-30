"use client";

import { Eye, Heart, ShoppingCart, Star, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { navigate, formatCount } from "@/lib/router";
import { track } from "@/lib/track";

/** Quick view modal — peek at a product without leaving the grid. */
export function QuickView({
  product,
  open,
  onOpenChange,
  onToast,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToast?: (msg: string) => void;
}) {
  const { isFavorite, toggleFavorite, addToCart, fmtPrice } = useStore();
  const fav = isFavorite(product.slug);

  const goFull = () => {
    onOpenChange(false);
    navigate(`/product/${product.slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div className="grid sm:grid-cols-2">
          <button
            type="button"
            onClick={goFull}
            aria-label={`Open ${product.title} details`}
            className="relative block aspect-square w-full bg-muted sm:aspect-auto sm:h-full"
          >
            {product.video ? (
              <video
                src={product.video}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                aria-label={`${product.title} video`}
              />
            ) : (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            )}
          </button>
          <div className="flex flex-col gap-3 p-5 sm:p-6">
            <DialogHeader className="space-y-0 text-left">
              <p className="eyebrow text-muted-foreground">{product.category}</p>
              <DialogTitle className="mt-1.5 pr-6 font-display text-xl font-extrabold leading-snug">
                {product.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Quick view of {product.title}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-2xl font-extrabold text-primary">
                {fmtPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {fmtPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                <Star className="h-3.5 w-3.5 fill-[#ffb01f] text-[#ffb01f]" aria-hidden="true" />
                {product.rating.toFixed(1)}
                {product.reviews > 0 && (
                  <span className="font-normal">({formatCount(product.reviews)})</span>
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatCount(product.sold)} sold</span>
            </div>

            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  addToCart(product.slug, 1);
                  track("cart_add", { slug: product.slug });
                  onToast?.("Added to cart");
                }}
                className="btn-ink h-11 w-full text-sm"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Add to cart
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goFull}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-border text-sm font-bold transition-colors hover:border-primary hover:text-primary"
                >
                  Full details
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => {
                    toggleFavorite(product.slug);
                    onToast?.(fav ? "Removed from favorites" : "Added to favorites ❤");
                  }}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:border-primary active:scale-95 ${
                    fav
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground/80 hover:text-primary"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Hover pill shown on product cards (desktop). */
export function QuickViewPill({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Quick view"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick(e as unknown as React.MouseEvent);
      }}
      className="pointer-events-auto absolute inset-x-0 bottom-14 mx-auto hidden w-fit items-center gap-1.5 rounded-full bg-black/55 px-3.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg backdrop-blur-md transition-all hover:bg-black/75 active:scale-95 md:inline-flex md:translate-y-1 md:group-hover:translate-y-0 md:group-hover:opacity-100"
    >
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      Quick view
    </span>
  );
}
