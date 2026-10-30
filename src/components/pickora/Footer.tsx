"use client";

import { useState } from "react";
import { ShoppingBag, Lock, PlayCircle, Send } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { subscribeEmail } from "@/lib/api";
import { replayIntro } from "./IntroOverlay";
import { toast } from "./BackToTop";

export function Footer({ settings }: { settings: SiteSettings }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await subscribeEmail(email.trim());
      setEmail("");
      toast("Subscribed — new picks land in your inbox first 📬");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't subscribe — try again");
    } finally {
      setBusy(false);
    }
  };

  const explore = [
    { label: "All Products", href: "#/products" },
    { label: "New Finds", href: "#/collection/new-finds" },
    { label: "Privacy", href: "#/privacy" },
    { label: "My Favorites", href: "#/favorites" },
  ];
  const information = [
    { label: "Trending", href: "#/collection/trending" },
    { label: "Best Value", href: "#/collection/best-value" },
    { label: "Editor's Picks", href: "#/collection/editors-picks" },
    { label: "Categories", href: "#/categories" },
    { label: "About the Creator", href: "#/creator" },
    { label: "My Account", href: "#/account" },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-card pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <span className="inline-flex select-none items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {settings.brand}
              </span>
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {settings.brand} is a curated marketplace — every product is chosen by hand
              and checked before it lands here.
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="eyebrow mb-4 text-muted-foreground">Explore</h3>
            <ul className="space-y-3 text-sm font-medium">
              {explore.map((l) => (
                <li key={l.href}>
                  <a className="text-muted-foreground transition-colors hover:text-primary" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Information">
            <h3 className="eyebrow mb-4 text-muted-foreground">Information</h3>
            <ul className="space-y-3 text-sm font-medium">
              {information.map((l) => (
                <li key={l.href}>
                  <a className="text-muted-foreground transition-colors hover:text-primary" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Newsletter */}
        <form
          onSubmit={onSubscribe}
          className="mb-2 flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
        >
          <div className="flex-1">
            <label htmlFor="pk-newsletter" className="text-sm font-bold">
              New picks, first dibs
            </label>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              One email when fresh finds drop — no spam, unsubscribe anytime.
            </p>
          </div>
          <div className="flex w-full max-w-md gap-2">
            <input
              id="pk-newsletter"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 min-w-0 flex-1 rounded-full border border-input bg-card px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-ink h-11 shrink-0 px-5 text-sm disabled:opacity-60"
            >
              {busy ? (
                "…"
              ) : (
                <>
                  Subscribe
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            Created by <span className="font-semibold text-foreground/80">{settings.creator.name} Aamir</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={replayIntro}
              className="inline-flex items-center gap-1.5 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Replay intro
            </button>
            <a
              href="#/admin"
              aria-label="Owner sign-in"
              className="inline-flex items-center gap-1.5 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Owner
            </a>
          </div>
          <p>© 2026 {settings.brand} · All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
