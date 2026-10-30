"use client";

import { useState } from "react";
import { Heart, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import type { SiteSettings, PublicUser } from "@/lib/types";
import { useStore } from "@/lib/store";
import { navigate } from "@/lib/router";
import { flagOf } from "@/lib/countries";
import { CountryPickerDialog } from "./CountryPicker";
import { EmberFlowCanvas } from "./EmberFlowCanvas";

/* ─── Privacy ───────────────────────────────────────────────────── */

export function PrivacyView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="eyebrow text-primary">THE SHORT VERSION</p>
      <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">Privacy</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This store respects your privacy and collects as little as possible.
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="font-display text-lg font-bold">What is collected</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            To keep the store useful, completely anonymous usage events are counted: which
            pages are visited, which products are viewed, what terms are typed into search,
            and when a “View It” link is unlocked. A coarse mobile/desktop flag is stored
            with each event. That&apos;s the entire list.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold">What is never collected</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            No emails, no advertising IDs, no precise location, no fingerprinting, and no
            sharing of data with ad networks.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold">Your account</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            If you create an account, we store your username, an optional display name, and
            a heavily encrypted (scrypt-hashed) version of your password — never the
            password itself. Your sign-in keeps favorites and cart activity attached to
            your account so they survive new devices.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold">Favorites &amp; cart</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            Favorites live in your own browser&apos;s local storage. They never leave your
            device and disappear if you clear site data.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold">Purchases</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            Checkout happens on the destination page of each product. This store never sees
            your payment details.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ─── About the Creator ──────────────────────────────────────────── */

const SOCIAL_META: { key: keyof NonNullable<SiteSettings["creator"]>["socials"]; label: string; href: (v: string) => string }[] = [
  { key: "instagram", label: "Instagram", href: (v) => `https://instagram.com/${v.replace(/^@/, "")}` },
  { key: "tiktok", label: "TikTok", href: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}` },
  { key: "youtube", label: "YouTube", href: (v) => `https://youtube.com/@${v.replace(/^@/, "")}` },
  { key: "twitter", label: "X / Twitter", href: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  { key: "whatsapp", label: "WhatsApp", href: (v) => `https://wa.me/${v}` },
  { key: "email", label: "Email", href: (v) => `mailto:${v}` },
];

export function CreatorView({ settings }: { settings: SiteSettings }) {
  const c = settings.creator;
  const socials = SOCIAL_META.filter((s) => (c.socials?.[s.key] || "").trim() !== "");

  return (
    <div className="relative isolate my-6 overflow-hidden rounded-3xl bg-[#0d1017] px-4 py-14 text-white sm:px-6 sm:py-20">
      {/* Animated WebGL backdrop (CSS gradient fallback sits under it) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_35%,#31130b_0%,#180d09_45%,#0d1017_82%)]"
      />
      <EmberFlowCanvas className="absolute inset-0 -z-10 h-full w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(5,7,12,0.6)_100%)]"
      />

      <div className="mx-auto w-full max-w-3xl">
        <p className="eyebrow text-[#ffb01f]">THE PERSON BEHIND THE PICKS</p>
        <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">
          About the Creator
        </h1>

        <div className="mt-8 flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {c.avatarUrl ? (
            
            <img
              src={c.avatarUrl}
              alt={c.name}
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-[#ff8a3d]/60"
            />
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#f43f00] font-display text-2xl font-extrabold text-white shadow-[0_10px_30px_-8px_rgba(255,106,0,0.8)]"
            >
              {c.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="eyebrow text-white/55">{c.tagline || "FOUNDER"}</p>
            <p className="mt-1 font-display text-xl font-extrabold">{c.name}</p>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-white/80">{c.bio}</p>
          </div>
        </div>

        {socials.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href((c.socials?.[s.key] || "").trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white/85 backdrop-blur-md transition-all hover:border-[#ff8a3d]/60 hover:bg-[#ff6a00]/15 hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/55">
            Social links appear here once the owner adds them in the dashboard.
          </p>
        )}

        <button
          type="button"
          onClick={() => navigate("/products")}
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#0d1017] shadow-[0_14px_36px_-12px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          Shop my picks
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ─── My Account ─────────────────────────────────────────────────── */

export function AccountView({
  user,
  onSignIn,
  onSignOut,
}: {
  user: PublicUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const { favorites, cartCount, countryInfo, currencyCode } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6">
        <span
          aria-hidden="true"
          className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted"
        >
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in to keep your favorites, cart and view history safe across visits.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
        >
          Sign in / Sign up
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-xl font-extrabold text-primary-foreground"
        >
          {(user.displayName || user.username).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-extrabold">
            {user.displayName || user.username}
          </p>
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-foreground/80 transition-colors hover:border-destructive hover:text-destructive"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sign out
      </button>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-[var(--card-shadow)]">
          <Heart className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{favorites.length}</p>
          <p className="text-xs font-semibold text-muted-foreground">Favorites</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-[var(--card-shadow)]">
          <p className="mt-[26px] text-2xl font-extrabold tabular-nums">{cartCount}</p>
          <p className="text-xs font-semibold text-muted-foreground">In cart</p>
        </div>
      </div>

      {/* Country / currency preference */}
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg leading-none"
          >
            {countryInfo ? flagOf(countryInfo.code) : "🌐"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">Country & currency</p>
            <p className="truncate text-xs text-muted-foreground">
              {countryInfo
                ? `${countryInfo.name} · prices in ${currencyCode}`
                : "Not set — prices show in USD"}
              {user ? " · saved to your account" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex h-9 shrink-0 items-center rounded-full border border-border px-3.5 text-xs font-bold text-foreground/80 transition-colors hover:border-primary hover:text-primary"
        >
          Change
        </button>
      </div>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card shadow-[var(--card-shadow)]">
        {[
          { label: "My favorites", href: "#/favorites" },
          { label: "Privacy", href: "#/privacy" },
          { label: "About the Creator", href: "#/creator" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground/85 transition-colors hover:text-primary"
          >
            {l.label}
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </a>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Your password is stored encrypted — we never see it in plain text.
      </p>

      <CountryPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}

/* ─── 404 ───────────────────────────────────────────────────────── */

export function NotFoundView() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="text-5xl" role="img" aria-label="Ghost">
        👻
      </span>
      <h1 className="mt-4 font-display text-4xl font-extrabold">404</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This page wandered off. Let&apos;s get you back to the good stuff.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <a
          href="#/"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
        >
          Back home
        </a>
        <a
          href="#/products"
          className="inline-flex h-11 items-center rounded-full border-2 border-border px-6 text-sm font-bold text-foreground/80 transition-colors hover:border-primary hover:text-primary"
        >
          Browse products
        </a>
      </div>
    </div>
  );
}
