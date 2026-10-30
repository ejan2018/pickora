"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { navigate } from "@/lib/router";

/**
 * Mini cart drawer (anon-ecommerce style) — opens from the header cart icon.
 * Full checkout flow stays on the cart page ("View full cart").
 */
export function CartDrawer({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}) {
  const { cart, setQty, removeFromCart, cartCount, fmtPrice } = useStore();

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const rows = cart
    .map((item) => ({ item, product: bySlug.get(item.slug) }))
    .filter((r): r is { item: { slug: string; qty: number }; product: Product } =>
      Boolean(r.product)
    );
  const subtotal = rows.reduce(
    (sum, r) => sum + r.product.price * r.item.qty,
    0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" />
            Your cart
            {cartCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            Saved here and on your account — checkout happens per item with the
            seller.
          </SheetDescription>
        </SheetHeader>

        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="text-5xl" role="img" aria-label="Empty cart">
              🛒
            </span>
            <p className="font-display text-lg font-bold">Your cart is empty</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Browse the shelves and tap the cart icon on anything you like.
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate("/products");
              }}
              className="btn-ink h-11 px-6 text-sm"
            >
              Keep shopping
            </button>
          </div>
        ) : (
          <>
            <div className="scrollbar-slim flex-1 overflow-y-auto px-3 py-3">
              {rows.map(({ item, product }) => (
                <div
                  key={item.slug}
                  className="mb-2 flex gap-3 rounded-xl border border-border bg-card p-2.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/product/${product.slug}`);
                    }}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                    aria-label={product.title}
                  >
                    <img
                      src={product.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">
                      {product.title}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-primary">
                      {fmtPrice(product.price)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(item.slug, item.qty - 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQty(item.slug, item.qty + 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {fmtPrice(product.price * item.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${product.title}`}
                    onClick={() => removeFromCart(item.slug)}
                    className="self-start rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-display text-lg font-extrabold text-primary">
                  {fmtPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Converted from USD · final price is set by the seller.
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/cart");
                }}
                className="btn-ink mt-3 h-11 w-full text-sm"
              >
                View full cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
