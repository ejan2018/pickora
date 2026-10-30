"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { toast } from "./BackToTop";

/** Owner sign-in gate for #/admin. */
export function AdminLogin({ brand, onAuthed }: { brand: string; onAuthed: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Wrong password.");
      onAuthed();
      toast("Dashboard unlocked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)] sm:p-8">
        <p className="eyebrow text-primary">PRIVATE AREA</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Owner Access</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Enter your password to open the dashboard for {brand}.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="owner-password" className="eyebrow mb-1.5 block text-muted-foreground">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="owner-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || busy}
            className="btn-ink h-11 w-full text-sm"
          >
            {busy ? "Checking…" : "Unlock dashboard"}
          </button>
        </form>

        <p className="mt-5 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          This page is for the store owner only. Visitors never see this link in the main
          menu — it lives quietly in the footer.
        </p>
      </div>
    </div>
  );
}
