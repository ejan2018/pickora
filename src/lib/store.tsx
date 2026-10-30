"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CartItem } from "./types";
import {
  COUNTRY_BY_CODE,
  flagOf,
} from "./countries";
import {
  STATIC_RATES,
  formatInCurrency,
  currencyOfCountry,
  type FxPayload,
} from "./currency";

/**
 * Browser-local favorites & cart with cross-tab sync.
 * Storage keys match the original Pickora build:
 *   pk_favorites, pk_cart, pk_favorites_changed, pk_cart_changed
 * Plus the shopper's country/currency preference:
 *   pk_country (ISO-3166 alpha-2), pk_fx (cached exchange rates, 12 h)
 */

const FAV_KEY = "pk_favorites";
const CART_KEY = "pk_cart";
const COUNTRY_KEY = "pk_country";
const FX_KEY = "pk_fx";
const FX_MAX_AGE_MS = 12 * 3600 * 1000;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(
      key.endsWith("favorites") ? "pk_favorites_changed" : "pk_cart_changed",
      String(Date.now())
    );
  } catch {
    /* storage unavailable */
  }
}

type StoreContextValue = {
  favorites: string[];
  cart: CartItem[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => boolean;
  addToCart: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartQty: (slug: string) => number;
  replaceAll: (favorites: string[], cart: CartItem[]) => void;
  /** Shared sign-in dialog state (opened from header, bottom nav, views) */
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  /* ── Country & currency ─────────────────────────────── */
  /** Selected country (ISO-3166 alpha-2) or null → USD */
  country: string | null;
  /** Country info (name, flag, currency) or null */
  countryInfo: { code: string; name: string; currency: string; flag: string } | null;
  /** Select a country (persists locally; account sync handled by App) */
  setCountry: (code: string | null) => void;
  /** Active currency code (falls back to USD) */
  currencyCode: string;
  /** Cached FX rates (live from /api/fx, static fallback baked in) */
  fx: FxPayload | null;
  /** Format a USD base price in the shopper's selected currency */
  fmtPrice: (usd: number) => string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [country, setCountryState] = useState<string | null>(null);
  const [fx, setFx] = useState<FxPayload | null>(null);
  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  useEffect(() => {
    // Hydrate from localStorage (external system) on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(read<string[]>(FAV_KEY, []));
     
    setCart(read<CartItem[]>(CART_KEY, []));

    try {
      const c = localStorage.getItem(COUNTRY_KEY);
      if (c && /^[A-Za-z]{2}$/.test(c)) setCountryState(c.toUpperCase());
    } catch {
      /* ignore */
    }

    // Cached FX rates (< 12 h old) so converted prices render instantly.
    try {
      const raw = localStorage.getItem(FX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FxPayload;
        if (parsed?.rates && Date.now() - new Date(parsed.updatedAt).getTime() < FX_MAX_AGE_MS) {
          setFx(parsed);
        }
      }
    } catch {
      /* ignore */
    }

    // Refresh rates in the background.
    fetch("/api/fx")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FxPayload | null) => {
        if (!data?.rates) return;
        setFx(data);
        try {
          localStorage.setItem(FX_KEY, JSON.stringify(data));
        } catch {
          /* ignore */
        }
      })
      .catch(() => null);

    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "pk_favorites_changed") setFavorites(read<string[]>(FAV_KEY, []));
      if (e.key === "pk_cart_changed") setCart(read<CartItem[]>(CART_KEY, []));
      if (e.key === COUNTRY_KEY) {
        try {
          const c = localStorage.getItem(COUNTRY_KEY);
          setCountryState(c && /^[A-Za-z]{2}$/.test(c) ? c.toUpperCase() : null);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) write(FAV_KEY, favorites);
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) write(CART_KEY, cart);
  }, [cart, hydrated]);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  );

  const toggleFavorite = useCallback((slug: string) => {
    let added = false;
    setFavorites((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      added = true;
      return [...prev, slug];
    });
    return !favorites.includes(slug) ? true : false;
  }, [favorites]);

  const addToCart = useCallback((slug: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.slug === slug);
      if (existing) {
        return prev.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { slug, qty }];
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, qty: Math.min(qty, 99) } : i))
    );
  }, []);

  const removeFromCart = useCallback((slug: string) => {
    setCart((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const replaceAll = useCallback((favs: string[], newCart: CartItem[]) => {
    setFavorites(favs);
    setCart(newCart);
  }, []);

  /* ── Country / currency ─────────────────────────────── */

  const setCountry = useCallback((code: string | null) => {
    const next = code && /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : null;
    setCountryState(next);
    try {
      if (next) localStorage.setItem(COUNTRY_KEY, next);
      else localStorage.removeItem(COUNTRY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const countryInfo = useMemo(() => {
    if (!country) return null;
    const c = COUNTRY_BY_CODE[country];
    if (!c) return null;
    return { ...c, flag: flagOf(c.code) };
  }, [country]);

  const currencyCode = currencyOfCountry(country);

  const fmtPrice = useCallback(
    (usd: number) => formatInCurrency(usd, currencyCode, fx?.rates ?? STATIC_RATES),
    [currencyCode, fx]
  );

  const cartCount = cart.length;
  const cartQty = useCallback(
    (slug: string) => cart.find((i) => i.slug === slug)?.qty ?? 0,
    [cart]
  );

  return (
    <StoreContext.Provider
      value={{
        favorites,
        cart,
        isFavorite,
        toggleFavorite,
        addToCart,
        setQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartQty,
        replaceAll,
        authOpen,
        openAuth,
        closeAuth,
        country,
        countryInfo,
        setCountry,
        currencyCode,
        fx,
        fmtPrice,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
