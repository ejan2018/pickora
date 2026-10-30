"use client";

import { useEffect, useState } from "react";
import { Package, BarChart3, CalendarDays, Users, Settings, Store, LogOut, MessageSquareHeart, Clapperboard } from "lucide-react";
import type { Product, SiteSettings, StoreEvent } from "@/lib/types";
import { AdminLogin } from "./AdminLogin";
import { AdminProducts } from "./AdminProducts";
import { AdminEvents } from "./AdminEvents";
import { AdminOverview } from "./AdminOverview";
import { AdminUsers } from "./AdminUsers";
import { AdminStore } from "./AdminStore";
import { AdminFeedback } from "./AdminFeedback";
import { AdminMedia } from "./AdminMedia";
import { toast } from "./BackToTop";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "products", label: "Products", icon: Package },
  { key: "media", label: "Media & Popups", icon: Clapperboard },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "users", label: "Users", icon: Users },
  { key: "feedback", label: "Feedback", icon: MessageSquareHeart },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AdminView({
  products,
  settings,
  events,
  onReload,
}: {
  products: Product[];
  settings: SiteSettings;
  events: StoreEvent[];
  onReload: () => void;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: { authenticated: boolean; account?: string | null }) => {
        setAuthed(Boolean(d.authenticated));
        setAccount(d.account || null);
      })
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin brand={settings.brand} onAuthed={() => setAuthed(true)} />;
  }

  const signOut = async () => {
    await fetch("/api/auth/login", { method: "DELETE" }).catch(() => null);
    document.cookie = "pk_owner=; Max-Age=0; path=/";
    setAuthed(false);
    toast("Signed out.");
    window.location.hash = "#/";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="inline-flex items-center gap-3">
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
              Owner dashboard
            </span>
          </span>
          <p className="mt-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Signed in as{" "}
            <span className="text-foreground">{account || `${settings.creator.name} (Admin)`}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (window.location.hash = "#/")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-bold text-foreground/80 transition-colors hover:bg-muted"
          >
            <Store className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
            View store
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-bold text-foreground/80 transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-border pb-px">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-t-xl px-4 text-sm font-bold transition-colors ${
              tab === key
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <AdminOverview />}
        {tab === "products" && (
          <AdminProducts products={products} settings={settings} onChanged={onReload} />
        )}
        {tab === "media" && <AdminMedia />}
        {tab === "events" && <AdminEvents events={events} onChanged={onReload} />}
        {tab === "users" && <AdminUsers />}
        {tab === "feedback" && <AdminFeedback />}
        {tab === "settings" && <AdminStore settings={settings} onChanged={onReload} />}
      </div>
    </div>
  );
}
