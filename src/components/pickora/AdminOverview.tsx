"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  MousePointerClick,
  Users,
  Search,
  TrendingUp,
  Monitor,
  Smartphone,
  Activity,
  Loader2,
  Link2,
  ShoppingCart,
  UserPlus,
  LogIn,
  Layers,
  RotateCcw,
} from "lucide-react";
import { toast } from "./BackToTop";

type Analytics = {
  range: string;
  totals: {
    visits: number;
    views: number;
    clicks: number;
    linkClicks: number;
    ctr: number;
    cartAdds: number;
    searches: number;
    signups: number;
    avgViewsPerDay: number;
    avgSearchesPerDay: number;
  };
  devices: { mobile: number; desktop: number };
  byDay: { date: string; visits: number; views: number; clicks: number }[];
  topLinkProducts: { slug: string; title: string; count: number }[];
  topProducts: { slug: string; title: string; count: number }[];
  topSearches: { term: string; count: number }[];
  topAccounts: { username: string; events: number }[];
  recent: {
    id: string;
    type: string;
    slug: string | null;
    term: string | null;
    device: string;
    username: string | null;
    createdAt: string;
  }[];
  shopperLogins: { username: string | null; device: string; createdAt: string }[];
  logins: string[];
  totalEvents: number;
  totalShoppers: number;
};

const RANGES = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
];

function pct(n: number) {
  return `${Number(n).toFixed(1)}%`;
}

/** Friendly labels for the live activity feed (matches the original build). */
const TYPE_LABEL: Record<string, string> = {
  visit: "Visit",
  product_view: "Product view",
  search: "Search",
  link_click: "Link unlocked",
  buy_click: "Outbound open",
  cart_add: "Cart add",
  signin: "Sign-in",
  sign_in: "Sign-in",
  sign_up: "Sign-up",
  suggestion: "Shoutout posted",
  owner_login: "Owner login",
  admin_login: "Owner login",
};

/** Simple CSS bar chart — grouped daily buckets. */
function BarChart({
  data,
  keys,
  title,
  emptyText,
}: {
  data: Analytics["byDay"];
  keys: { key: "visits" | "views" | "clicks"; color: string; label: string }[];
  title: string;
  emptyText: string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => keys.map((k) => d[k.key])));
  const hasData = data.some((d) => keys.some((k) => d[k.key] > 0));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground/90">{title}</h3>
        <div className="flex gap-3">
          {keys.map((k) => (
            <span
              key={k.key}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: k.color }} aria-hidden="true" />
              {k.label}
            </span>
          ))}
        </div>
      </div>
      {hasData ? (
        <div className="flex h-36 items-end gap-[3px]">
          {data.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end justify-center gap-[2px]">
              {keys.map((k) => (
                <span
                  key={k.key}
                  className="w-full max-w-2.5 rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(2, (d[k.key] / max) * 100)}%`,
                    background: k.color,
                    opacity: d[k.key] > 0 ? 1 : 0.25,
                  }}
                  title={`${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${k.label}: ${d[k.key]}`}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="flex h-36 items-center justify-center text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      <p className="mt-2.5 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">{hint}</p>
    </div>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
  empty,
  format,
}: {
  title: string;
  icon: typeof Eye;
  items: { key: string; label: string; count: number }[];
  empty: string;
  format?: (count: number) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)]">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground/90">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-foreground/85">{p.label}</span>
              <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                {format ? format(p.count) : `${p.count}×`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminOverview() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((json: Analytics) => setData(json))
      .catch(() => toast("Could not load analytics"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [range]);  

  const resetAnalytics = async () => {
    if (
      !window.confirm(
        "Reset the dashboard? This deletes every stored visit, view and click — real traffic will keep being counted from now on. Products, accounts and shouts are untouched."
      )
    )
      return;
    setResetting(true);
    try {
      const res = await fetch("/api/analytics", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const { deleted } = (await res.json()) as { deleted: number };
      toast(`Dashboard reset — ${deleted} events cleared. Only real traffic from now on.`);
      load();
    } catch {
      toast("Reset failed — try again");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Store analytics</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Exact, live counts — nothing here is estimated or sampled.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAnalytics}
            disabled={resetting}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/40 px-4 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {resetting ? "Resetting…" : "Reset data"}
          </button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRange(r.value)}
            aria-pressed={range === r.value}
            className={`h-9 rounded-full px-4 text-xs font-bold transition-colors ${
              range === r.value
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Visits"
              value={data.totals.visits.toLocaleString()}
              hint="Pages opened by visitors"
            />
            <StatCard
              icon={Eye}
              label="Product views"
              value={data.totals.views.toLocaleString()}
              hint={`~${data.totals.avgViewsPerDay.toFixed(1)} per active day`}
            />
            <StatCard
              icon={MousePointerClick}
              label="Outbound opens"
              value={data.totals.clicks.toLocaleString()}
              hint="Seller pages actually opened"
            />
            <StatCard
              icon={TrendingUp}
              label="Open rate"
              value={pct(data.totals.ctr)}
              hint="Outbound opens ÷ product views"
            />
            <StatCard
              icon={Search}
              label="Searches"
              value={data.totals.searches.toLocaleString()}
              hint={`~${data.totals.avgSearchesPerDay.toFixed(1)} per active day`}
            />
            <StatCard
              icon={ShoppingCart}
              label="Cart adds"
              value={data.totals.cartAdds.toLocaleString()}
              hint="Items added to carts"
            />
            <StatCard
              icon={Link2}
              label="Links unlocked"
              value={data.totals.linkClicks.toLocaleString()}
              hint={"“View It” presses"}
            />
            <StatCard
              icon={UserPlus}
              label="New accounts"
              value={data.totals.signups.toLocaleString()}
              hint={`${data.totalShoppers.toLocaleString()} registered in total`}
            />
            <StatCard
              icon={LogIn}
              label="Shopper sign-ins"
              value={data.shopperLogins.length.toLocaleString()}
              hint={`${data.logins.length.toLocaleString()} owner unlocks`}
            />
            <StatCard
              icon={Smartphone}
              label="Mobile visitors"
              value={data.devices.mobile.toLocaleString()}
              hint="Phones & tablets"
            />
            <StatCard
              icon={Monitor}
              label="Desktop visitors"
              value={data.devices.desktop.toLocaleString()}
              hint={`${Math.round(
                (data.devices.desktop / Math.max(1, data.devices.mobile + data.devices.desktop)) * 100
              )}% of all traffic`}
            />
            <StatCard
              icon={Layers}
              label="Total events"
              value={data.totalEvents.toLocaleString()}
              hint="In the selected range"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Visits & product views by day"
              data={data.byDay}
              keys={[
                { key: "visits", color: "#0ea5e9", label: "Visits" },
                { key: "views", color: "#ff6a00", label: "Views" },
              ]}
              emptyText="No data yet — it will appear as visitors browse."
            />
            <BarChart
              title="Outbound opens by day"
              data={data.byDay}
              keys={[{ key: "clicks", color: "#16a34a", label: "Opens" }]}
              emptyText="No data yet — it will appear as visitors browse."
            />
          </div>

          {/* Lists */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ListCard
              title="Most link-unlocked products"
              icon={Link2}
              items={data.topLinkProducts.map((p) => ({ key: p.slug, label: p.title, count: p.count }))}
              empty="No link activity yet."
              format={(c) => `${c} unlocks`}
            />
            <ListCard
              title="Most-viewed products"
              icon={Eye}
              items={data.topProducts.map((p) => ({ key: p.slug, label: p.title, count: p.count }))}
              empty="No product views yet."
              format={(c) => `${c} views`}
            />
            <ListCard
              title="Top searches"
              icon={Search}
              items={data.topSearches.map((s) => ({ key: s.term, label: `“${s.term}”`, count: s.count }))}
              empty="No searches yet."
            />
          </div>

          {/* Accounts + devices + live activity */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground/90">
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Most active accounts
              </h3>
              {data.topAccounts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No shopper accounts signed in during this range.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.topAccounts.map((a) => (
                    <li key={a.username} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-foreground/85">
                        {a.username}
                      </span>
                      <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                        {a.events} events
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-bold text-foreground/90">Device split</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">Desktop</span>
                  <span className="ml-auto text-sm font-bold tabular-nums">{data.devices.desktop}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">Mobile</span>
                  <span className="ml-auto text-sm font-bold tabular-nums">{data.devices.mobile}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Total events</span>
                    <span className="tabular-nums">{data.totalEvents.toLocaleString("en-US")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground/90">
                <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Live activity — latest events
              </h3>
              {data.recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No events recorded in this range yet.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-xs">
                  {data.recent.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2"
                    >
                      <span className="font-mono font-semibold text-accent-foreground">{TYPE_LABEL[e.type] || e.type}</span>
                      <span className="min-w-0 truncate text-muted-foreground">
                        {e.username ? `${e.username} · ` : ""}
                        {e.slug || e.term || "—"}
                      </span>
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {e.device === "mobile" ? "📱" : "🖥"}{" "}
                        {new Date(e.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Note: click and view counts measure engagement only. Purchases and commissions are
            confirmed exclusively in your selling partner&apos;s reporting tools.
          </p>
        </>
      )}
    </div>
  );
}
