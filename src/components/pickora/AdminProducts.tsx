"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  X,
  ExternalLink,
} from "lucide-react";
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
import type { Product, SiteSettings } from "@/lib/types";
import { formatPrice } from "@/lib/router";
import { toast } from "./BackToTop";

type Draft = {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  currency: string;
  category: string;
  imageUrl: string;
  gallery: string[];
  buyUrl: string;
  badge: string;
  brand: string;
  video: string;
  sold: string;
  rating: string;
  reviews: string;
  published: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  description: "",
  price: "",
  oldPrice: "",
  currency: "USD",
  category: "Electronics",
  imageUrl: "",
  gallery: [],
  buyUrl: "",
  badge: "",
  brand: "",
  video: "",
  sold: "0",
  rating: "0",
  reviews: "0",
  published: false,
};

function draftFromProduct(p: Product): Draft {
  return {
    title: p.title,
    description: p.description,
    price: String(p.price),
    oldPrice: p.oldPrice == null ? "" : String(p.oldPrice),
    currency: p.currency,
    category: p.category,
    imageUrl: p.imageUrl,
    gallery: p.gallery || [],
    buyUrl: p.buyUrl,
    badge: p.badge,
    brand: p.brand || "",
    video: p.video || "",
    sold: String(p.sold),
    rating: String(p.rating),
    reviews: String(p.reviews),
    published: p.published,
  };
}

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

export function AdminProducts({
  products,
  settings,
  onChanged,
}: {
  products: Product[];
  settings: SiteSettings;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState("");
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>(["Electronics", "Gadgets", "Art", "Kitchen", "Beauty", "Fitness", "Lifestyle", "Accessories", "Home & Living"]);
    products.forEach((p) => set.add(p.category));
    return [...set].sort();
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? products.filter((p) => p.title.toLowerCase().includes(q) || p.slug.includes(q))
      : products;
  }, [products, search]);

  useEffect(() => {
    if (editing) setDraft(draftFromProduct(editing));
    else if (creating) setDraft(EMPTY_DRAFT);
  }, [editing, creating]);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setError("");
  };

  const openEdit = (p: Product) => {
    setCreating(false);
    setEditing(p);
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
    if (!draft.title.trim() || !draft.price) {
      setError("Title and price are required.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      title: draft.title,
      description: draft.description,
      price: Number(draft.price),
      oldPrice: draft.oldPrice === "" ? null : Number(draft.oldPrice),
      currency: draft.currency,
      category: draft.category,
      imageUrl: draft.imageUrl,
      gallery: draft.gallery,
      buyUrl: draft.buyUrl,
      badge: draft.badge,
      brand: draft.brand,
      video: draft.video,
      sold: Number(draft.sold) || 0,
      rating: Number(draft.rating) || 0,
      reviews: Number(draft.reviews) || 0,
      published: draft.published,
    };
    try {
      const res = await fetch(
        editing ? `/api/products/${editing.id}` : "/api/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed.");
      toast(editing ? "Product saved" : "Product created");
      closeForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (p: Product) => {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    if (res.ok) {
      toast(p.published ? "Product unpublished" : "Product published");
      onChanged();
    } else {
      toast("Update failed");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/products/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      toast("Product deleted");
      onChanged();
    } else {
      toast("Delete failed");
    }
  };

  const uploadMain = async (file: File) => {
    try {
      const dataUrl = await readImage(file);
      setDraft((d) => ({ ...d, imageUrl: dataUrl }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const uploadGallery = async (file: File) => {
    try {
      const dataUrl = await readImage(file);
      setDraft((d) => ({ ...d, gallery: [...d.gallery, dataUrl] }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="h-10 w-full max-w-xs rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-transform hover:brightness-110 active:scale-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New product
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--card-shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      { }
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground/90">{p.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Owner view · added {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-primary">{formatPrice(p.price, p.currency)}</span>
                    {p.oldPrice && (
                      <span className="ml-1.5 text-xs text-muted-foreground line-through">
                        {formatPrice(p.oldPrice, p.currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        p.published ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.published ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => togglePublish(p)}
                        aria-label={p.published ? "Unpublish product" : "Publish product"}
                        title={p.published ? "Unpublish" : "Publish"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {p.published ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      <a
                        href={`#/product/${p.slug}`}
                        aria-label={`Preview ${p.title}`}
                        title="Preview"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.title}`}
                        title="Edit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        aria-label={`Delete ${p.title}`}
                        title="Delete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={creating || Boolean(editing)} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {editing ? `Edit product` : "New product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Everything here shows up on the storefront exactly as you write it.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="eyebrow mb-1.5 block text-muted-foreground">Title *</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="NovaPods Pro Wireless Earbuds"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="eyebrow mb-1.5 block text-muted-foreground">Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={3}
                  placeholder="What makes this product great? Why did you pick it?"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">
                  Price (you set the price) <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Old price </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.oldPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, oldPrice: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  (strike-through — leave empty for none)
                </p>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Currency</label>
                <select
                  value={draft.currency}
                  onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {["USD", "EUR", "GBP", "PKR", "INR", "AED"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Badge</label>
                <select
                  value={draft.badge}
                  onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">No badge</option>
                  <option value="new">New</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Brand / company</label>
                <input
                  value={draft.brand}
                  onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                  placeholder="e.g. NovaAudio"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  (shoppers can filter by brand — leave empty to hide)
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="eyebrow mb-1.5 block text-muted-foreground">
                  Product video — upload (≤ 4 MB) or paste URL
                </label>
                <div className="flex gap-2">
                  <input
                    ref={videoFileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      if (!f.type.startsWith("video/")) {
                        toast("Not a valid video");
                        return;
                      }
                      if (f.size > 4 * 1024 * 1024) {
                        toast("Video is over 4 MB — paste a URL instead (Supabase Storage or any CDN link)");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setDraft((d) => ({ ...d, video: String(reader.result) }));
                        toast("Video attached");
                      };
                      reader.onerror = () => toast("Could not read file");
                      reader.readAsDataURL(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => videoFileRef.current?.click()}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-input px-3 text-xs font-bold text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload video
                  </button>
                  <input
                    value={draft.video.startsWith("data:") ? "(uploaded file)" : draft.video}
                    onChange={(e) => setDraft((d) => ({ ...d, video: e.target.value }))}
                    placeholder="…or paste a video URL — plays in the product gallery & quick view"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                    readOnly={draft.video.startsWith("data:")}
                  />
                  {draft.video && (
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, video: "" }))}
                      className="inline-flex h-10 shrink-0 items-center rounded-xl border border-input px-3 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Units sold </label>
                <input
                  type="number"
                  min="0"
                  value={draft.sold}
                  onChange={(e) => setDraft((d) => ({ ...d, sold: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  (shows as “12.4K+ sold”)
                </p>
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">RATING (0–5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={draft.rating}
                  onChange={(e) => setDraft((d) => ({ ...d, rating: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block text-muted-foreground">Reviews</label>
                <input
                  type="number"
                  min="0"
                  value={draft.reviews}
                  onChange={(e) => setDraft((d) => ({ ...d, reviews: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Main image */}
            <div>
              <label className="eyebrow mb-1.5 block text-muted-foreground">Main image</label>
              <div className="flex items-start gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                  {draft.imageUrl ? (
                     
                    <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    value={draft.imageUrl.startsWith("data:") ? "" : draft.imageUrl}
                    onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                    placeholder="…or paste an image URL"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                  />
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 text-xs font-bold text-foreground/80 transition-colors hover:border-primary hover:text-primary">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadMain(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label className="eyebrow mb-1.5 block text-muted-foreground">
                Gallery ({draft.gallery.length})
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {draft.gallery.map((g, i) => (
                  <span key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
                    { }
                    <img src={g} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, gallery: d.gallery.filter((_, j) => j !== i) }))
                      }
                      aria-label="Remove image"
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                <label className="inline-flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-[10px] font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadGallery(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Add gallery image — shown in the product page viewer.
              </p>
            </div>

            {/* Buy link */}
            <div>
              <label className="eyebrow mb-1.5 block text-muted-foreground">
                Product link (where “View It” sends people)
              </label>
              <input
                value={draft.buyUrl}
                onChange={(e) => setDraft((d) => ({ ...d, buyUrl: e.target.value }))}
                placeholder="https://…"
                className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Paste the full product link you want this button to open. Visitors only
                ever see a “View It” button — the destination stays private.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <a
                  href="https://www.aliexpress.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Open the marketplace in a new tab
                </a>{" "}
                to grab a product link
              </p>
            </div>

            {/* Publish */}
            <div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-foreground/80">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Published
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Visible in the storefront</p>
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
                {busy ? "Saving…" : editing ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the product from your store. This cannot be undone.
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
