"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sun, Moon, Monitor, BarChart3, Upload, Database, Sparkles } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { toast } from "./BackToTop";

/** Resize + convert an uploaded avatar to a compact data URL (max 400px). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 400 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Not a valid image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/…" },
  { key: "tiktok", label: "TikTok URL", placeholder: "https://tiktok.com/@…" },
  { key: "youtube", label: "YouTube URL", placeholder: "https://youtube.com/@…" },
  { key: "twitter", label: "X / Twitter URL", placeholder: "https://x.com/…" },
  { key: "whatsapp", label: "WhatsApp link", placeholder: "https://wa.me/…" },
  { key: "email", label: "Public email", placeholder: "you@example.com" },
] as const;

/** Settings tab: storefront content, theme, analytics, creator profile,
 *  dashboard password and the optional Supabase migration guide. */
export function AdminStore({
  settings,
  onChanged,
}: {
  settings: SiteSettings;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(settings), [settings]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("Save failed.");
      toast("Settings saved — the storefront updated instantly");
      onChanged();
    } catch {
      toast("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwBusy) return;
    setPwError("");
    if (newPw.length < 6) {
      setPwError("New password needs at least 6 characters.");
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed.");
      toast("Password updated");
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setPwBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setDraft((d) => ({ ...d, creator: { ...d.creator, avatarUrl: dataUrl } }));
    } catch {
      toast("Could not read that image");
    }
  };

  const socials = draft.creator.socials || ({} as SiteSettings["creator"]["socials"]);
  const setSocial = (key: keyof typeof socials, value: string) =>
    setDraft((d) => ({
      ...d,
      creator: { ...d.creator, socials: { ...d.creator.socials, [key]: value } },
    }));

  const inputCls =
    "h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary";
  const labelCls = "eyebrow mb-1.5 block text-muted-foreground";

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-6">
        {/* Storefront content */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:p-6">
          <h3 className="font-display font-bold">Storefront content</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Store name</label>
              <input
                value={draft.brand}
                onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Home headline</label>
              <input
                value={draft.homeTitle}
                onChange={(e) => setDraft((d) => ({ ...d, homeTitle: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Home sub-headline</label>
              <textarea
                value={draft.homeSubtitle}
                onChange={(e) => setDraft((d) => ({ ...d, homeSubtitle: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Announcement bar text</label>
              <input
                value={draft.announcement}
                onChange={(e) => setDraft((d) => ({ ...d, announcement: e.target.value }))}
                className={inputCls}
              />
              <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-foreground/80">
                <input
                  type="checkbox"
                  checked={draft.announcementEnabled}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, announcementEnabled: e.target.checked }))
                  }
                  aria-label="Toggle announcement"
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Show announcement bar
                <span className="font-normal text-muted-foreground">
                  (unchecked — the banner will disappear from the storefront.)
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Theme & analytics */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:p-6">
          <h3 className="font-display font-bold">Default theme</h3>
          <p className="mt-1 text-sm text-muted-foreground">Used for first-time visitors.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex rounded-xl border border-input bg-background p-1">
              {(
                [
                  { key: "day", label: "Day", icon: Sun },
                  { key: "night", label: "Night", icon: Moon },
                  { key: "system", label: "System", icon: Monitor },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, defaultTheme: key }))}
                  aria-pressed={draft.defaultTheme === key}
                  className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
                    draft.defaultTheme === key
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                Collect visits &amp; clicks
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.analyticsEnabled}
                aria-label="Toggle analytics"
                onClick={() =>
                  setDraft((d) => ({ ...d, analyticsEnabled: !d.analyticsEnabled }))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  draft.analyticsEnabled ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    draft.analyticsEnabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Off = zero events stored.</p>
        </section>

        {/* Creator profile */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:p-6">
          <h3 className="font-display font-bold">About the Creator — your profile</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            This fills the public{" "}
            <a href="#/creator" className="font-semibold text-primary underline underline-offset-2">
              &ldquo;About the Creator&rdquo;
            </a>{" "}
            page (footer → Info).
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              {draft.creator.avatarUrl ? (
                <img
                  src={draft.creator.avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full border object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed text-2xl">
                  🙋‍♂️
                </span>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3.5 text-xs font-bold text-foreground/80 transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload avatar
                </button>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAvatar(file);
                    e.target.value = "";
                  }}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Square image, resized to 400px automatically.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  value={draft.creator.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, creator: { ...d.creator, name: e.target.value } }))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tagline</label>
                <input
                  value={draft.creator.tagline}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, creator: { ...d.creator, tagline: e.target.value } }))
                  }
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Bio</label>
                <textarea
                  value={draft.creator.bio}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, creator: { ...d.creator, bio: e.target.value } }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    value={socials[key] || ""}
                    onChange={(e) => setSocial(key, e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow transition-transform hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Saving…" : "Save all settings"}
          </button>
        </div>
      </form>

      {/* Dashboard password */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:p-6">
        <h3 className="font-display font-bold">Dashboard password</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Saved as a salted hash — the plain password is never stored.
        </p>
        <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Current password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
              required
            />
          </div>
          {pwError && (
            <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">
              {pwError}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pwBusy}
              className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
            >
              {pwBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {pwBusy ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>

      {/* Database (Supabase) */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] sm:p-6">
        <h3 className="font-display inline-flex items-center gap-2 text-base font-bold">
          <Database className="h-4 w-4 text-primary" aria-hidden="true" />
          Database (Supabase)
        </h3>
        <div className="mt-4 space-y-3 text-sm">
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              The store currently runs on its built-in local store. To move data into
              Supabase, create the tables (SQL is in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold">
                SETUP-GUIDE.md
              </code>
              ) and add this environment variable in Vercel:
            </span>
          </p>
          <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs leading-relaxed scrollbar-slim">
{`DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres`}
          </pre>
          <p className="text-muted-foreground">
            After redeploying, products, events, settings and analytics live in Supabase
            automatically — no code changes needed.
          </p>
        </div>
      </section>
    </div>
  );
}
