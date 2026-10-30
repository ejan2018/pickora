import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/server-data";
import { USER_COOKIE, verifyUserToken } from "@/lib/auth";

/**
 * Privacy-friendly event collector.
 * Accepts: visit | product_view | search | cart_add | buy_click | link_click
 * Stores only: type, optional slug/term, coarse device flag, path, time and —
 * when the visitor is signed in — the username events are attributed to.
 * Never IPs, never fingerprints. Silently drops events when analytics is
 * disabled in store settings.
 */
const VALID_TYPES = new Set([
  "visit",
  "product_view",
  "search",
  "cart_add",
  "buy_click",
  "link_click",
]);

export async function POST(req: NextRequest) {
  try {
    const settings = await getSettings();
    if (!settings.analyticsEnabled) {
      return NextResponse.json({ ok: true, dropped: "disabled" });
    }

    const body = await req.json().catch(() => null);
    const type = String(body?.type || "");
    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "Unknown event type." }, { status: 400 });
    }

    // Attribute the event to the signed-in shopper (if any).
    const store = await cookies();
    let username: string | null = null;
    try {
      username = verifyUserToken(store.get(USER_COOKIE)?.value);
    } catch {
      username = null;
    }

    await db.trackEvent.create({
      data: {
        type,
        slug: body?.slug ? String(body.slug).slice(0, 120) : null,
        term: body?.term ? String(body.term).slice(0, 120) : null,
        device: body?.device === "mobile" ? "mobile" : "desktop",
        path: body?.path ? String(body.path).slice(0, 200) : null,
        username,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
