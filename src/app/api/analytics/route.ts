import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";

/**
 * Owner-only analytics summary for the dashboard.
 * Keeps outbound opens (buy_click), link unlocks (link_click), visits, product
 * views, searches and cart adds clearly separated — a click is never labeled
 * a purchase or commission.
 *
 * Range: today | 7d | 30d | 90d | all (numbers 1/7/30/90 also accepted).
 * range=all additionally returns per-account stats for the Users tab.
 */
const RANGE_DAYS: Record<string, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 3650,
};

export async function GET(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("range") || "30d";
  const rangeKey = RANGE_DAYS[raw] ? raw : RANGE_DAYS[String(raw)] ? String(raw) : "30d";
  const range = RANGE_DAYS[rangeKey];
  const isToday = rangeKey === "today";
  const since = new Date(Date.now() - (isToday ? 0 : (range - 1) * 86400_000));
  if (isToday) since.setHours(0, 0, 0, 0);

  const events = await db.trackEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });

  /* ─── Daily buckets ─────────────────────────────────────────────── */
  const dayCount = rangeKey === "all" ? Math.min(90, Math.max(1, daysBetween(events))) : range;
  const days: { date: string; visits: number; views: number; clicks: number }[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    days.push({ date: d.toISOString().slice(0, 10), visits: 0, views: 0, clicks: 0 });
  }
  const byDate = new Map(days.map((d) => [d.date, d]));

  const topLinkProducts = new Map<string, number>(); // link_click
  const topProducts = new Map<string, number>(); // product_view
  const topSearches = new Map<string, number>();
  const accountActivity = new Map<
    string,
    { events: number; views: number; linkClicks: number; lastSeen: Date; device: string }
  >();

  let mobile = 0;
  let desktop = 0;
  let visits = 0;
  let views = 0;
  let clicks = 0;
  let linkClicks = 0;
  let cartAdds = 0;
  let searches = 0;

  for (const e of events) {
    const key = e.createdAt.toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) {
      if (e.type === "visit") bucket.visits += 1;
      else if (e.type === "product_view") bucket.views += 1;
      else if (e.type === "buy_click") bucket.clicks += 1;
    }
    if (e.type === "visit") visits += 1;
    else if (e.type === "product_view") {
      views += 1;
      if (e.slug) topProducts.set(e.slug, (topProducts.get(e.slug) || 0) + 1);
    } else if (e.type === "buy_click") clicks += 1;
    else if (e.type === "link_click") {
      linkClicks += 1;
      if (e.slug) topLinkProducts.set(e.slug, (topLinkProducts.get(e.slug) || 0) + 1);
    } else if (e.type === "cart_add") cartAdds += 1;
    else if (e.type === "search") {
      searches += 1;
      if (e.term) topSearches.set(e.term, (topSearches.get(e.term) || 0) + 1);
    }
    if (e.device === "mobile") mobile += 1;
    else desktop += 1;

    if (e.username) {
      const a =
        accountActivity.get(e.username) ||
        { events: 0, views: 0, linkClicks: 0, lastSeen: e.createdAt, device: e.device };
      a.events += 1;
      if (e.type === "product_view") a.views += 1;
      if (e.type === "link_click") a.linkClicks += 1;
      if (e.createdAt >= a.lastSeen) {
        a.lastSeen = e.createdAt;
        a.device = e.device;
      }
      accountActivity.set(e.username, a);
    }
  }

  const ctr = views > 0 ? (clicks / views) * 100 : 0;
  const activeViewDays = days.filter((d) => d.views > 0).length;
  const activeSearchDays = days.filter((d) => d.visits > 0).length;

  /* ─── Enrich product lists with titles ──────────────────────────── */
  const slugs = [...new Set([...topLinkProducts.keys(), ...topProducts.keys()])];
  const products = slugs.length
    ? await db.product.findMany({ where: { slug: { in: slugs } } })
    : [];
  const titleBySlug = new Map(products.map((p) => [p.slug, p.title]));

  /* ─── Accounts / shoppers ───────────────────────────────────────── */
  const shopperLogins = events.filter((e) => e.type === "sign_in");
  const logins = events.filter((e) => e.type === "owner_login");
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  const signups = users.filter((u) => u.createdAt >= since).length;
  const totalShoppers = users.length;

  const withTitles = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug, count]) => ({ slug, title: titleBySlug.get(slug) || slug, count }));

  const topAccounts = [...accountActivity.entries()]
    .sort((a, b) => b[1].events - a[1].events)
    .slice(0, 6)
    .map(([username, a]) => ({ username, events: a.events }));

  const recent = await db.trackEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const payload: Record<string, unknown> = {
    range: rangeKey,
    totals: {
      visits,
      views,
      clicks,
      linkClicks,
      ctr: Number(ctr.toFixed(1)),
      cartAdds,
      searches,
      signups,
      avgViewsPerDay: activeViewDays ? Number((views / activeViewDays).toFixed(1)) : 0,
      avgSearchesPerDay: activeSearchDays ? Number((searches / activeSearchDays).toFixed(1)) : 0,
    },
    devices: { mobile, desktop },
    byDay: days,
    topLinkProducts: withTitles(topLinkProducts),
    topProducts: withTitles(topProducts),
    topSearches: [...topSearches.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([term, count]) => ({ term, count })),
    topAccounts,
    recent: recent.map((e) => ({
      id: e.id,
      type: e.type,
      slug: e.slug,
      term: e.term,
      device: e.device,
      username: e.username,
      createdAt: e.createdAt.toISOString(),
    })),
    shopperLogins: shopperLogins.map((e) => ({
      username: e.username,
      device: e.device,
      createdAt: e.createdAt.toISOString(),
    })),
    logins: logins.map((e) => e.createdAt.toISOString()),
    totalEvents: events.length,
    totalShoppers,
  };

  /* ─── range=all → full per-account stats (Users tab) ───────────── */
  if (rangeKey === "all") {
    const displayByUser = new Map(users.map((u) => [u.username, u.displayName]));
    payload.accounts = users.map((u) => {
      const a = accountActivity.get(u.username);
      return {
        username: u.username,
        displayName: u.displayName || u.username,
        device: a?.device || "desktop",
        joined: u.createdAt.toISOString(),
        lastSeen: (a?.lastSeen || u.createdAt).toISOString(),
        events: a?.events || 0,
        linkClicks: a?.linkClicks || 0,
        views: a?.views || 0,
      };
    });
    void displayByUser;
  }

  return NextResponse.json(payload);
}

function daysBetween(events: { createdAt: Date }[]): number {
  if (events.length === 0) return 1;
  const first = events[0].createdAt.getTime();
  const last = events[events.length - 1].createdAt.getTime();
  return Math.min(90, Math.max(1, Math.ceil((last - first) / 86400_000) + 1));
}

/**
 * DELETE /api/analytics — owner-only "reset dashboard".
 * Wipes every stored tracking event so the dashboard shows only real
 * traffic collected from this moment on. Products, events, accounts and
 * suggestions are untouched.
 */
export async function DELETE() {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await db.trackEvent.deleteMany({});
  return NextResponse.json({ ok: true, deleted: result.count });
}
