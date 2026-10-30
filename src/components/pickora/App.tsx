"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Product, SiteSettings, StoreEvent, PublicUser } from "@/lib/types";
import { COLLECTIONS, type CollectionKey } from "@/lib/types";
import { fetchProducts, fetchSettings, fetchEvents, fetchMe, logoutAccount, syncFavoritesCart } from "@/lib/api";
import { useRoute, navigate } from "@/lib/router";
import { StoreProvider, useStore } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { setAnalyticsEnabled, track, trackVisitOnce } from "@/lib/track";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BackToTop, ToastViewport, toast } from "./BackToTop";
import { IntroOverlay } from "./IntroOverlay";
import { BottomNav } from "./BottomNav";
import { HomeView } from "./HomeView";
import { CatalogView } from "./CatalogView";
import { ProductDetailView } from "./ProductDetailView";
import { CategoriesView } from "./CategoriesView";
import { FavoritesView, CartView } from "./FavoritesCartViews";
import { PrivacyView, CreatorView, AccountView, NotFoundView } from "./StaticViews";
import { AdminView } from "./AdminView";
import { AuthDialog } from "./AuthDialog";
import { PopupHost } from "./PopupHost";

function SkeletonGrid() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 space-y-2">
        <div className="shimmer relative h-8 w-56 overflow-hidden rounded-lg bg-muted" />
        <div className="shimmer relative h-4 w-80 overflow-hidden rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="shimmer relative aspect-square bg-muted" />
            <div className="space-y-2 p-2.5">
              <div className="shimmer relative h-3.5 w-full overflow-hidden rounded bg-muted" />
              <div className="shimmer relative h-4 w-16 overflow-hidden rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[110] flex min-h-screen items-center justify-center bg-background px-4 text-center"
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <p className="font-display text-2xl font-extrabold">Store is catching its breath</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t load the shelves just now. Check your connection and try again.
        </p>
        <p className="mt-3 break-words text-xs text-muted-foreground">
          Details: {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const route = useRoute();
  const { path, query } = route;
  const [products, setProducts] = useState<Product[] | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { authOpen, openAuth, closeAuth } = useStore();

  const loadAll = useCallback(() => {
    Promise.all([fetchProducts(), fetchSettings(), fetchEvents()])
      .then(([p, s, e]) => {
        setProducts(p);
        setSettings(s);
        setEvents(e);
        setAnalyticsEnabled(s.analyticsEnabled);
        setError(null);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unknown startup error");
      });
  }, []);

  useEffect(loadAll, [loadAll, reloadKey]);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthResolved(true));
  }, []);

  useEffect(() => {
    if (settings) trackVisitOnce();
  }, [settings]);

  // Track search page terms
  useEffect(() => {
    if (path.startsWith("/search/") && settings) {
      const term = decodeURIComponent(path.slice("/search/".length));
      if (term) track("search", { term });
    }
  }, [path, settings]);

  // Sync favorites/cart/country to the signed-in account
  const { favorites, cart, replaceAll, country, setCountry } = useStore();
  const [syncedUser, setSyncedUser] = useState<string | null>(null);
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSyncedUser(null);
      return;
    }
    // On sign-in (first sync): pull account data into this browser
    if (syncedUser !== user.username) {
      setSyncedUser(user.username);
      // Adopt the account's saved country if this browser hasn't picked one.
      if (user.country && !country) setCountry(user.country);
      if (user.favorites.length > 0 || user.cart.length > 0) {
        replaceAll(
          [...new Set([...user.favorites, ...favorites])],
          mergeCarts(user.cart, cart)
        );
        return; // replaceAll re-triggers this effect → pushes below
      }
      // Nothing to pull — fall through and push local state (incl. country).
    }
    // Afterwards: push local changes up (including country preference)
    const id = setTimeout(() => {
      void syncFavoritesCart(favorites, cart, country ?? null).catch(() => null);
    }, 1200);
    return () => clearTimeout(id);

  }, [user, favorites, cart, country]);

  const onSignOut = async () => {
    await logoutAccount().catch(() => null);
    setUser(null);
    toast("Signed out — see you soon");
  };

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const categories = useMemo(() => {
    if (!products) return [];
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  if (!settings || !products) {
    return (
      <>
        <div className="flex h-16 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
        </div>
        {error ? (
          <ErrorView message={error} onRetry={loadAll} />
        ) : (
          <SkeletonGrid />
        )}
        <BackToTop />
      </>
    );
  }

  /* ─── Routing ────────────────────────────────────────────────── */

  let view: React.ReactNode;

  if (path === "/" || path === "") {
    view = <HomeView products={products} settings={settings} events={events} />;
  } else if (path === "/products") {
    view = (
      <CatalogView
        products={products}
        eyebrow="The whole shop"
        title="All Products"
        subtitle="Every hand-picked find in one place"
        initialCategory={query.get("category") || "All"}
      />
    );
  } else if (path.startsWith("/product/")) {
    const slug = decodeURIComponent(path.slice("/product/".length));
    const product = products.find((p) => p.slug === slug);
    if (product) {
      const related = products
        .filter((p) => p.slug !== slug && p.category === product.category)
        .slice(0, 4);
      view = <ProductDetailView product={product} related={related} />;
    } else {
      view = (
        <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center sm:py-28">
          <span className="text-5xl" role="img" aria-label="Empty box">
            📦
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">
            Product not found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This product may have been removed or the link is wrong.
          </p>
          <a
            href="#/"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
          >
            Back to the store
          </a>
        </div>
      );
    }
  } else if (path.startsWith("/collection/")) {
    const key = path.slice("/collection/".length) as CollectionKey;
    const meta = COLLECTIONS[key];
    if (!meta) {
      view = <NotFoundView />;
    } else {
      const list =
        key === "trending" || key === "editors-picks"
          ? products.filter((p) => p.badge === "featured")
          : key === "new-finds"
            ? products.filter((p) => p.badge === "new")
            : [...products].sort((a, b) => a.price - b.price);
      view = (
        <CatalogView
          products={list}
          eyebrow="Collection"
          title={meta.title}
          subtitle={meta.subtitle}
        />
      );
    }
  } else if (path.startsWith("/search/")) {
    const term = decodeURIComponent(path.slice("/search/".length));
    const q = term.toLowerCase();
    const results = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
    view = (
      <CatalogView
        products={results}
        eyebrow="Search"
        title={`Results for “${term}”`}
        searchMode
      />
    );
  } else if (path === "/categories") {
    view = <CategoriesView products={products} />;
  } else if (path === "/favorites") {
    view = <FavoritesView products={products} />;
  } else if (path === "/cart") {
    view = <CartView products={products} />;
  } else if (path === "/privacy") {
    view = <PrivacyView />;
  } else if (path === "/creator") {
    view = <CreatorView settings={settings} />;
  } else if (path === "/account") {
    view = (
      <AccountView
        user={user}
        onSignIn={openAuth}
        onSignOut={onSignOut}
      />
    );
  } else if (path === "/admin") {
    view = (
      <AdminView
        products={products}
        settings={settings}
        events={events}
        onReload={reload}
      />
    );
  } else {
    view = <NotFoundView />;
  }

  return (
    <>
      <a
        href="#main"
        onClick={(e) => {
          // Focus main without touching the hash (keeps the #/ router intact).
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header
        settings={settings}
        user={user}
        categories={categories}
        products={products}
        onSignOut={onSignOut}
      />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {view}
      </main>
      <Footer settings={settings} />
      <BottomNav shopper={user} />
      <BackToTop />
      <ToastViewport />
      <PopupHost />
      <IntroOverlay
        brand={settings.brand}
        authResolved={authResolved}
        signedIn={Boolean(user)}
      />
      <AuthDialog
        open={authOpen}
        onOpenChange={(open) => (open ? openAuth() : closeAuth())}
        onAuthed={(u) => {
          setUser(u);
          toast(`Welcome, ${u.displayName || u.username}!`);
        }}
      />
    </>
  );
}

function mergeCarts(
  a: { slug: string; qty: number }[],
  b: { slug: string; qty: number }[]
) {
  const map = new Map<string, number>();
  [...a, ...b].forEach((i) => map.set(i.slug, (map.get(i.slug) || 0) + i.qty));
  return [...map.entries()].map(([slug, qty]) => ({ slug, qty: Math.min(qty, 99) }));
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </StoreProvider>
  );
}
