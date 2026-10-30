/**
 * Seeds the Pickora database with the original catalog, settings and event.
 * Plain JS so it runs with `node scripts/seed.mjs` — no TypeScript loader needed.
 * Works with both SQLite (local) and Postgres (Supabase) via DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";

const db = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const PRODUCTS = [
  {
    slug: "robot-poster",
    brand: "Pixel Forge Studio",
    title: "Robot poster",
    description: "Hall poster for wall",
    price: 15,
    oldPrice: 20,
    category: "Art",
    imageUrl: "/images/products/robot-poster.jpg",
    buyUrl: "",
    badge: "new",
    sold: 25,
    rating: 4.8,
    reviews: 0,
    daysAgo: 1,
  },
  {
    slug: "barista-french-press",
    brand: "BrewCraft",
    title: "Barista French Press",
    description:
      "Brew café-grade coffee in four minutes. Borosilicate glass, stainless filter with zero paper waste, and a pour spout that never drips.",
    price: 16.9,
    oldPrice: 24.9,
    category: "Kitchen",
    imageUrl: "/images/products/frenchpress.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "",
    sold: 11600,
    rating: 4.8,
    reviews: 2745,
    daysAgo: 7,
  },
  {
    slug: "glowdew-skincare-set",
    brand: "GlowDew Labs",
    title: "GlowDew Skincare Set",
    description:
      "A simple 4-step ritual: cleanser, toner, serum and moisturizer. Hydrating formulas for a dewy, lit-from-within finish — no 12-step confusion.",
    price: 22.75,
    oldPrice: null,
    category: "Beauty",
    imageUrl: "/images/products/skincare.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "",
    sold: 3900,
    rating: 4.5,
    reviews: 640,
    daysAgo: 8,
  },
  {
    slug: "gripflow-yoga-mat",
    brand: "GripFlow Athletics",
    title: "GripFlow Yoga Mat",
    description:
      "Grippy TPE surface with alignment lines, cushioned enough for knees yet firm enough for balance poses. Rolls up tight and comes with a carry strap.",
    price: 18,
    oldPrice: 27.5,
    category: "Fitness",
    imageUrl: "/images/products/yogamat.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "new",
    sold: 7400,
    rating: 4.6,
    reviews: 1129,
    daysAgo: 9,
  },
  {
    slug: "hydrosteel-insulated-bottle",
    brand: "HydroSteel Outdoor",
    title: "HydroSteel Insulated Bottle",
    description:
      "Ice-cold for 24 hours, steaming for 12. Double-wall stainless steel, leak-proof lid and a powder-coated grip that laughs at slippery hands.",
    price: 14.5,
    oldPrice: 22,
    category: "Lifestyle",
    imageUrl: "/images/products/bottle.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "",
    sold: 21800,
    rating: 4.7,
    reviews: 5233,
    daysAgo: 10,
  },
  {
    slug: "turbocharge-65w-gan-charger",
    brand: "TurboCharge Power",
    title: "TurboCharge 65W GaN Charger",
    description:
      "One brick for everything — laptop, phone, earbuds, handheld. GaN tech keeps it tiny and cool while triple ports charge the whole kit at once.",
    price: 29.99,
    oldPrice: 45,
    category: "Electronics",
    imageUrl: "/images/products/charger.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "featured",
    sold: 9700,
    rating: 4.9,
    reviews: 1523,
    daysAgo: 11,
  },
  {
    slug: "flexihold-phone-stand",
    brand: "FlexiHold Gear",
    title: "FlexiHold Phone Stand",
    description:
      "The little helper your desk deserves. Fully adjustable angle, sturdy aluminum joints, and it folds flat into any pocket or bag.",
    price: 6.99,
    oldPrice: 12.99,
    category: "Accessories",
    imageUrl: "/images/products/phonestand.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "new",
    sold: 43100,
    rating: 4.8,
    reviews: 8911,
    daysAgo: 12,
  },
  {
    slug: "aurora-led-desk-lamp",
    brand: "Aurora Living",
    title: "Aurora LED Desk Lamp",
    description:
      "Sunset gradients on demand. Touch-controlled LED lamp with 16 million colors, dimmable white modes and a flexible neck that goes exactly where you aim it.",
    price: 19.99,
    oldPrice: 29.99,
    category: "Home & Living",
    imageUrl: "/images/products/desklamp.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "",
    sold: 15200,
    rating: 4.6,
    reviews: 3402,
    daysAgo: 13,
  },
  {
    slug: "cinemini-portable-projector",
    brand: "CineMini Optics",
    title: "CineMini Portable Projector",
    description:
      "Movie night, anywhere. Pocket-sized projector with 1080p support, built-in speaker and screen mirroring — point it at any wall and press play.",
    price: 89.9,
    oldPrice: 129.9,
    category: "Electronics",
    imageUrl: "/images/products/projector.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "featured",
    sold: 5600,
    rating: 4.7,
    reviews: 980,
    daysAgo: 14,
  },
  {
    slug: "lumina-68-rgb-mechanical-keyboard",
    brand: "Lumina Keyboards",
    title: "Lumina 68 RGB Mechanical Keyboard",
    description:
      "A compact 68-key board with hot-swappable switches, per-key RGB glow and a satisfying thock. Plug it in and your desk instantly looks like a setup tour.",
    price: 45,
    oldPrice: 65,
    category: "Gadgets",
    imageUrl: "/images/products/keyboard.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "featured",
    sold: 8300,
    rating: 4.9,
    reviews: 1900,
    daysAgo: 15,
  },
  {
    slug: "novapods-pro-wireless-earbuds",
    brand: "NovaAudio",
    title: "NovaPods Pro Wireless Earbuds",
    description:
      "Tiny shells, massive sound. Active noise cancelling, 30-hour total battery with the charging case, and a comfy fit that survives workouts, commutes and couch sessions.",
    price: 24.99,
    oldPrice: 39.99,
    category: "Gadgets",
    imageUrl: "/images/products/earbuds.png",
    buyUrl: "https://www.aliexpress.com/",
    badge: "new",
    sold: 12400,
    rating: 4.8,
    reviews: 2314,
    daysAgo: 16,
  },
];

const SETTINGS = {
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
    socials: {
      instagram: "",
      tiktok: "",
      youtube: "",
      twitter: "",
      whatsapp: "",
      email: "",
    },
  },
};

async function main() {
  console.log("Seeding Pickora…");

  await db.trackEvent.deleteMany();
  await db.storeEvent.deleteMany();
  await db.suggestion.deleteMany();
  await db.product.deleteMany();
  await db.setting.deleteMany();
  await db.user.deleteMany();
  await db.subscriber.deleteMany();

  for (const p of PRODUCTS) {
    const created = new Date(Date.now() - p.daysAgo * 24 * 3600 * 1000);
    await db.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        currency: "USD",
        category: p.category,
        imageUrl: p.imageUrl,
        gallery: JSON.stringify([p.imageUrl]),
        buyUrl: p.buyUrl,
        badge: p.badge,
        sold: p.sold,
        rating: p.rating,
        reviews: p.reviews,
        published: true,
        createdAt: created,
        updatedAt: created,
      },
    });
  }

  await db.setting.create({
    data: { key: "site", value: JSON.stringify(SETTINGS) },
  });

  await db.setting.create({
    data: {
      key: "ownerPassword",
      value: JSON.stringify({
        hash: hashPassword(process.env.OWNER_PASSWORD || "pickora2026"),
      }),
    },
  });

  const now = new Date();
  await db.storeEvent.create({
    data: {
      title: "Flash Sale",
      subtitle: "Limited-time offers across the store — while stock lasts",
      emoji: "⚡",
      color: "amber",
      startsAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      endsAt: new Date(now.getTime() + 12 * 24 * 3600 * 1000),
      active: true,
    },
  });

  console.log(
    `Seeded ${PRODUCTS.length} products, settings, owner password, 1 event. Analytics start at ZERO — only real visits will be counted.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
