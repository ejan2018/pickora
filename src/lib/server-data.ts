import { db } from "./db";
import type {
  Product,
  SiteSettings,
  StoreEvent,
  HeroSlide,
  Popup,
  CustomWidget,
  PopupType,
  PopupLayout,
} from "./types";
import type {
  Product as DbProduct,
  StoreEvent as DbStoreEvent,
  HeroSlide as DbHeroSlide,
  Popup as DbPopup,
  CustomWidget as DbCustomWidget,
} from "@prisma/client";

/**
 * Server-side data helpers: serialize DB rows to the public API shapes.
 */

export function serializeProduct(row: DbProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    oldPrice: row.oldPrice ?? null,
    currency: row.currency,
    category: row.category,
    imageUrl: row.imageUrl,
    gallery: safeParse<string[]>(row.gallery, []),
    buyUrl: row.buyUrl,
    badge: row.badge,
    brand: row.brand,
    video: row.video,
    sold: row.sold,
    rating: row.rating,
    reviews: row.reviews,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeEvent(row: DbStoreEvent): StoreEvent {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    emoji: row.emoji,
    color: row.color,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeHeroSlide(row: DbHeroSlide): HeroSlide {
  return {
    id: row.id,
    order: row.order,
    mediaType: row.mediaType === "video" ? "video" : "image",
    media: row.media,
    headline: row.headline,
    subHeadline: row.subHeadline,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

const POPUP_TYPES: PopupType[] = ["portrait", "wheel", "card"];
const POPUP_LAYOUTS: PopupLayout[] = ["portrait", "landscape", "square"];

export function serializePopup(row: DbPopup): Popup {
  return {
    id: row.id,
    name: row.name,
    type: POPUP_TYPES.includes(row.type as PopupType) ? (row.type as PopupType) : "card",
    layout: POPUP_LAYOUTS.includes(row.layout as PopupLayout)
      ? (row.layout as PopupLayout)
      : "portrait",
    title: row.title,
    body: row.body,
    mediaType: row.mediaType === "video" ? "video" : row.mediaType === "none" ? "none" : "image",
    media: row.media,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    segments: safeParse<string[]>(row.segments, []),
    delaySeconds: row.delaySeconds,
    oncePerVisitor: row.oncePerVisitor,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeWidget(row: DbCustomWidget): CustomWidget {
  return {
    id: row.id,
    name: row.name,
    html: row.html,
    css: row.css,
    js: row.js,
    placement: row.placement === "home" ? "home" : "popup",
    delaySeconds: row.delaySeconds,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const DEFAULT_SETTINGS: SiteSettings = {
  brand: "Pickora",
  announcement: "Free shipping on selected picks · New finds added every week",
  announcementEnabled: true,
  homeTitle: "Top picks, chosen for you",
  homeSubtitle:
    "Hand-picked gadgets, home upgrades and everyday essentials — curated by a real person, one click from checkout.",
  defaultTheme: "day",
  analyticsEnabled: true,
  creator: {
    name: "Aaliyan",
    tagline: "Founder & Player One",
    bio: "I'm Aaliyan — I run this little pixel shop. Every item on the shelf is picked by hand and checked before it goes live. No noise, just good loot.",
    avatarUrl: "",
    socials: { instagram: "", tiktok: "", youtube: "", twitter: "", whatsapp: "", email: "" },
  },
};

export async function getSettings(): Promise<SiteSettings> {
  const row = await db.setting.findUnique({ where: { key: "site" } });
  if (!row) return DEFAULT_SETTINGS;
  const stored = safeParse<Partial<SiteSettings>>(row.value, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    creator: { ...DEFAULT_SETTINGS.creator, ...(stored.creator || {}) },
  };
}

export async function saveSettings(next: SiteSettings): Promise<SiteSettings> {
  await db.setting.upsert({
    where: { key: "site" },
    update: { value: JSON.stringify(next) },
    create: { key: "site", value: JSON.stringify(next) },
  });
  return next;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `item-${Date.now().toString(36)}`
  );
}
