"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { StoreEvent } from "@/lib/types";
import { toast } from "./BackToTop";

type Draft = {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const COLORS = [
  { key: "violet", label: "Ink", hex: "#1c1814" },
  { key: "pink", label: "Oxblood", hex: "#7c3a30" },
  { key: "cyan", label: "Slate", hex: "#4e5a61" },
  { key: "amber", label: "Leather", hex: "#96562f" },
  { key: "emerald", label: "Moss", hex: "#5a6b4f" },
];

function draftFromEvent(e: StoreEvent): Draft {
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  };
  return {
    title: e.title,
    subtitle: e.subtitle,
    emoji: e.emoji,
    color: e.color,
    startsAt: toLocal(e.startsAt),
    endsAt: toLocal(e.endsAt),
    active: e.active,
  };
}

function emptyDraft(): Draft {
  const now = new Date();
  const off = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - off).toISOString().slice(0, 16);
  const week = new Date(now.getTime() + 7 * 86400_000 - off).toISOString().slice(0, 16);
  return { title: "", subtitle: "", emoji: "⚡", color: "violet", startsAt: local, endsAt: week, active: true };
}

export function AdminEvents({
  events,
  onChanged,
}: {
  events: StoreEvent[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<StoreEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<StoreEvent | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setDraft(emptyDraft());
    setError("");
  };

  const openEdit = (e: StoreEvent) => {
    setCreating(false);
    setEditing(e);
    setDraft(draftFromEvent(e));
    setError("");
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setError("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
      setError("End date must be after the start date.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      title: draft.title,
      subtitle: draft.subtitle,
      emoji: draft.emoji,
      color: draft.color,
      startsAt: new Date(draft.startsAt).toISOString(),
      endsAt: new Date(draft.endsAt).toISOString(),
      active: draft.active,
    };
    try {
      const res = await fetch(editing ? `/api/events/${editing.id}` : "/api/events", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update event");
      toast(editing ? "Event saved" : "Event created — it's live on the storefront");
      closeForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (ev: StoreEvent) => {
    const res = await fetch(`/api/events/${ev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ev.active }),
    }).catch(() => null);
    if (res?.ok) {
      toast(ev.active ? "Event hidden" : "Event live");
      onChanged();
    } else {
      toast("Failed to update event");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/events/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      toast("Event deleted");
      onChanged();
    } else {
      toast("Failed to delete event");
    }
  };

  return (
    <div>
      <div className="mb-2">
        <h2 className="font-display text-lg font-bold">Special offers &amp; events</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Live events show a countdown banner at the top of your storefront.
        </p>
      </div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-transform hover:brightness-110 active:scale-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New special offer
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Zap className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground/80">No events yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Create your first special offer to excite visitors.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((ev) => {
            const color = COLORS.find((c) => c.key === ev.color) || COLORS[0];
            const now = Date.now();
            const live =
              ev.active &&
              new Date(ev.startsAt).getTime() <= now &&
              new Date(ev.endsAt).getTime() > now;
            return (
              <div
                key={ev.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow"
                      style={{ background: color.hex }}
                    >
                      <Zap className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-display font-bold leading-snug">{ev.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {ev.subtitle || "No subtitle"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      live ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {live ? "● Live" : ev.active ? "Scheduled" : "Hidden"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(ev.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" → "}
                  {new Date(ev.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground/80">
                    {/* Toggle event */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ev.active}
                      aria-label="Toggle event"
                      onClick={() => void toggleActive(ev)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        ev.active ? "bg-primary" : "bg-input"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          ev.active ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    {ev.active ? "Active" : "Hidden"}
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(ev)}
                      aria-label="Edit event"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(ev)}
                      aria-label="Delete event"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={creating || Boolean(editing)} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {editing ? "Edit event" : "Create event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="eyebrow mb-1.5 block text-muted-foreground">Title *</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Weekend Mega Sale"
                className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="eyebrow mb-1.5 block text-muted-foreground">Subtitle</label>
              <input
                value={draft.subtitle}
                onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                placeholder="Hand-picked deals across the whole store!"
                className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Emoji</label>
                <input
                  value={draft.emoji}
                  onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-center text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Starts</label>
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-2.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Ends</label>
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-2.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
            <div>
              <label className="eyebrow mb-1.5 block text-muted-foreground">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, color: c.key }))}
                    aria-label={c.label}
                    aria-pressed={draft.color === c.key}
                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 ${
                      draft.color === c.key ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-foreground/80">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                  aria-label="Toggle event"
                />
                Active
              </label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Visitors see this as a countdown banner on the home page while it runs.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-bold text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow transition-transform hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {busy ? "Saving…" : editing ? "Save changes" : "Create event"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              The banner will disappear from the storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
