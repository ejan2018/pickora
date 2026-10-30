"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Zap,
  Star,
  ShieldCheck,
  Truck,
  Lock,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import type { Product, SiteSettings, StoreEvent, HeroSlide } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Shoutouts } from "./Shoutouts";
import { HeroCarousel } from "./HeroCarousel";
import { HomeWidgets } from "./PopupHost";
import { navigate, useReveal, formatCount, discountPercent } from "@/lib/router";
import { useStore } from "@/lib/store";
import { toast } from "./BackToTop";

const VALUE_PROPS = [
  { icon: ShieldCheck, label: "Safe payments" },
  { icon: Truck, label: "Secure logistics" },
  { icon: Lock, label: "Secure privacy" },
  { icon: BadgeCheck, label: "Purchase protection" },
];

const MARQUEE_ITEMS = [
  "HAND-PICKED FINDS",
  "CHECKED BEFORE LISTED",
  "NEW ITEMS EVERY WEEK",
  "CURATED, NOT SCRAPED",
];

const EVENT_COLORS: Record<string, { bg: string; fg: string }> = {
  violet: { bg: "#8b5cf6", fg: "#ffffff" },
  pink: { bg: "#ff3d5a", fg: "#ffffff" },
  cyan: { bg: "#06b6d4", fg: "#ffffff" },
  amber: { bg: "#ff6a00", fg: "#ffffff" },
  emerald: { bg: "#10b981", fg: "#ffffff" },
};

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function Section({
  title,
  subtitle,
  seeAllHref,
  children,
  reveal = true,
}: {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  children: React.ReactNode;
  reveal?: boolean;
}) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10" aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>
      <div ref={ref} className={reveal ? className : undefined}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 id={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`} className="font-display text-lg font-extrabold sm:text-xl">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {seeAllHref && (
            <a
              href={seeAllHref}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
            >
              See all <span aria-hidden="true">›</span>
            </a>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function FlashDealCard({ product, endsAt }: { product: Product; endsAt: number }) {
  const time = useCountdown(endsAt);
  const discount = discountPercent(product.price, product.oldPrice);
  const { fmtPrice } = useStore();
  return (
    <button
      type="button"
      onClick={() => navigate(`/product/${product.slug}`)}
      aria-label={product.title}
      className="group w-32 shrink-0 snap-start text-left sm:w-40"
    >
      <span className="relative block aspect-square overflow-hidden rounded-xl bg-muted">
        { }
        <img
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={product.imageUrl}
        />
        {discount !== null && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
            -{discount}%
          </span>
        )}
        <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <span>{formatCount(product.sold)} sold</span>
          <span className="font-mono tabular-nums text-[#facc15]">{time}</span>
        </span>
      </span>
      <span className="mt-1.5 flex items-baseline gap-1">
        <span className="text-base font-bold leading-none text-primary">
          {fmtPrice(product.price)}
        </span>
        {product.oldPrice && (
          <span className="text-[11px] leading-none text-muted-foreground line-through">
            {fmtPrice(product.oldPrice)}
          </span>
        )}
      </span>
      <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Star className="h-3 w-3 fill-[#ffb01f] text-[#ffb01f]" aria-hidden="true" />
        {product.rating.toFixed(1)}
        <span aria-hidden="true">·</span>
        <span className="truncate">{product.category}</span>
      </span>
    </button>
  );
}

export function HomeView({
  products,
  settings,
  events,
}: {
  products: Product[];
  settings: SiteSettings;
  events: StoreEvent[];
}) {
  const { fmtPrice } = useStore();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  useEffect(() => {
    fetch("/api/hero-slides")
      .then((r) => (r.ok ? r.json() : { slides: [] }))
      .then((d) => setHeroSlides(d.slides || []))
      .catch(() => setHeroSlides([]));
  }, []);

  const minPrice = useMemo(
    () => (products.length ? Math.min(...products.map((p) => p.price)) : 0),
    [products]
  );

  const activeEvent = useMemo(() => {
    const now = Date.now();
    return (
      events.find(
        (e) => e.active && new Date(e.startsAt).getTime() <= now && new Date(e.endsAt).getTime() > now
      ) || null
    );
  }, [events]);

  const flashDeals = useMemo(
    () =>
      products
        .filter((p) => p.oldPrice && p.oldPrice > p.price)
        .sort((a, b) => (b.oldPrice! - b.price) / b.oldPrice! - (a.oldPrice! - a.price) / a.oldPrice!),
    [products]
  );

  const trending = useMemo(
    () => products.filter((p) => p.badge === "featured"),
    [products]
  );

  const categories = useMemo(() => {
    // Fixed rail order matching the storefront; representative image = most-sold pick.
    const RAIL_ORDER = [
      "Electronics",
      "Gadgets",
      "Art",
      "Kitchen",
      "Beauty",
      "Fitness",
      "Lifestyle",
      "Accessories",
    ];
    return RAIL_ORDER.map((name) => {
      const inCat = products.filter((p) => p.category === name);
      const rep = inCat.length
        ? inCat.reduce((a, b) => (b.sold > a.sold ? b : a))
        : null;
      return rep
        ? { name, image: rep.imageUrl, count: inCat.length }
        : null;
    }).filter((x): x is { name: string; image: string; count: number } => Boolean(x));
  }, [products]);

  const eventCountdown = useCountdown(activeEvent ? new Date(activeEvent.endsAt).getTime() : 0);
  const eventColor = EVENT_COLORS[activeEvent?.color || "orange"] || EVENT_COLORS.orange;

  return (
    <>
      {/* Hero — owner-configurable carousel (falls back to the classic hero) */}
      <section aria-label="Welcome" className="bg-card pb-2 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <HeroCarousel
            slides={heroSlides}
            fallbackHeadline={settings.homeTitle}
            fallbackSubtitle={settings.homeSubtitle}
            fallbackPriceLine={`Starting from ${fmtPrice(minPrice)}`}
          />
        </div>
      </section>

      {/* Value props */}
      <section aria-label="Why shop here" className="bg-card py-4">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 sm:grid-cols-4 sm:gap-3 sm:px-6">
          {VALUE_PROPS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate text-xs font-bold text-foreground/80">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Owner-made ad widgets (dashboard → Media & Popups) */}
      <HomeWidgets />

      {/* Categories */}
      <Section title="Categories" seeAllHref="#/categories">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-6 lg:grid-cols-8">
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
              aria-label={`Shop ${cat.name}`}
              className="group flex w-20 shrink-0 flex-col items-center gap-2"
            >
              <span className="block aspect-square w-full overflow-hidden rounded-full border border-border bg-muted shadow-[var(--card-shadow)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--card-shadow-hover)]">
                <img
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={cat.image}
                />
              </span>
              <span className="w-full truncate text-center text-xs font-semibold text-foreground/80 group-hover:text-primary">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section aria-labelledby="deals-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="reveal reveal-in flex items-center justify-between gap-3 rounded-t-2xl bg-gradient-to-r from-[#e11d48] via-[#ff3d5a] to-[#e11d48] px-4 py-3 sm:px-6">
              <h2 id="deals-heading" className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
                <Zap className="h-5 w-5 fill-[#facc15] text-[#facc15]" aria-hidden="true" />
                Flash Deals
                <span className="hidden text-xs font-bold text-white/80 sm:inline">
                  Limited time offer
                </span>
              </h2>
              {activeEvent && (
                <span className="flex items-center gap-2">
                  <span className="hidden text-[11px] font-bold uppercase tracking-wider text-white/80 sm:inline">
                    Ends in
                  </span>
                  <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-sm font-bold tabular-nums text-white">
                    {eventCountdown}
                  </span>
                </span>
              )}
            </div>
            <div className="overflow-hidden rounded-b-2xl border border-t-0 border-border bg-card">
              <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto p-3 sm:p-4">
                {flashDeals.map((p) => (
                  <FlashDealCard
                    key={p.id}
                    product={p}
                    endsAt={activeEvent ? new Date(activeEvent.endsAt).getTime() : Date.now() + 36e5 * 8}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Active event banner */}
      {activeEvent && (
        <section aria-label={`Special event: ${activeEvent.title}`} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="reveal reveal-in flex flex-col items-start gap-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow"
                style={{ background: eventColor.bg }}
              >
                <Zap className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow" style={{ color: eventColor.bg === "#f59e0b" ? "#b45309" : eventColor.bg }}>
                  Limited-time offer
                </p>
                <h3 className="mt-1.5 font-display text-lg font-bold leading-snug">
                  {activeEvent.title}
                </h3>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {activeEvent.subtitle}
                </p>
              </div>
            </div>
            <div className="flex gap-2" role="timer" aria-label="Time remaining">
              {(() => {
                const diff = Math.max(0, new Date(activeEvent.endsAt).getTime() - Date.now());
                const parts = [
                  { label: "DAYS", value: Math.floor(diff / 86400000) },
                  { label: "HRS", value: Math.floor((diff % 86400000) / 3600000) },
                  { label: "MIN", value: Math.floor((diff % 3600000) / 60000) },
                  { label: "SEC", value: Math.floor((diff % 60000) / 1000) },
                ];
                return parts.map((p) => (
                  <div
                    key={p.label}
                    className="flex w-14 flex-col items-center rounded-xl bg-background py-2"
                  >
                    <span className="font-mono text-lg font-bold tabular-nums">
                      {String(p.value).padStart(2, "0")}
                    </span>
                    <span className="eyebrow mt-0.5 text-[9px] text-muted-foreground">{p.label}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Recommended */}
      <Section
        title="Recommended for you"
        subtitle={`${products.length} hand-checked finds in stock`}
        seeAllHref="#/products"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} onToast={toast} />
          ))}
        </div>
      </Section>

      {/* Trending */}
      {trending.length > 0 && (
        <Section
          title="Trending now"
          subtitle="What everyone is eyeing this week"
          seeAllHref="#/collection/trending"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} onToast={toast} />
            ))}
          </div>
        </Section>
      )}

      {/* Shoutouts & suggestions (real visitor comments) */}
      <Shoutouts />

      {/* Marquee strip */}
      <section aria-label="Store promises" className="mt-4 overflow-hidden border-y border-border bg-primary py-3">
        <div className="flex w-max animate-marquee gap-16 whitespace-nowrap will-change-transform">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center gap-16"
            >
              {MARQUEE_ITEMS.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-16 text-xs font-bold tracking-[0.18em] text-primary-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
