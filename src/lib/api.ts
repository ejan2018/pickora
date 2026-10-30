"use client";

import type {
  Product,
  SiteSettings,
  StoreEvent,
  PublicUser,
  HeroSlide,
  Popup,
  CustomWidget,
} from "./types";
import type { FxPayload } from "./currency";

/**
 * Client-side API helpers for the Pickora storefront.
 */

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProducts(params?: {
  q?: string;
  category?: string;
  all?: boolean;
}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.category) qs.set("category", params.category);
  if (params?.all) qs.set("all", "1");
  const suffix = qs.toString() ? `?${qs}` : "";
  const data = await json<{ products: Product[] }>(
    await fetch(`/api/products${suffix}`)
  );
  return data.products;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const data = await json<{ product: Product }>(
    await fetch(`/api/products/${encodeURIComponent(slug)}`)
  );
  return data.product;
}

export async function fetchSettings(): Promise<SiteSettings> {
  const data = await json<{ settings: SiteSettings }>(await fetch("/api/settings"));
  return data.settings;
}

export async function fetchEvents(): Promise<StoreEvent[]> {
  const data = await json<{ events: StoreEvent[] }>(await fetch("/api/events"));
  return data.events;
}

export type SuggestResult = {
  products: { slug: string; title: string; imageUrl: string; price: number; currency: string }[];
  categories: string[];
};

export async function fetchSuggest(q: string): Promise<SuggestResult> {
  return json<SuggestResult>(
    await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
  );
}

/* ─── User accounts ─────────────────────────────────────────────── */

export async function registerAccount(
  username: string,
  password: string,
  displayName?: string
): Promise<PublicUser> {
  const data = await json<{ user: PublicUser }>(
    await fetch("/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    })
  );
  return data.user;
}

export async function loginAccount(username: string, password: string): Promise<PublicUser> {
  const data = await json<{ user: PublicUser }>(
    await fetch("/api/account/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
  );
  return data.user;
}

export async function logoutAccount(): Promise<void> {
  await fetch("/api/account/logout", { method: "POST" });
}

export async function fetchMe(): Promise<PublicUser | null> {
  try {
    const data = await json<{ user: PublicUser | null }>(
      await fetch("/api/account/me")
    );
    return data.user;
  } catch {
    return null;
  }
}

export async function syncFavoritesCart(
  favorites: string[],
  cart: { slug: string; qty: number }[],
  country?: string | null
) {
  await fetch("/api/account/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites, cart, ...(country !== undefined ? { country } : {}) }),
  });
}

/* ─── Currency ─────────────────────────────────────────── */

export async function fetchFx(): Promise<FxPayload | null> {
  try {
    const data = (await fetch("/api/fx").then((r) => (r.ok ? r.json() : null))) as FxPayload | null;
    return data;
  } catch {
    return null;
  }
}

/* ─── Suggestions (public comment wall) ────────────────── */

export type Suggestion = {
  id: string;
  name: string;
  message: string;
  hidden: boolean;
  createdAt: string;
};

export async function fetchSuggestions(all = false): Promise<Suggestion[]> {
  const qs = all ? "?all=1" : "";
  const data = await json<{ suggestions: Suggestion[] }>(
    await fetch(`/api/suggestions${qs}`)
  );
  return data.suggestions;
}

export async function postSuggestion(name: string, message: string): Promise<Suggestion> {
  const data = await json<{ suggestion: Suggestion }>(
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    })
  );
  return data.suggestion;
}

export async function setSuggestionHidden(id: string, hidden: boolean): Promise<void> {
  await fetch(`/api/suggestions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden }),
  });
}

export async function deleteSuggestion(id: string): Promise<void> {
  await fetch(`/api/suggestions/${id}`, { method: "DELETE" });
}

/* ─── Newsletter ───────────────────────────────────────── */

export async function subscribeEmail(email: string): Promise<void> {
  await json<{ ok: boolean }>(
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
  );
}

export type Subscriber = { id: string; email: string; createdAt: string };

export async function fetchSubscribers(): Promise<Subscriber[]> {
  const data = await json<{ subscribers: Subscriber[] }>(await fetch("/api/subscribe"));
  return data.subscribers;
}

/* ─── Hero slides / Popups / Custom widgets ───────────── */

export async function fetchHeroSlides(all = false): Promise<HeroSlide[]> {
  const qs = all ? "?all=1" : "";
  const data = await json<{ slides: HeroSlide[] }>(await fetch(`/api/hero-slides${qs}`));
  return data.slides;
}

export async function saveHeroSlide(
  slide: Partial<HeroSlide> & { id?: string }
): Promise<HeroSlide> {
  const isEdit = Boolean(slide.id);
  const res = await fetch(isEdit ? `/api/hero-slides/${slide.id}` : "/api/hero-slides", {
    method: isEdit ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slide),
  });
  const data = await json<{ slide: HeroSlide }>(res);
  return data.slide;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await fetch(`/api/hero-slides/${id}`, { method: "DELETE" });
}

export async function fetchPopups(all = false): Promise<Popup[]> {
  const qs = all ? "?all=1" : "";
  const data = await json<{ popups: Popup[] }>(await fetch(`/api/popups${qs}`));
  return data.popups;
}

export async function savePopup(popup: Partial<Popup> & { id?: string }): Promise<Popup> {
  const isEdit = Boolean(popup.id);
  const res = await fetch(isEdit ? `/api/popups/${popup.id}` : "/api/popups", {
    method: isEdit ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(popup),
  });
  const data = await json<{ popup: Popup }>(res);
  return data.popup;
}

export async function deletePopup(id: string): Promise<void> {
  await fetch(`/api/popups/${id}`, { method: "DELETE" });
}

export async function fetchWidgets(all = false): Promise<CustomWidget[]> {
  const qs = all ? "?all=1" : "";
  const data = await json<{ widgets: CustomWidget[] }>(await fetch(`/api/widgets${qs}`));
  return data.widgets;
}

export async function saveWidget(
  widget: Partial<CustomWidget> & { id?: string }
): Promise<CustomWidget> {
  const isEdit = Boolean(widget.id);
  const res = await fetch(isEdit ? `/api/widgets/${widget.id}` : "/api/widgets", {
    method: isEdit ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(widget),
  });
  const data = await json<{ widget: CustomWidget }>(res);
  return data.widget;
}

export async function deleteWidget(id: string): Promise<void> {
  await fetch(`/api/widgets/${id}`, { method: "DELETE" });
}
