import { cookies } from "next/headers";
import { db } from "./db";
import { getSettings } from "./server-data";
import { USER_COOKIE, verifyUserToken } from "./auth";

/**
 * Server-side analytics event recorder (used for events only the server can
 * see: shopper sign-ins, new accounts, owner dashboard unlocks).
 * Respects the analytics toggle — when it's off, nothing is stored.
 */
export async function recordServerEvent(
  type: "sign_in" | "sign_up" | "owner_login" | "suggestion",
  opts: { username?: string | null; device?: "desktop" | "mobile" } = {}
) {
  try {
    const settings = await getSettings();
    if (!settings.analyticsEnabled) return;

    let username = opts.username ?? null;
    if (!username && (type === "sign_in" || type === "sign_up")) {
      try {
        const store = await cookies();
        username = verifyUserToken(store.get(USER_COOKIE)?.value);
      } catch {
        username = null;
      }
    }

    await db.trackEvent.create({
      data: {
        type,
        device: opts.device === "mobile" ? "mobile" : "desktop",
        path: "/",
        username,
      },
    });
  } catch {
    /* analytics must never break sign-in */
  }
}

/** Rough device guess from a request's user-agent (coarse, privacy-friendly). */
export function deviceFromRequest(req: Request): "desktop" | "mobile" {
  const ua = req.headers.get("user-agent") || "";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ? "mobile" : "desktop";
}
