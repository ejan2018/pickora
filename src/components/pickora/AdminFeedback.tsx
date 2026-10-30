"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Megaphone, Trash2, Users2 } from "lucide-react";
import {
  fetchSuggestions,
  setSuggestionHidden,
  deleteSuggestion,
  fetchSubscribers,
  type Suggestion,
  type Subscriber,
} from "@/lib/api";
import { toast } from "./BackToTop";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

/** Owner feedback hub — public shoutout moderation + newsletter subscribers. */
export function AdminFeedback() {
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [subs, setSubs] = useState<Subscriber[] | null>(null);

  const load = () => {
    fetchSuggestions(true)
      .then(setItems)
      .catch(() => setItems([]));
    fetchSubscribers()
      .then(setSubs)
      .catch(() => setSubs([]));
  };

  useEffect(load, []);

  const toggleHidden = async (s: Suggestion) => {
    try {
      await setSuggestionHidden(s.id, !s.hidden);
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === s.id ? { ...x, hidden: !s.hidden } : x)) : prev
      );
      toast(s.hidden ? "Shout is live again" : "Shout hidden from the wall");
    } catch {
      toast("Failed to update — try again");
    }
  };

  const remove = async (s: Suggestion) => {
    if (!window.confirm(`Delete this shout from ${s.name || "an anonymous shopper"}?`)) return;
    try {
      await deleteSuggestion(s.id);
      setItems((prev) => (prev ? prev.filter((x) => x.id !== s.id) : prev));
      toast("Shout deleted");
    } catch {
      toast("Failed to delete — try again");
    }
  };

  const visible = items?.filter((s) => !s.hidden).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total shouts", value: items?.length ?? "…", icon: Megaphone },
          { label: "Visible on wall", value: items ? String(visible) : "…", icon: Eye },
          { label: "Newsletter subs", value: subs?.length ?? "…", icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="font-display text-xl font-extrabold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <section aria-labelledby="shouts-manage">
        <h2 id="shouts-manage" className="mb-3 font-display text-lg font-extrabold">
          Shoutout wall
        </h2>
        {items === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shimmer relative h-16 overflow-hidden rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No shouts yet — they appear here the moment a visitor posts one.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((s) => (
              <li
                key={s.id}
                className={`flex items-start gap-3 rounded-xl border bg-card p-3.5 ${
                  s.hidden ? "border-dashed border-border opacity-70" : "border-border"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold uppercase text-primary"
                >
                  {(s.name || "?").charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold">{s.name || "Anonymous shopper"}</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(s.createdAt)}</span>
                    {s.hidden && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
                    {s.message}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => toggleHidden(s)}
                    aria-label={s.hidden ? "Show on wall" : "Hide from wall"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                  >
                    {s.hidden ? (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    aria-label="Delete shout"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Subscribers */}
      <section aria-labelledby="subs-manage">
        <h2 id="subs-manage" className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold">
          <Users2 className="h-4 w-4 text-primary" aria-hidden="true" />
          Newsletter subscribers
        </h2>
        {subs === null ? (
          <div className="shimmer relative h-20 overflow-hidden rounded-xl bg-muted" />
        ) : subs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No subscribers yet — the footer form feeds this list.
          </p>
        ) : (
          <div className="scrollbar-slim max-h-72 overflow-y-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/95 backdrop-blur">
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{s.email}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
