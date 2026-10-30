# Pickora — Smart finds, honest prices

A polished, fast, mobile-friendly affiliate storefront with a built-in owner dashboard.
Built as a single Next.js (App Router) app with hash-based client routing.

## Quick start

```bash
npm install
cp .env.example .env
npx prisma db push      # create the SQLite schema
npm run seed            # seed the 11 demo products, settings & Flash Sale event
npm run dev             # http://localhost:3000
```

Deploying to **Vercel + Supabase**? Follow **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** —
it has every step, including the Supabase connection string.

## Owner access

- Route: `/#/admin` (also linked quietly in the footer as “Owner sign-in”)
- Default password: **pickora2026** — set via `OWNER_PASSWORD` in `.env` (used the
  first time the server starts, or when the password record is missing).
- Change it any time from **Dashboard → Store → Update password**.
- The owner session is an HMAC-signed, httpOnly cookie (`pk_owner`). Passwords are
  scrypt-hashed; nothing sensitive ever reaches the browser.

## What's inside

### Storefront (hash routes)
| Route | Page |
|---|---|
| `#/` | Home — hero (auto-sliding image/video banner when you add slides, classic orange hero otherwise), trust chips, category rail, Flash Deals carousel with countdowns, active event banner, recommended grid, trending picks, marquee strip, embedded ad widgets |
| `#/products` | All products — category chips, sidebar filters (category, **price range min–max**, **brand/company** with real counts, **rating**), sorting (newest / featured / price / top rated / most sold / name) |
| `#/product/<slug>` | Product detail — gallery with arrows + thumbnails (+ **product video** as the final slide), price/discount/rating/sold/brand, description, quantity, add to cart, favorites, share, trust row |
| `#/collection/trending` | Featured picks |
| `#/collection/new-finds` | Badge “new” picks |
| `#/collection/best-value` | Sorted by price ascending |
| `#/categories` | Category tiles with item/sold counts |
| `#/favorites` | Browser-local favorites (no account needed) |
| `#/cart` | Cart with summary, savings and per-product checkout |
| `#/search/<term>` | Search results |
| `#/privacy`, `#/creator`, `#/account` | Privacy, About the Creator, My account |
| anything else | 404 — “This page wandered off.” |

- **“View It” button** on each product unlocks the outbound link (tracked),
  with a copy-link button and live-pricing note.
- **Intro flow** on first visit — always shows before the store (no flash):
  1. **Your video** (`public/intro-video.mp4`) plays full-screen — auto-adjusts
     to portrait & landscape, with skip button + progress bar.
  2. **Animated WebGL title screen** — slow ember aurora shader (mature, not
     childish), film grain, staggered reveals.
  3. **“Start shopping” → country picker** — every country in the world;
     prices instantly convert to the local currency ($24.99 → SAR 93.71 in
     Saudi Arabia). Live FX rates refresh every 12 h, static fallback offline.
  4. Store. Signed-in shoppers skip the intro entirely; replay any time via
     the footer link.
- **Currency everywhere** — the header flag chip (`🇸🇦 SAR`) re-opens the
  picker; every price (cards, deals, detail, cart, search, quick view)
  converts. Signed-in shoppers get their country saved to their account.
- **Quick view** — hover any product card → “Quick view” pill → modal peek
  with price, rating, description, add-to-cart and full-details link.
- **Mini cart drawer** — the header cart icon opens a slide-over with qty
  steppers and live subtotal (full cart page still there).
- **Shoutouts & suggestions** — a real comment wall on the home page: visitors
  leave notes/requests (name optional), the owner moderates them from the
  dashboard. No fake testimonials — the wall is real people only.
- **Newsletter** — footer signup stores emails for the owner (visible under
  Dashboard → Feedback).
- **Temu-style popups** — portrait phone-screen offers, an interactive
  spin-the-wheel and card popups (portrait / landscape / square), plus your own
  HTML/CSS/JS ad widgets — all managed from Dashboard → Media & Popups, shown
  to visitors after a delay you choose (once per visitor by default).
- **About the Creator** — full-page animated WebGL ember-waves backdrop
  (hardware-friendly: pauses off-screen and when the tab is hidden, honors
  reduced-motion).
- **Mobile bottom tab bar** (Temu/Shein-style): Home · Categories · Cart ·
  Liked · Account, with live badges and safe-area support. Guests tapping
  Account get the sign-up modal.
- **Visitor accounts** (optional): sign-up keeps favorites, cart **and country**
  in sync across devices via the `pk_user` cookie. Browsing never requires an
  account.
- Dark / light theme toggle (persisted in `pk_theme`).

### Owner dashboard (`#/admin`)
- **Overview** — Today / 7d / 30d / 90d / **All time** ranges; Visits, product
  views, outbound opens, open rate, searches, cart adds, links unlocked,
  shopper sign-ins, new accounts, mobile/desktop visitors, total events;
  daily bar charts; most link-unlocked products, most-viewed products, top
  searches, most active accounts, device split and a live event feed.
  Clicks are never labeled as purchases or commissions. Analytics can be
  switched off entirely (Settings tab). **Reset data** button wipes every
  stored event so the dashboard counts real traffic only.
- **Products** — create / edit / delete, publish / unpublish, image upload (stored
  as data URLs) or URL, gallery images, **brand / company** (feeds the catalog
  brand filter), **product video** (upload ≤ 4 MB or URL — plays in the gallery
  and quick view), buy link, badges, sold/rating/reviews, live preview link.
- **Media & Popups** — three sections, all updating the storefront instantly:
  - **Hero slides** — Temu-style auto-sliding home banner: add image or video
    slides (upload or URL), headline / sub-headline / CTA button + link,
    ordering, show/hide. Slides auto-advance every 4 s with dots, arrows and
    touch swipe. No slides = the classic orange hero.
  - **Popups & wheel** — Temu-style popups: **portrait phone-screen** card,
    **interactive spin-the-wheel** (configurable prize segments), or classic
    card in portrait / landscape (laid cross) / square layouts; image or video
    media; delay timer; once-per-visitor; on/off switch.
  - **Ad widgets (code)** — write your own HTML / CSS / JS ads (spin wheels,
    games, promos), open code from file, upload, live sandboxed preview; run
    as a popup or embedded on the home page. Widgets run sandboxed — they can
    never touch the store itself.
- **Events** — Flash-Sale style banners with emoji, color (Ink / Oxblood /
  Slate / Leather / Moss), schedule and active/hidden state.
- **Users** — real shopper accounts with exact, live values: username, join
  date, last active, device and activity counts (events, links unlocked,
  product views), with search. Activity is attributed by username — never by
  IP or device fingerprint. Includes each shopper's saved country.
- **Feedback** — moderate the Shoutouts wall (hide / unhide / delete shouts)
  and view newsletter subscribers.
- **Settings** — brand name, announcement bar + on/off, home headline /
  sub-headline, default theme, analytics toggle, creator profile (name,
  tagline, bio, avatar, socials), owner password change.

### API (all first-party, no external services)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/products` | `?q=`, `?category=`, `?all=1` (owner) |
| POST | `/api/products` | owner |
| GET/PUT/DELETE | `/api/products/[idOrSlug]` | PUT/DELETE owner-only |
| GET/PUT | `/api/settings` | PUT owner-only |
| GET/POST | `/api/events` | POST owner-only |
| PUT/DELETE | `/api/events/[id]` | owner-only |
| GET | `/api/search/suggest?q=` | autocomplete |
| POST | `/api/track` | visit / product_view / search / cart_add / buy_click / link_click + device flag; events from signed-in shoppers are attributed by username |
| GET | `/api/analytics?range=today\|7d\|30d\|90d\|all` | owner-only; `all` also returns per-account stats |
| DELETE | `/api/analytics` | owner-only — reset dashboard (wipes stored events) |
| GET | `/api/fx` | USD exchange rates (live, 12 h cache, static fallback) |
| GET/POST | `/api/suggestions` | public shout wall (POST = leave a shout) |
| PATCH/DELETE | `/api/suggestions/[id]` | owner-only moderation |
| POST | `/api/subscribe` | newsletter signup |
| GET | `/api/subscribe` | owner-only subscriber list |
| GET/POST | `/api/hero-slides` · PATCH/DELETE `/api/hero-slides/[id]` | public GET; mutations owner-only |
| GET/POST | `/api/popups` · PATCH/DELETE `/api/popups/[id]` | public GET (active only); mutations owner-only |
| GET/POST | `/api/widgets` · PATCH/DELETE `/api/widgets/[id]` | public GET (active only); mutations owner-only |
| POST | `/api/auth/login` · GET `/api/auth/session` · POST `/api/auth/change-password` | owner |
| POST | `/api/account/register` · `/api/account/login` · `/api/account/logout` · GET/PUT `/api/account/me` | visitors (me also syncs country) |

### Data
- SQLite via Prisma by default (`db/custom.db`) — works anywhere Node runs.
- **Supabase / Postgres**: run `npm run use:supabase`, set `DATABASE_URL` to
  your Supabase connection string, then `npx prisma db push && npm run seed`.
- To reset the demo catalogue: `npm run seed`.
- Product images live in `public/images/products/`.

## Deploying to Vercel

The short version (full walkthrough in **[SETUP-GUIDE.md](./SETUP-GUIDE.md)**):

1. Create a Supabase project, copy the **Connection pooling → Session mode**
   URI, and set it as `DATABASE_URL`.
2. Run `npm run use:supabase`, then `npx prisma db push && npm run seed`.
3. Push the repo to GitHub and import it in Vercel.
4. Set env vars in Vercel: `DATABASE_URL`, `OWNER_PASSWORD`, `APP_SECRET`,
   `NEXT_PUBLIC_SITE_URL` → deploy.

## Env vars (`.env`)

```
DATABASE_URL=file:./db/custom.db   # or a hosted DB URL
OWNER_PASSWORD=pickora2026         # initial owner password
APP_SECRET=change-me               # session cookie signing secret
NEXT_PUBLIC_SITE_URL=              # canonical URL (optional)
```

## Notes for the owner

- Prices are display-only and can change at the seller — each product page
  reminds shoppers to confirm the live price.
- Analytics is anonymous by default and can be disabled in Store settings.
- No third-party trackers, no scrapers, no invented reviews — the seeded
  ratings/sold counts are demo values you can edit or clear per product.
