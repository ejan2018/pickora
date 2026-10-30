"use client";

import { Heart, ShoppingCart, Trash2, Minus, Plus, ExternalLink } from "lucide-react";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { navigate } from "@/lib/router";
import { track } from "@/lib/track";
import { ProductCard } from "./ProductCard";
import { toast } from "./BackToTop";

export function FavoritesView({ products }: { products: Product[] }) {
  const { favorites } = useStore();
  const items = products.filter((p) => favorites.includes(p.slug));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow text-primary">Saved for later</p>
      <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">My Favorites</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved right here in your browser — no account needed.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground/80">No favorites yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tap the heart on any product and it will appear here.
          </p>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:brightness-110 active:scale-95"
          >
            Discover products
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onToast={toast} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CartView({ products }: { products: Product[] }) {
  const { cart, setQty, removeFromCart, clearCart, fmtPrice } = useStore();
  const rows = cart
    .map((item) => ({ item, product: products.find((p) => p.slug === item.slug) }))
    .filter((r): r is { item: { slug: string; qty: number }; product: Product } => Boolean(r.product));

  const subtotal = rows.reduce((sum, r) => sum + r.product.price * r.item.qty, 0);
  const savings = rows.reduce(
    (sum, r) => sum + (r.product.oldPrice ? (r.product.oldPrice - r.product.price) * r.item.qty : 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Shopping Cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length === 0
          ? "Your picks live in this browser"
          : "Your items — open each seller page to check out"}
      </p>

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground/80">Nothing here yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Your cart is empty. Fill it with finds from the shop — tap the cart icon on any
            product.
          </p>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:brightness-110 active:scale-95"
          >
            Browse products
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Rows */}
          <div className="space-y-3">
            {rows.map(({ item, product }) => (
              <div
                key={item.slug}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--card-shadow)] sm:gap-4 sm:p-4"
              >
                <a
                  href={`#/product/${product.slug}`}
                  className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24"
                >
                  { }
                  <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                </a>
                <div className="min-w-0 flex-1">
                  <a
                    href={`#/product/${product.slug}`}
                    className="line-clamp-2 text-sm font-semibold text-foreground/90 transition-colors hover:text-primary sm:text-base"
                  >
                    {product.title}
                  </a>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-base font-bold text-primary">
                      {fmtPrice(product.price)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {fmtPrice(product.oldPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <a
                    href={product.buyUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("buy_click", { slug: product.slug })}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Open seller page
                  </a>
                  <div className="inline-flex h-9 items-center rounded-full border border-border bg-background">
                    <button
                      type="button"
                      onClick={() => setQty(item.slug, item.qty - 1)}
                      aria-label="Decrease quantity"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-l-full text-foreground/70 transition-colors hover:text-primary"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.slug, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-r-full text-foreground/70 transition-colors hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromCart(item.slug);
                      toast("Removed from cart");
                    }}
                    aria-label={`Remove ${product.title} from cart`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] lg:sticky lg:top-32">
            <h2 className="eyebrow text-muted-foreground">SUMMARY</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd className="font-semibold">{rows.reduce((n, r) => n + r.item.qty, 0)}</dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">You save</dt>
                  <dd className="font-semibold text-chart-2">−{fmtPrice(savings)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-bold">Estimated total</dt>
                <dd className="font-extrabold text-primary">{fmtPrice(subtotal)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
            >
              Keep shopping
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              Checkout happens on each product&apos;s own page — the price there is always
              live.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  toast("Cart emptied");
                }}
                className="h-9 flex-1 rounded-full border border-border text-xs font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                Empty cart
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Tip: tap the heart on any product to save it for later — favorites live in
              your browser.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
