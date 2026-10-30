export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  category: string;
  imageUrl: string;
  gallery: string[];
  buyUrl: string;
  badge: string; // "" | "new" | "featured"
  brand: string; // seller / company name (filterable)
  video: string; // optional product video (data URL or https URL)
  sold: number;
  rating: number;
  reviews: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatorSocials = {
  instagram: string;
  tiktok: string;
  youtube: string;
  twitter: string;
  whatsapp: string;
  email: string;
};

export type Creator = {
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  socials: CreatorSocials;
};

export type SiteSettings = {
  brand: string;
  announcement: string;
  announcementEnabled: boolean;
  homeTitle: string;
  homeSubtitle: string;
  defaultTheme: "day" | "night" | "system";
  analyticsEnabled: boolean;
  creator: Creator;
};

export type StoreEvent = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
};

/* ─── Home hero carousel ─────────────────────────────── */

export type HeroSlide = {
  id: string;
  order: number;
  mediaType: "image" | "video";
  media: string;
  headline: string;
  subHeadline: string;
  ctaLabel: string;
  ctaUrl: string;
  active: boolean;
  createdAt: string;
};

/* ─── Temu-style popups ────────────────────────────── */

export type PopupType = "portrait" | "wheel" | "card";
export type PopupLayout = "portrait" | "landscape" | "square";

export type Popup = {
  id: string;
  name: string;
  type: PopupType;
  layout: PopupLayout;
  title: string;
  body: string;
  mediaType: "image" | "video" | "none";
  media: string;
  ctaLabel: string;
  ctaUrl: string;
  segments: string[]; // spin-wheel prize labels
  delaySeconds: number;
  oncePerVisitor: boolean;
  active: boolean;
  createdAt: string;
};

/* ─── Custom HTML/CSS/JS widgets ──────────────────── */

export type WidgetPlacement = "popup" | "home";

export type CustomWidget = {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  placement: WidgetPlacement;
  delaySeconds: number;
  active: boolean;
  createdAt: string;
};

export type CartItem = { slug: string; qty: number };

export type PublicUser = {
  username: string;
  displayName: string;
  favorites: string[];
  cart: CartItem[];
  country: string | null;
};

export type CollectionKey = "trending" | "new-finds" | "best-value" | "editors-picks";

export const COLLECTIONS: Record<
  CollectionKey,
  { title: string; subtitle: string }
> = {
  trending: {
    title: "Trending",
    subtitle: "What everyone's eyeing right now",
  },
  "new-finds": {
    title: "New Finds",
    subtitle: "Fresh drops added this week",
  },
  "best-value": {
    title: "Best Value",
    subtitle: "The quiet prices worth knowing about",
  },
  "editors-picks": {
    title: "Editor's Picks",
    subtitle: "Chosen by hand, not by algorithm",
  },
};

export const CATEGORIES = [
  "Electronics",
  "Gadgets",
  "Art",
  "Kitchen",
  "Beauty",
  "Fitness",
  "Lifestyle",
  "Accessories",
  "Home & Living",
] as const;
