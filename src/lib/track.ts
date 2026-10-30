"use client";

/**
 * Privacy-friendly, first-party tracking client.
 * Sends anonymous events to /api/track; a coarse mobile/desktop flag only.
 * Honors the "analytics disabled" store setting (checked before sending).
 */

let analyticsEnabled = true;
let settingsLoaded = false;
let visitLogged = false;
let device: "desktop" | "mobile" | null = null;

function getDevice(): "desktop" | "mobile" {
  if (device) return device;
  device =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent)
      ? "mobile"
      : "desktop";
  return device;
}

export function setAnalyticsEnabled(enabled: boolean) {
  analyticsEnabled = enabled;
  settingsLoaded = true;
}

export type TrackType =
  | "visit"
  | "product_view"
  | "search"
  | "cart_add"
  | "buy_click"
  | "link_click";

export function track(type: TrackType, data: { slug?: string; term?: string } = {}) {
  if (typeof window === "undefined" || !analyticsEnabled) return;
  try {
    const body = JSON.stringify({
      type,
      slug: data.slug,
      term: data.term,
      device: getDevice(),
      path: window.location.hash || "#/",
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* tracking must never break the store */
  }
}

/** Log one page visit per session. */
export function trackVisitOnce() {
  if (visitLogged) return;
  visitLogged = true;
  track("visit");
}

export function pushRecentSearch(term: string) {
  try {
    const key = "pk_recent_searches";
    const list: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    const next = [term, ...list.filter((t) => t !== term)].slice(0, 8);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Recent search terms (newest first), for the search dropdown. */
export function readRecentSearches(): string[] {
  try {
    const list: unknown = JSON.parse(
      localStorage.getItem("pk_recent_searches") || "[]"
    );
    return Array.isArray(list) ? (list as string[]).slice(0, 6) : [];
  } catch {
    return [];
  }
}
