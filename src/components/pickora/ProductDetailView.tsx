"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  ExternalLink,
  Copy,
  Unlock,
  ShieldCheck,
  Truck,
  RefreshCw,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { toast } from "./BackToTop";
import { useStore } from "@/lib/store";
import { navigate, formatCount, discountPercent } from "@/lib/router";
import { track } from "@/lib/track";

function useIsOwner() {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean }) => {
        if (alive) setOwner(Boolean(d.authenticated));
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, []);
  return owner;
}

export function ProductDetailView({ product, related }: { product: Product; related: Product[] }) {
  const { isFavorite, toggleFavorite, addToCart, cartQty, setQty, fmtPrice, countryInfo, currencyCode } = useStore();
  const isOwner = useIsOwner();
  const [imageIndex, setImageIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [qty, setQtyLocal] = useState(1);

  const gallery = useMemo(() => {
    const list = [product.imageUrl, ...(product.gallery || [])].filter(
      (v, i, arr) => v && arr.indexOf(v) === i
    );
    return list.length ? list : [product.imageUrl];
  }, [product]);

  // Optional product video sits as the final gallery slide.
  const hasVideo = Boolean(product.video);
  const total = gallery.length + (hasVideo ? 1 : 0);
  const showingVideo = hasVideo && imageIndex >= gallery.length;

  useEffect(() => {
    // Reset viewer state when navigating between products.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageIndex(0);
    setUnlocked(false);
    setQtyLocal(1);
    track("product_view", { slug: product.slug });
  }, [product.slug]);

  const discount = discountPercent(product.price, product.oldPrice);
  const fav = isFavorite(product.slug);
  const inCart = cartQty(product.slug);

  const prev = () => setImageIndex((i) => (i - 1 + total) % total);
  const next = () => setImageIndex((i) => (i + 1) % total);

  const unlock = () => {
    setUnlocked(true);
    track("link_click", { slug: product.slug });
    toast("Link unlocked — here's your item");
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/product/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard");
      }
    } catch {
      /* dismissed */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(product.buyUrl);
      toast("Copied");
    } catch {
      toast("Could not copy");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <a href="#/" className="transition-colors hover:text-primary">
              Home
            </a>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <a
              href={`#/products?category=${encodeURIComponent(product.category)}`}
              className="transition-colors hover:text-primary"
            >
              {product.category}
            </a>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <span aria-current="page" className="font-semibold text-foreground/80">
              {product.title}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-[var(--card-shadow)]">
            { }
            {showingVideo ? (
              <video
                src={product.video}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
                aria-label={`${product.title} video`}
              />
            ) : (
              <img
                src={gallery[Math.min(imageIndex, gallery.length - 1)]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            )}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur-sm">
                  {imageIndex + 1} / {total}
                </span>
              </>
            )}
          </div>
          {total > 1 && (
            <div className="mt-3 flex gap-2">
              {gallery.map((g, i) => (
                <button
                  key={`${g}-${i}`}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Image ${i + 1}`}
                  aria-current={i === imageIndex}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                    i === imageIndex ? "border-primary shadow-md" : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  { }
                  <img src={g} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
              {hasVideo && (
                <button
                  type="button"
                  onClick={() => setImageIndex(gallery.length)}
                  aria-label="Product video"
                  aria-current={showingVideo}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 bg-[#12141c] transition-all ${
                    showingVideo ? "border-primary shadow-md" : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center text-white"
                  >
                    ▶
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {product.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-extrabold text-primary">
              {fmtPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {fmtPrice(product.oldPrice)}
              </span>
            )}
            {discount !== null && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                -{discount}%
              </span>
            )}
          </div>
          {countryInfo && currencyCode !== "USD" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Converted to {currencyCode} for {countryInfo.name} · live rate, final
              price is set by the seller
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
              <Star className="h-4 w-4 fill-[#ffb01f] text-[#ffb01f]" aria-hidden="true" />
              {product.rating.toFixed(1)}
              {product.reviews > 0 && (
                <span className="font-normal text-muted-foreground">
                  ({product.reviews.toLocaleString("en-US")} reviews)
                </span>
              )}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatCount(product.sold)} sold</span>
            {product.brand && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-foreground/70">{product.brand}</span>
              </>
            )}
          </div>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground/80 sm:text-base">
            {product.description}
          </p>

          {/* View It — unlock the product link */}
          <div className="mt-6">
            {!unlocked ? (
              <button
                type="button"
                onClick={unlock}
                className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-95 sm:w-auto"
              >
                <Unlock className="h-4 w-4" aria-hidden="true" />
                View It
              </button>
            ) : (
              <div
                role="region"
                aria-label="Product link"
                className="w-full max-w-sm rounded-2xl border border-primary/30 bg-accent p-4"
              >
                <p className="text-sm font-bold text-accent-foreground">
                  Link unlocked — here&apos;s your item
                </p>
                <div className="mt-2.5 flex gap-2">
                  <a
                    href={product.buyUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("buy_click", { slug: product.slug })}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform hover:brightness-110 active:scale-95"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open product page
                  </a>
                  <button
                    type="button"
                    onClick={copyLink}
                    aria-label="Copy link"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  Opens the seller&apos;s secure product page — the price there is always
                  live and up to date.
                </p>
              </div>
            )}
          </div>

          {/* Quantity + actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-11 items-center rounded-full border border-border bg-card">
              <button
                type="button"
                onClick={() => setQtyLocal((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="inline-flex h-11 w-11 items-center justify-center rounded-l-full text-foreground/80 transition-colors hover:text-primary"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span aria-live="polite" className="w-10 text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQtyLocal((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
                className="inline-flex h-11 w-11 items-center justify-center rounded-r-full text-foreground/80 transition-colors hover:text-primary"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (inCart) setQty(product.slug, inCart + qty);
                else addToCart(product.slug, qty);
                track("cart_add", { slug: product.slug });
                toast("Added to cart");
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Add to cart
            </button>

            <button
              type="button"
              onClick={() => {
                toggleFavorite(product.slug);
                toast(fav ? "Removed from favorites" : "Added to favorites ❤");
              }}
              aria-pressed={fav}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors active:scale-95 ${
                fav
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:border-primary hover:text-primary"
              }`}
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={share}
              aria-label="Share this product"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary active:scale-95"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Press View It to unlock the product page link — signing up is optional.
          </p>

          {/* Owner-only quick edit hint */}
          {isOwner && (
            <div className="mt-4 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
              Owner view · added {new Date(product.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
              <a href="#/admin" className="font-semibold text-foreground underline underline-offset-2">
                edit in dashboard
              </a>
            </div>
          )}

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
            {[
              { icon: Truck, title: "Free shipping", sub: "on selected picks" },
              { icon: ShieldCheck, title: "Safe payments", sub: "protected checkout" },
              { icon: RefreshCw, title: "Live pricing", sub: "updated at the seller" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-1 rounded-xl bg-muted p-3 text-center">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="text-xs font-bold text-foreground/80">{title}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="related-heading" className="font-display text-lg font-extrabold">
              You may also like
            </h2>
            <a
              href={`#/products?category=${encodeURIComponent(product.category)}`}
              className="text-sm font-semibold text-primary transition-colors hover:underline"
            >
              See all ›
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onToast={toast} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
