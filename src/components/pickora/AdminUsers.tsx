"use client";

import { useEffect, useState } from "react";
import { Users, Search, Smartphone, Monitor, Loader2 } from "lucide-react";

type Account = {
  username: string;
  displayName: string;
  device: string;
  joined: string;
  lastSeen: string;
  events: number;
  linkClicks: number;
  views: number;
};

type UsersData = {
  accounts: Account[];
  totalShoppers: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Users — real shopper accounts with exact, live values. */
export function AdminUsers() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    fetch("/api/analytics?range=all")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((json: UsersData) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accounts = (data?.accounts ?? []).filter((a) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return a.username.toLowerCase().includes(t) || a.displayName.toLowerCase().includes(t);
  });
  const totalEvents = accounts.reduce((n, a) => n + a.events, 0);
  const totalLinks = accounts.reduce((n, a) => n + a.linkClicks, 0);
  const totalViews = accounts.reduce((n, a) => n + a.views, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Shopper accounts</h2>
          <p className="mt-0.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Every real sign-up appears here instantly — username, join date, device and exact
            activity counts.
          </p>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search accounts…"
            aria-label="Search accounts"
            className="h-10 w-56 rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Loading accounts"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-center text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Registered accounts", value: data?.totalShoppers ?? 0 },
              { label: "Events by accounts", value: totalEvents },
              { label: "Product views", value: totalViews },
              { label: "Links unlocked", value: totalLinks },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]"
              >
                <Users className="h-4 w-4 text-primary" strokeWidth={1.6} aria-hidden="true" />
                <p className="mt-2.5 text-2xl font-extrabold tabular-nums">
                  {s.value.toLocaleString("en-US")}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Accounts table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--card-shadow)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-bold">Account</th>
                    <th scope="col" className="px-4 py-3 font-bold">Joined</th>
                    <th scope="col" className="px-4 py-3 font-bold">Last active</th>
                    <th scope="col" className="px-4 py-3 font-bold">Device</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Events</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Views</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        {data?.accounts.length === 0
                          ? "No shopper accounts yet"
                          : "No accounts match your search"}
                      </td>
                    </tr>
                  ) : (
                    accounts.map((a) => (
                      <tr
                        key={a.username}
                        className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground/90">{a.username}</p>
                            {a.displayName && a.displayName !== a.username && (
                              <p className="truncate text-xs text-muted-foreground">{a.displayName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(a.joined)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(a.lastSeen)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            {a.device === "mobile" ? (
                              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {a.device === "mobile" ? "Mobile" : "Desktop"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">{a.events}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">{a.views}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">{a.linkClicks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            All values are exact and computed live from real events. Account activity is attributed
            by username — never by IP or device fingerprint.
          </p>
        </>
      )}
      {loading && (
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
