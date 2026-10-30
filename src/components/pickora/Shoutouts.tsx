"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import {
  fetchSuggestions,
  postSuggestion,
  type Suggestion,
} from "@/lib/api";
import { useReveal } from "@/lib/router";
import { toast } from "./BackToTop";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

/** Public comment wall — real suggestions from real shoppers (no fake data). */
export function Shoutouts() {
  const { ref, className } = useReveal<HTMLDivElement>();
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSuggestions()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (message.trim().length < 2) {
      toast("Write a little more first ✍️");
      return;
    }
    setBusy(true);
    try {
      const created = await postSuggestion(name.trim(), message.trim());
      setItems((prev) => [created, ...(prev ?? [])].slice(0, 30));
      setMessage("");
      toast("Thanks for the shoutout! It's on the wall 🎉");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't post — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="shoutouts-heading"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <div ref={ref} className={className}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 id="shoutouts-heading" className="font-display text-lg font-extrabold sm:text-xl">
              Shoutouts & suggestions
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Real notes from shoppers — what should {`the store`} stock next?
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
          {/* Form */}
          <form
            onSubmit={submit}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)] sm:p-5"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold">Leave a note</p>
            </div>
            <label className="block">
              <span className="sr-only">Your name (optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Name (optional)"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="sr-only">Your suggestion</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={600}
                rows={4}
                placeholder="Suggest a product, share a find, or just say hi…"
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] leading-tight text-muted-foreground">
                Shows on the wall instantly. Be kind — the owner can remove notes.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="btn-ink h-10 shrink-0 px-5 text-sm disabled:opacity-60"
              >
                {busy ? (
                  "Posting…"
                ) : (
                  <>
                    Post
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Wall */}
          <div className="scrollbar-slim max-h-96 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)] sm:p-5">
            {items === null ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="shimmer relative h-16 overflow-hidden rounded-xl bg-muted" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
                <span className="text-3xl" role="img" aria-label="Empty wall">
                  💬
                </span>
                <p className="text-sm font-bold">No shouts yet — be the first!</p>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Suggestions, requests and feedback all land here for the owner
                  to see.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((s) => (
                  <li
                    key={s.id}
                    className="flex gap-3 rounded-xl border border-border/70 bg-background p-3"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold uppercase text-primary"
                    >
                      {(s.name || "?").charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-bold">
                          {s.name || "Anonymous shopper"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(s.createdAt)}
                        </span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
                        {s.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
