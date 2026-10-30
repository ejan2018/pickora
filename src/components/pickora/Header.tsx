"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ShoppingBag,
  Heart,
  ShoppingCart,
  Sun,
  Moon,
  Search,
  ChevronDown,
  LayoutGrid,
  X,
  Truck,
  ShieldCheck,
  Headset,
  User as UserIcon,
  Clock,
  History,
  Globe2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/lib/store";
import { navigate, useRoute } from "@/lib/router";
import { fetchSuggest, type SuggestResult } from "@/lib/api";
import { pushRecentSearch, readRecentSearches } from "@/lib/track";
import type { SiteSettings, Product } from "@/lib/types";
import { AuthDialog } from "./AuthDialog";
import { CountryPickerDialog } from "./CountryPicker";
import { CartDrawer } from "./CartDrawer";
import { flagOf } from "@/lib/countries";
import type { PublicUser } from "@/lib/types";

const TRUST_ITEMS = [
  { icon: Truck, label: "Free shipping on selected picks" },
  { icon: ShieldCheck, label: "Safe payments · Purchase protection" },
  { icon: Headset, label: "24/7 support" },
];

export function Header({
  settings,
  user,
  categories,
  products = [],
  onSignOut,
}: {
  settings: SiteSettings;
  user: PublicUser | null;
  categories: { name: string; count: number }[];
  products?: Product[];
  onSignOut: () => void;
}) {
  const route = useRoute();
  const { theme, toggle } = useTheme();
  const { cartCount, favorites, countryInfo, currencyCode, fmtPrice } = useStore();
  const [dismissed, setDismissed] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      // Sync with the persisted dismissal flag (external system).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(localStorage.getItem("pk_announcement_dismissed") === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pk_announcement_dismissed", "1");
    } catch {
      /* ignore */
    }
  };

  // Debounced suggestions
  const onSearchChange = useCallback((value: string) => {
    setTerm(value);
    if (timer.current) clearTimeout(timer.current);
    if (!value.trim()) {
      setSuggestions(null);
      setSearching(false);
      setRecent(readRecentSearches());
      setSearchOpen(true);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetchSuggest(value.trim());
        setSuggestions(res);
        setSearching(false);
        setSearchOpen(true);
      } catch {
        setSuggestions(null);
        setSearching(false);
      }
    }, 180);
  }, []);

  const submitSearch = (value?: string) => {
    const q = (value ?? term).trim();
    if (!q) return;
    pushRecentSearch(q);
    setSearchOpen(false);
    navigate(`/search/${encodeURIComponent(q)}`);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goCategory = (cat: string) => navigate(`/products?category=${encodeURIComponent(cat)}`);

  const navLink = (href: string, label: string) => {
    const active = route.path === href;
    return (
      <a
        href={`#${href}`}
        data-active={active}
        className="link-sweep whitespace-nowrap py-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground data-[active=true]:text-primary"
      >
        {label}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement banner (dismissible marquee) */}
      {settings.announcementEnabled && !dismissed && settings.announcement && (
        <div className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
            <div className="relative flex-1 overflow-hidden">
              <div className="flex w-max animate-marquee gap-16 whitespace-nowrap will-change-transform">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    aria-hidden={i !== 0}
                    className="flex items-center gap-16 text-xs font-semibold tracking-wide"
                  >
                    {settings.announcement}
                    <span aria-hidden="true" className="text-primary-foreground/60">
                      ✦
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss announcement"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Dark trust bar */}
      <div className="hidden bg-[#17181c] text-white/90 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs font-medium sm:px-6">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-[var(--glow-2)]" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <div className="glass border-b border-border bg-card/95">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 sm:px-6">
          <a
            href="#/"
            aria-label="Pickora home"
            className="shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="inline-flex select-none items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {settings.brand}
              </span>
            </span>
          </a>

          <nav aria-label="Main" className="hidden shrink-0 items-center gap-4 lg:flex">
            {navLink("/collection/trending", "Best Sellers")}
            {navLink("/collection/new-finds", "New Finds")}
            {navLink("/products", "All Products")}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center gap-1 whitespace-nowrap py-2 text-sm font-semibold text-foreground/80 outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground"
                aria-label="Categories menu"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                Categories
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 rounded-2xl border-border p-2">
                <p className="px-3 pb-1.5 pt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Shop by category
                </p>
                {categories.map((c) => (
                  <DropdownMenuItem key={c.name} onClick={() => goCategory(c.name)} className="cursor-pointer justify-between">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => navigate("/categories")} className="cursor-pointer justify-center gap-1 font-semibold text-primary">
                  Browse all categories →
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Search */}
          <div ref={searchRef} className="relative order-last w-full basis-full sm:order-none sm:ml-auto sm:w-auto sm:max-w-md sm:flex-1 sm:basis-auto">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="flex w-full items-center"
            >
              <label htmlFor="pk-search" className="sr-only">
                Search products
              </label>
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="pk-search"
                  type="search"
                  role="searchbox"
                  autoComplete="off"
                  value={term}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => {
                    setRecent(readRecentSearches());
                    setSearchOpen(true);
                  }}
                  placeholder="Search for gadgets, home, beauty…"
                  className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform hover:brightness-110 active:scale-95"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </form>

            {searchOpen && !term.trim() && (
              <div
                aria-label="Recent searches"
                className="absolute left-0 right-0 top-full z-50 mt-2 animate-pop-in overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--card-shadow-hover)]"
              >
                {recent.length > 0 ? (
                  <div className="p-2">
                    <p className="flex items-center gap-1.5 px-3 pb-1.5 pt-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <History className="h-3 w-3" aria-hidden="true" />
                      Recent searches
                    </p>
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => submitSearch(r)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    Search products — try a category or a product name
                  </p>
                )}
              </div>
            )}

            {searchOpen && term.trim() && (
              <div
                role="listbox"
                aria-label="Search suggestions"
                className="absolute left-0 right-0 top-full z-50 mt-2 animate-pop-in overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--card-shadow-hover)]"
              >
                {searching ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
                ) : suggestions &&
                  suggestions.products.length === 0 &&
                  suggestions.categories.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    No matches for “{term}”
                  </p>
                ) : suggestions ? (
                  <div className="max-h-96 overflow-y-auto p-2 scrollbar-slim">
                    {suggestions.categories.length > 0 && (
                      <div className="mb-1">
                        <p className="px-3 pb-1.5 pt-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Categories
                        </p>
                        {suggestions.categories.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setSearchOpen(false);
                              goCategory(c);
                            }}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestions.products.map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/product/${p.slug}`);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                      >
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover"
                          loading="lazy"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {p.title}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {fmtPrice(p.price)}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => submitSearch()}
                      className="mt-1 w-full border-t border-border px-3 py-2.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-accent"
                    >
                      See all results for “{term}” →
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2">
            {/* Country / currency chip */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label="Change country and currency"
              title={countryInfo ? `${countryInfo.name} · ${currencyCode}` : "Choose your country & currency"}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-bold text-foreground/90 transition-colors hover:border-primary hover:text-primary sm:px-3"
            >
              {countryInfo ? (
                <span aria-hidden="true" className="text-sm leading-none">
                  {flagOf(countryInfo.code)}
                </span>
              ) : (
                <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="tabular-nums">{currencyCode}</span>
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "day" ? "Switch to dark mode" : "Switch to light mode"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {theme === "day" ? (
                <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-none transition-colors hover:bg-muted"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold uppercase text-primary-foreground">
                    {(user.displayName || user.username).charAt(0)}
                  </span>
                  <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline">
                    {user.username}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer gap-2">
                    <UserIcon className="h-4 w-4" aria-hidden="true" /> My account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favorites")} className="cursor-pointer gap-2">
                    <Heart className="h-4 w-4" aria-hidden="true" /> Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/cart")} className="cursor-pointer gap-2">
                    <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Cart
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSignOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:px-4"
              >
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}

            <a
              href="#/favorites"
              aria-label="My favorites"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
              {favorites.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {favorites.length}
                </span>
              )}
            </a>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <CountryPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} products={products} />
    </header>
  );
}
