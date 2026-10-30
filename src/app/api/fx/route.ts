import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATIC_RATES, type FxPayload, type FxRates } from "@/lib/currency";

export const dynamic = "force-dynamic";

/**
 * GET /api/fx → { base: "USD", rates, updatedAt, live }
 * Live rates come from the free open.er-api.com endpoint (no key required),
 * are cached in the Setting table for 12 h, and fall back to the static
 * snapshot baked into src/lib/currency.ts when offline.
 */

const CACHE_KEY = "fx_rates";
const MAX_AGE_MS = 12 * 3600 * 1000;
const LIVE_URL = "https://open.er-api.com/v6/latest/USD";

async function readCache(): Promise<FxPayload | null> {
  const row = await db.setting.findUnique({ where: { key: CACHE_KEY } });
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as FxPayload;
    if (!parsed?.rates || typeof parsed.updatedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(payload: FxPayload) {
  await db.setting.upsert({
    where: { key: CACHE_KEY },
    update: { value: JSON.stringify(payload) },
    create: { key: CACHE_KEY, value: JSON.stringify(payload) },
  });
}

async function fetchLive(): Promise<FxRates | null> {
  try {
    const res = await fetch(LIVE_URL, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== "success" || !data.rates) return null;
    return data.rates;
  } catch {
    return null;
  }
}

export async function GET() {
  const cached = await readCache();
  const fresh = cached && Date.now() - new Date(cached.updatedAt).getTime() < MAX_AGE_MS;

  if (fresh && cached) {
    return NextResponse.json(cached);
  }

  const live = await fetchLive();
  if (live) {
    const payload: FxPayload = {
      base: "USD",
      rates: live,
      updatedAt: new Date().toISOString(),
      live: true,
    };
    await writeCache(payload).catch(() => null);
    return NextResponse.json(payload);
  }

  // Offline / API down: serve stale cache if present, else the static snapshot.
  const payload: FxPayload =
    cached ??
    {
      base: "USD",
      rates: STATIC_RATES,
      updatedAt: new Date().toISOString(),
      live: false,
    };
  return NextResponse.json(payload);
}
