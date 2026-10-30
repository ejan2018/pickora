"use client";

import { useMemo, useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, PackageSearch, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { toast } from "./BackToTop";
import { navigate } from "@/lib/router";
import { useStore } from "@/lib/store";

type SortKey =
  | "newest"
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "sold"
  | "name";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  featured: "Featured first",
  "price-asc": "Price: low → high",
  "price-desc": "Price: high → low",
  rating: "Top rated",
  sold: "Most sold",
  name: "Name A → Z",
};

export function CatalogView({
  products,
  title,
  subtitle,
  eyebrow,
  initialCategory = "All",
  emptyTitle,
  emptyHint,
  searchMode = false,
}: {
  products: Product[];
  title: string;
  subtitle?: string;
  eyebrow?: string;
  initialCategory?: string;
  emptyTitle?: string;
  emptyHint?: string;
  searchMode?: boolean;
}) {
  const { fmtPrice } = useStore();
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* ── Real data bounds (never invented) ─────────────────────── */
  const priceCap = useMemo(
    () => Math.max(100, ...products.map((p) => Math.ceil(p.price))),
    [products]
  );
  const priceFloor = useMemo(
    () => (products.length ? Math.max(1, Math.floor(Math.min(...products.map((p) => p.price)))) : 1),
    [products]
  );

  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const effectiveMin = minPrice ?? priceFloor;
  const effectiveMax = maxPrice ?? priceCap;

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["All", ...[...set].sort()];
  }, [products]);

  /* Brand / company options come from the actual catalogue. */
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const b = (p.brand || "").trim();
      if (b) map.set(b, (map.get(b) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [products]);
  const [brandSel, setBrandSel] = useState<string[]>([]);

  const toggleBrand = (b: string) =>
    setBrandSel((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  /* Rating options only show when real products would match. */
  const ratingOptions = useMemo(() => {
    const max = products.reduce((m, p) => Math.max(m, p.rating), 0);
    return [4.5, 4, 3].filter((r) => r <= max);
  }, [products]);
  const [minRating, setMinRating] = useState(0);

  /* Keep the selected category in sync with the route-provided value. */
  useEffect(() => {
     
    setCategory(initialCategory);
  }, [initialCategory]);

  const visible = useMemo(() => {
    let list = products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        p.price >= effectiveMin &&
        p.price <= effectiveMax &&
        (brandSel.length === 0 || brandSel.includes((p.brand || "").trim())) &&
        p.rating >= minRating
    );
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "name":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        break;
      case "sold":
        list = [...list].sort((a, b) => b.sold - a.sold);
        break;
      case "featured":
        list = [...list].sort(
          (a, b) =>
            (b.badge === "featured" ? 1 : 0) - (a.badge === "featured" ? 1 : 0) ||
            b.sold - a.sold
        );
        break;
      default:
        list = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return list;
  }, [products, category, effectiveMin, effectiveMax, brandSel, minRating, sort]);

  const resetFilters = () => {
    setCategory("All");
    setMinPrice(null);
    setMaxPrice(null);
    setBrandSel([]);
    setMinRating(0);
  };

  const activeFilterCount =
    (minPrice !== null ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    brandSel.length +
    (minRating > 0 ? 1 : 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Category chips */}
      <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              if (c !== "All") navigate(`/products?category=${encodeURIComponent(c)}`, { replace: true });
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              category === c
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Heading */}
      <div className="mb-6">
        {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
        <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside
          aria-label="Product filters"
          className={`${filtersOpen ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-60`}
        >
          <div className="max-h-none rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-4 scrollbar-slim">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="eyebrow text-muted-foreground">FILTERS</h3>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            <h4 className="eyebrow mb-2 text-muted-foreground">CATEGORY</h4>
            <div className="flex flex-col gap-1">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    category === c
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Price range (bounds from the real catalogue) */}
            <h4 className="eyebrow mb-2 mt-6 text-muted-foreground">PRICE RANGE</h4>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <span className="sr-only">Minimum price</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={priceFloor}
                  max={effectiveMax}
                  value={minPrice ?? ""}
                  placeholder={String(priceFloor)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMinPrice(v === "" ? null : Math.max(priceFloor, Number(v) || priceFloor));
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm tabular-nums outline-none focus:border-primary"
                />
              </label>
              <span aria-hidden="true" className="text-xs text-muted-foreground">to</span>
              <label className="flex-1">
                <span className="sr-only">Maximum price</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={effectiveMin}
                  max={priceCap}
                  value={maxPrice ?? ""}
                  placeholder={String(priceCap)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMaxPrice(v === "" ? null : Math.min(priceCap, Number(v) || priceCap));
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm tabular-nums outline-none focus:border-primary"
                />
              </label>
            </div>
            <input
              type="range"
              min={priceFloor}
              max={priceCap}
              value={effectiveMax}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Maximum price"
              className="pk-range mt-3 w-full"
              style={{
                ["--fill" as string]: `${((effectiveMax - priceFloor) / Math.max(1, priceCap - priceFloor)) * 100}%`,
              }}
            />
            <div className="mt-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
              <span>{fmtPrice(effectiveMin)}</span>
              <span className="font-bold text-primary">
                {effectiveMax >= priceCap ? `${fmtPrice(priceCap)}+` : fmtPrice(effectiveMax)}
              </span>
            </div>

            {/* Brand / company — real brands with real counts */}
            {brands.length > 0 && (
              <>
                <h4 className="eyebrow mb-2 mt-6 text-muted-foreground">BRAND</h4>
                <div className="flex flex-col gap-1">
                  {brands.map(([b, count]) => (
                    <label
                      key={b}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={brandSel.includes(b)}
                          onChange={() => toggleBrand(b)}
                          className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span className="truncate text-foreground/80">{b}</span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Rating — only thresholds real products can match */}
            {ratingOptions.length > 0 && (
              <>
                <h4 className="eyebrow mb-2 mt-6 text-muted-foreground">RATING</h4>
                <div className="flex flex-wrap gap-1.5">
                  {[0, ...ratingOptions].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setMinRating(r)}
                      aria-pressed={minRating === r}
                      className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold transition-colors ${
                        minRating === r
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {r === 0 ? (
                        "All"
                      ) : (
                        <>
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          {r}+
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {visible.length} {visible.length === 1 ? "product" : "products"}
              {activeFilterCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} on
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label className="relative inline-flex">
                <span className="sr-only">Sort products</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="inline-flex h-9 appearance-none items-center gap-1 rounded-full border border-border bg-card pl-3.5 pr-8 text-sm font-semibold text-foreground/80 outline-none transition-colors hover:border-primary hover:text-primary"
                >
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </label>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-display text-lg font-bold">
                {emptyTitle ??
                  (searchMode ? "No matches found" : "Nothing here yet")}
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {emptyHint ??
                  (searchMode
                    ? `We couldn't find anything for “${title}”. Try a different word or browse everything.`
                    : "Try widening the filters — or check back soon, new finds land every week.")}
              </p>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="btn-ink mt-2 h-11 px-6 text-sm"
              >
                Browse all products
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} onToast={toast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
