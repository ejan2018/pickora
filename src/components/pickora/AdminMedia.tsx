"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  MonitorSmartphone,
  Code2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  FolderOpen,
  Eye,
  Save,
  ArrowLeft,
} from "lucide-react";
import type { CustomWidget, HeroSlide, Popup, PopupLayout, PopupType } from "@/lib/types";
import {
  deleteHeroSlide,
  deletePopup,
  deleteWidget,
  fetchHeroSlides,
  fetchPopups,
  fetchWidgets,
  saveHeroSlide,
  savePopup,
  saveWidget,
} from "@/lib/api";
import { toast } from "./BackToTop";
import { widgetDocument } from "./PopupHost";

/**
 * AdminMedia — the "Media & Popups" dashboard tab.
 *
 * Three sections:
 *  1. Hero slides  — Temu-style auto-sliding home banner (image or video)
 *  2. Popups       — portrait phone-screen, spin-the-wheel and card popups
 *  3. Ad widgets   — custom HTML/CSS/JS with file open, upload + live preview
 *
 * Images are compressed client-side (900px JPEG) before saving; videos up to
 * 4 MB embed directly, bigger clips can be pasted as a URL.
 */

const VIDEO_MAX_BYTES = 4 * 1024 * 1024;

/** Resize + convert an uploaded image to a compact data URL (max 900px, JPEG). */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not a valid image"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Not a valid image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Read a small video file as a data URL (size-capped). */
function readVideo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("video/")) {
      reject(new Error("Not a valid video"));
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      reject(new Error("Video is over 4 MB — paste a URL instead (e.g. Supabase Storage or any CDN link)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Read any text-ish file (html/css/js) as a string. */
function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary";
const areaCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary";
const labelCls = "block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* 1 · HERO SLIDES                                                    */
/* ══════════════════════════════════════════════════════════════════ */

type SlideDraft = {
  id?: string;
  mediaType: "image" | "video";
  media: string;
  headline: string;
  subHeadline: string;
  ctaLabel: string;
  ctaUrl: string;
  order: string;
  active: boolean;
};

const blankSlide: SlideDraft = {
  mediaType: "image",
  media: "",
  headline: "",
  subHeadline: "",
  ctaLabel: "",
  ctaUrl: "",
  order: "0",
  active: true,
};

function HeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [draft, setDraft] = useState<SlideDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetchHeroSlides(true)
      .then(setSlides)
      .catch(() => setSlides([]));
  };
  useEffect(load, []);

  const pick = async (file: File | undefined) => {
    if (!file || !draft) return;
    try {
      if (file.type.startsWith("video/")) {
        const url = await readVideo(file);
        setDraft({ ...draft, media: url, mediaType: "video" });
      } else {
        const url = await readImage(file);
        setDraft({ ...draft, media: url, mediaType: "image" });
      }
      toast(file.type.startsWith("video/") ? "Video attached" : "Image attached");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.media.trim()) {
      toast("Add an image or video first");
      return;
    }
    setSaving(true);
    try {
      await saveHeroSlide({
        id: draft.id,
        mediaType: draft.mediaType,
        media: draft.media,
        headline: draft.headline,
        subHeadline: draft.subHeadline,
        ctaLabel: draft.ctaLabel,
        ctaUrl: draft.ctaUrl,
        order: Number(draft.order) || 0,
        active: draft.active,
      });
      toast(draft.id ? "Slide saved" : "Slide added — it's live on the storefront");
      setDraft(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save slide");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: HeroSlide) => {
    if (!window.confirm(`Delete this slide? "${s.headline || "Untitled"}" will disappear from the home banner.`)) return;
    await deleteHeroSlide(s.id);
    toast("Slide deleted");
    load();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-extrabold">Home hero slides</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The big banner on the home page. Add images or videos — they auto-slide every 4 seconds, Temu-style. No slides = the classic orange hero.
          </p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => setDraft({ ...blankSlide, order: String(slides?.length ?? 0) })}
            className="btn-ink inline-flex h-10 items-center gap-1.5 px-4 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New slide
          </button>
        )}
      </div>

      {draft ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Media — upload image or video (video ≤ 4 MB, or paste URL)">
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    void pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-bold text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload
                </button>
                <input
                  value={draft.media.startsWith("data:") ? "(uploaded file)" : draft.media}
                  onChange={(e) => setDraft({ ...draft, media: e.target.value })}
                  placeholder="…or paste an image/video URL"
                  className={inputCls}
                  readOnly={draft.media.startsWith("data:")}
                />
              </div>
            </Field>
            <Field label="Order (lower shows first)">
              <input
                type="number"
                value={draft.order}
                onChange={(e) => setDraft({ ...draft, order: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Headline">
              <input
                value={draft.headline}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                placeholder="Weekend Mega Deals"
                className={inputCls}
              />
            </Field>
            <Field label="Sub-headline">
              <input
                value={draft.subHeadline}
                onChange={(e) => setDraft({ ...draft, subHeadline: e.target.value })}
                placeholder="Up to 70% off selected picks"
                className={inputCls}
              />
            </Field>
            <Field label="Button label">
              <input
                value={draft.ctaLabel}
                onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
                placeholder="Shop the sale"
                className={inputCls}
              />
            </Field>
            <Field label="Button link (#/products or https://…)">
              <input
                value={draft.ctaUrl}
                onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })}
                placeholder="#/products"
                className={inputCls}
              />
            </Field>
          </div>

          {draft.media && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              {draft.mediaType === "video" ? (
                <video src={draft.media} className="h-40 w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                 
                <img src={draft.media} alt="" className="h-40 w-full object-cover" />
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Visible in the storefront
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-bold text-foreground/70 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-ink inline-flex h-10 items-center gap-1.5 px-5 text-sm"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Saving…" : draft.id ? "Save slide" : "Add slide"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {slides === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : slides.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No slides yet — the home page shows the classic orange hero. Add a slide to switch to the auto-sliding banner.
            </p>
          ) : (
            slides.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {s.mediaType === "video" ? (
                    <video src={s.media} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                     
                    <img src={s.media} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.headline || "Untitled slide"}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 font-mono">
                      {s.mediaType === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                      {s.mediaType}
                    </span>
                    <span>order {s.order}</span>
                    {!s.active && <span className="font-bold text-destructive">hidden</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await saveHeroSlide({ id: s.id, active: !s.active });
                    toast(s.active ? "Slide hidden" : "Slide live");
                    load();
                  }}
                  aria-label={s.active ? "Hide slide" : "Show slide"}
                  className={`h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${s.active ? "border-primary bg-primary" : "border-border bg-muted"}`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${s.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      id: s.id,
                      mediaType: s.mediaType,
                      media: s.media,
                      headline: s.headline,
                      subHeadline: s.subHeadline,
                      ctaLabel: s.ctaLabel,
                      ctaUrl: s.ctaUrl,
                      order: String(s.order),
                      active: s.active,
                    })
                  }
                  aria-label="Edit slide"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-primary hover:text-primary"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(s)}
                  aria-label="Delete slide"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* 2 · POPUPS                                                         */
/* ══════════════════════════════════════════════════════════════════ */

type PopupDraft = {
  id?: string;
  name: string;
  type: PopupType;
  layout: PopupLayout;
  title: string;
  body: string;
  mediaType: "image" | "video" | "none";
  media: string;
  ctaLabel: string;
  ctaUrl: string;
  segments: string;
  delaySeconds: string;
  oncePerVisitor: boolean;
  active: boolean;
};

const blankPopup = (): PopupDraft => ({
  name: "",
  type: "portrait",
  layout: "portrait",
  title: "",
  body: "",
  mediaType: "image",
  media: "",
  ctaLabel: "",
  ctaUrl: "",
  segments: "10% OFF, Free Shipping, 5% OFF, Try Again, 15% OFF, Lucky Draw",
  delaySeconds: "5",
  oncePerVisitor: true,
  active: true,
});

const fromPopup = (p: Popup): PopupDraft => ({
  id: p.id,
  name: p.name,
  type: p.type,
  layout: p.layout,
  title: p.title,
  body: p.body,
  mediaType: p.mediaType,
  media: p.media,
  ctaLabel: p.ctaLabel,
  ctaUrl: p.ctaUrl,
  segments: p.segments.join(", "),
  delaySeconds: String(p.delaySeconds),
  oncePerVisitor: p.oncePerVisitor,
  active: p.active,
});

const TYPE_LABEL: Record<PopupType, string> = {
  portrait: "Portrait phone-screen",
  wheel: "Spin wheel",
  card: "Card",
};

function Popups() {
  const [popups, setPopups] = useState<Popup[] | null>(null);
  const [draft, setDraft] = useState<PopupDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetchPopups(true)
      .then(setPopups)
      .catch(() => setPopups([]));
  };
  useEffect(load, []);

  const pick = async (file: File | undefined) => {
    if (!file || !draft) return;
    try {
      const isVideo = file.type.startsWith("video/");
      const url = isVideo ? await readVideo(file) : await readImage(file);
      setDraft({ ...draft, media: url, mediaType: isVideo ? "video" : "image" });
      toast(isVideo ? "Video attached" : "Image attached");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast("Give the popup a name first");
      return;
    }
    setSaving(true);
    try {
      await savePopup({
        id: draft.id,
        name: draft.name,
        type: draft.type,
        layout: draft.layout,
        title: draft.title,
        body: draft.body,
        mediaType: draft.mediaType,
        media: draft.media,
        ctaLabel: draft.ctaLabel,
        ctaUrl: draft.ctaUrl,
        segments: draft.type === "wheel"
          ? draft.segments.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        delaySeconds: Number(draft.delaySeconds) || 5,
        oncePerVisitor: draft.oncePerVisitor,
        active: draft.active,
      });
      toast(draft.id ? "Popup saved" : "Popup created — it's live on the storefront");
      setDraft(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save popup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-extrabold">Popups &amp; spin wheel</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Temu-style popups: portrait phone-screen cards, an interactive spin-the-wheel, or classic cards (portrait / landscape / square). They appear after the delay you set.
          </p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => setDraft(blankPopup())}
            className="btn-ink inline-flex h-10 items-center gap-1.5 px-4 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New popup
          </button>
        )}
      </div>

      {draft ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (only you see this) *">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Welcome wheel"
                className={inputCls}
              />
            </Field>
            <Field label="Popup type">
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as PopupType })}
                className={inputCls}
              >
                {(Object.keys(TYPE_LABEL) as PopupType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>

            {draft.type !== "wheel" && (
              <>
                <Field label="Layout">
                  <select
                    value={draft.layout}
                    onChange={(e) => setDraft({ ...draft, layout: e.target.value as PopupLayout })}
                    className={inputCls}
                  >
                    <option value="portrait">Portrait (tall)</option>
                    <option value="landscape">Landscape (laid cross)</option>
                    <option value="square">Square</option>
                  </select>
                </Field>
                <Field label="Media">
                  <select
                    value={draft.mediaType}
                    onChange={(e) =>
                      setDraft({ ...draft, mediaType: e.target.value as PopupDraft["mediaType"] })
                    }
                    className={inputCls}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="none">No media (color card)</option>
                  </select>
                </Field>
                {draft.mediaType !== "none" && (
                  <div className="sm:col-span-2">
                    <span className={labelCls}>Media — upload (video ≤ 4 MB) or paste URL</span>
                    <div className="flex gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          void pick(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-bold text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                      >
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        Upload
                      </button>
                      <input
                        value={draft.media.startsWith("data:") ? "(uploaded file)" : draft.media}
                        onChange={(e) => setDraft({ ...draft, media: e.target.value })}
                        placeholder="…or paste an image/video URL"
                        className={inputCls}
                        readOnly={draft.media.startsWith("data:")}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {draft.type === "wheel" && (
              <div className="sm:col-span-2">
                <Field label="Wheel segments (comma-separated prizes)">
                  <input
                    value={draft.segments}
                    onChange={(e) => setDraft({ ...draft, segments: e.target.value })}
                    placeholder="10% OFF, Free Shipping, 5% OFF, Try Again"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            <Field label="Title">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder={draft.type === "wheel" ? "Spin & win" : "Welcome offer"}
                className={inputCls}
              />
            </Field>
            <Field label="Message">
              <input
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="One spin per visitor — good luck!"
                className={inputCls}
              />
            </Field>
            <Field label="Button label">
              <input
                value={draft.ctaLabel}
                onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
                placeholder="Claim now"
                className={inputCls}
              />
            </Field>
            <Field label="Button link">
              <input
                value={draft.ctaUrl}
                onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })}
                placeholder="#/products"
                className={inputCls}
              />
            </Field>
            <Field label="Show after (seconds)">
              <input
                type="number"
                min={0}
                max={120}
                value={draft.delaySeconds}
                onChange={(e) => setDraft({ ...draft, delaySeconds: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.oncePerVisitor}
                onChange={(e) => setDraft({ ...draft, oncePerVisitor: e.target.checked })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Show once per visitor
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-bold text-foreground/70 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-ink inline-flex h-10 items-center gap-1.5 px-5 text-sm"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Saving…" : draft.id ? "Save popup" : "Create popup"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {popups === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : popups.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No popups yet — add a spin wheel or a portrait offer card and it will greet your visitors.
            </p>
          ) : (
            popups.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  {p.type === "wheel" ? (
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : (
                    <MonitorSmartphone className="h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono">{TYPE_LABEL[p.type]}</span>
                    <span>after {p.delaySeconds}s</span>
                    {p.oncePerVisitor && <span>once per visitor</span>}
                    {!p.active && <span className="font-bold text-destructive">off</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await savePopup({ id: p.id, active: !p.active });
                    toast(p.active ? "Popup off" : "Popup live");
                    load();
                  }}
                  aria-label={p.active ? "Turn popup off" : "Turn popup on"}
                  className={`h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${p.active ? "border-primary bg-primary" : "border-border bg-muted"}`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${p.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(fromPopup(p))}
                  aria-label="Edit popup"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-primary hover:text-primary"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${p.name}"? It will stop appearing for visitors.`)) return;
                    await deletePopup(p.id);
                    toast("Popup deleted");
                    load();
                  }}
                  aria-label="Delete popup"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* 3 · CUSTOM HTML/CSS/JS WIDGETS                                     */
/* ══════════════════════════════════════════════════════════════════ */

type WidgetDraft = {
  id?: string;
  name: string;
  html: string;
  css: string;
  js: string;
  placement: "popup" | "home";
  delaySeconds: string;
  active: boolean;
};

const blankWidget = (): WidgetDraft => ({
  name: "",
  html: '<div class="ad">\n  <h2>🎉 Special offer!</h2>\n  <p>Write your own ad here — HTML, CSS and JS all work.</p>\n  <button onclick="alert(\'Hello from your ad!\')">Tap me</button>\n</div>',
  css: ".ad { font-family: system-ui; text-align: center; padding: 32px; }\n.ad h2 { margin: 0 0 8px; }\n.ad button { margin-top: 12px; padding: 10px 22px; border: none; border-radius: 999px; background: #ff6a00; color: #fff; font-weight: 700; cursor: pointer; }",
  js: "console.log('Ad widget loaded');",
  placement: "popup",
  delaySeconds: "5",
  active: true,
});

const fromWidget = (w: CustomWidget): WidgetDraft => ({
  id: w.id,
  name: w.name,
  html: w.html,
  css: w.css,
  js: w.js,
  placement: w.placement,
  delaySeconds: String(w.delaySeconds),
  active: w.active,
});

function Widgets() {
  const [widgets, setWidgets] = useState<CustomWidget[] | null>(null);
  const [draft, setDraft] = useState<WidgetDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const htmlRef = useRef<HTMLInputElement>(null);
  const cssRef = useRef<HTMLInputElement>(null);
  const jsRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetchWidgets(true)
      .then(setWidgets)
      .catch(() => setWidgets([]));
  };
  useEffect(load, []);

  const openFile = async (
    file: File | undefined,
    pane: "html" | "css" | "js"
  ) => {
    if (!file || !draft) return;
    try {
      const text = await readText(file);
      setDraft({ ...draft, [pane]: text });
      toast(`${file.name} loaded into ${pane.toUpperCase()}`);
    } catch {
      toast("Could not read file");
    }
  };

  const previewDoc = useMemo(
    () =>
      draft
        ? widgetDocument({
            id: draft.id || "preview",
            name: draft.name || "preview",
            html: draft.html,
            css: draft.css,
            js: draft.js,
            placement: draft.placement,
            delaySeconds: 0,
            active: true,
            createdAt: "",
          })
        : "",
    [draft]
  );

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast("Give the widget a name first");
      return;
    }
    if (!draft.html.trim()) {
      toast("Add some HTML first");
      return;
    }
    setSaving(true);
    try {
      await saveWidget({
        id: draft.id,
        name: draft.name,
        html: draft.html,
        css: draft.css,
        js: draft.js,
        placement: draft.placement,
        delaySeconds: Number(draft.delaySeconds) || 5,
        active: draft.active,
      });
      toast(draft.id ? "Widget saved" : "Widget created — it's live on the storefront");
      setDraft(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save widget");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-extrabold">Custom ad widgets (HTML / CSS / JS)</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Code your own ads — spin wheels, games, promos, anything. Runs sandboxed on your store. Show as a popup or embed it on the home page.
          </p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => setDraft(blankWidget())}
            className="btn-ink inline-flex h-10 items-center gap-1.5 px-4 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New widget
          </button>
        )}
      </div>

      {draft ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name (only you see this) *">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Holiday spin banner"
                className={inputCls}
              />
            </Field>
            <Field label="Placement">
              <select
                value={draft.placement}
                onChange={(e) => setDraft({ ...draft, placement: e.target.value as WidgetDraft["placement"] })}
                className={inputCls}
              >
                <option value="popup">Popup (shows after delay)</option>
                <option value="home">Home page embed</option>
              </select>
            </Field>
            <Field label={draft.placement === "popup" ? "Show after (seconds)" : "Delay (unused for embeds)"}>
              <input
                type="number"
                min={0}
                max={120}
                value={draft.delaySeconds}
                onChange={(e) => setDraft({ ...draft, delaySeconds: e.target.value })}
                disabled={draft.placement === "home"}
                className={`${inputCls} disabled:opacity-50`}
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              {(
                [
                  {
                    pane: "html" as const,
                    label: "HTML",
                    file: ".html,.htm,.txt",
                    ref: htmlRef,
                  },
                  {
                    pane: "css" as const,
                    label: "CSS",
                    file: ".css,.txt",
                    ref: cssRef,
                  },
                  {
                    pane: "js" as const,
                    label: "JavaScript",
                    file: ".js,.txt",
                    ref: jsRef,
                  },
                ]
              ).map(({ pane, label, file, ref }) => (
                <div key={pane}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={labelCls + " mb-0"}>{label}</span>
                    <input
                      ref={ref}
                      type="file"
                      accept={file}
                      className="hidden"
                      onChange={(e) => {
                        void openFile(e.target.files?.[0], pane);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => ref.current?.click()}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <FolderOpen className="h-3 w-3" aria-hidden="true" />
                      Open file…
                    </button>
                  </div>
                  <textarea
                    value={draft[pane]}
                    onChange={(e) => setDraft({ ...draft, [pane]: e.target.value })}
                    spellCheck={false}
                    className="h-28 w-full resize-y rounded-lg border border-border bg-[#0d1017] px-3 py-2 font-mono text-xs leading-relaxed text-[#e9ecf2] outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div>
              <span className={labelCls}>Live preview</span>
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                <iframe
                  title="Widget preview"
                  srcDoc={previewDoc}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
                  className="h-[340px] w-full border-0"
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Preview runs exactly like the storefront: your HTML/CSS/JS in a sandbox — it can never touch the store itself.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Live on the storefront
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-bold text-foreground/70 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-ink inline-flex h-10 items-center gap-1.5 px-5 text-sm"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Saving…" : draft.id ? "Save widget" : "Create widget"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {widgets === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : widgets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No ad widgets yet — code your own popup ad (spin wheel, game, promo) and run it on your store.
            </p>
          ) : (
            widgets.map((w) => (
              <div key={w.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Code2 className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{w.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono">
                      {w.placement === "home" ? "home embed" : "popup"}
                    </span>
                    {!w.active && <span className="font-bold text-destructive">off</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await saveWidget({ id: w.id, active: !w.active });
                    toast(w.active ? "Widget off" : "Widget live");
                    load();
                  }}
                  aria-label={w.active ? "Turn widget off" : "Turn widget on"}
                  className={`h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${w.active ? "border-primary bg-primary" : "border-border bg-muted"}`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${w.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(fromWidget(w))}
                  aria-label="Edit widget"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-primary hover:text-primary"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${w.name}"? It will disappear from the storefront.`)) return;
                    await deleteWidget(w.id);
                    toast("Widget deleted");
                    load();
                  }}
                  aria-label="Delete widget"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* Tab shell                                                           */
/* ══════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  { key: "hero", label: "Hero slides", icon: ImageIcon, render: () => <HeroSlides /> },
  { key: "popups", label: "Popups & wheel", icon: Sparkles, render: () => <Popups /> },
  { key: "widgets", label: "Ad widgets (code)", icon: Code2, render: () => <Widgets /> },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function AdminMedia() {
  const [section, setSection] = useState<SectionKey>("hero");
  const activeSection = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  return (
    <div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            aria-current={section === key}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors ${
              section === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {activeSection.render()}
      <p className="mt-8 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Everything here updates the storefront instantly — no redeploy needed.
      </p>
    </div>
  );
}
