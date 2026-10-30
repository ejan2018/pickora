# Pickora — Setup & Deployment Guide

From a fresh download to a live store on **Vercel** with a **Supabase** database —
step by step, no prior experience needed.

---

## 1. What you need

| Service | Purpose | Cost |
|---|---|---|
| Node.js 20+ ([nodejs.org](https://nodejs.org)) | Running the app locally | free |
| GitHub account | Hosting the code for Vercel | free |
| Vercel account ([vercel.com](https://vercel.com)) | Hosting the website | free tier is fine |
| Supabase project ([supabase.com](https://supabase.com)) | Cloud database (Postgres) | free tier is fine |

> **Why Supabase?** Vercel's servers are read-only — a database file (SQLite) that
> lives in the repo would lose every change on each deploy. Supabase gives your
> store a real, always-on Postgres database in the cloud, so your products,
> accounts, shouts and analytics persist.

---

## 2. Run it locally first (recommended)

```bash
npm install
cp .env.example .env
npx prisma db push      # create the local SQLite tables
npm run seed            # load the demo catalogue + owner password
npm run dev             # open http://localhost:3000
```

If `npm install` ever fails: delete `node_modules` and the lockfile, make sure
you're on **Node 20 or newer** (`node -v`), then retry. On Windows use
**PowerShell or Git Bash** (not the old cmd.exe).

Sign in to the dashboard at `#/admin` (quiet "Owner" link in the footer) with
the password `pickora2026` — change it immediately under
**Dashboard → Settings → Dashboard password**.

---

## 3. Connect Supabase (the "add all Supabase connection" part)

### 3.1 Create the project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name (e.g. `pickora`), a strong database password, and the region
   closest to you. Save the password — you'll need it in a second.
3. Wait ~2 minutes for the project to provision.

### 3.2 Copy your connection string

1. In your Supabase dashboard open **Project Settings → Database**.
2. Scroll to **Connection string → URI** and choose the **Connection pooling**
   tab, **Session mode** (port `5432`, host looks like
   `aws-0-eu-central-1.pooler.supabase.com`).
3. Copy the URI. It looks like:
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you chose in step 3.1.

### 3.3 Point the app at Supabase

1. Open your `.env` file and set:
   ```env
   DATABASE_URL="postgresql://postgres.xxxx:YOURPASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   APP_SECRET="paste-a-long-random-string-here"
   OWNER_PASSWORD="your-new-dashboard-password"
   NEXT_PUBLIC_SITE_URL=""
   ```
   > The URL **must** stay in quotes if it contains special characters.
2. Switch the Prisma schema to Postgres (one command):
   ```bash
   npm run use:supabase
   ```
   (This copies `prisma/schema.supabase.prisma` over `prisma/schema.prisma`.
   To go back to local SQLite, re-run `npm install` and restore the sqlite
   provider line manually.)
3. Create the tables in Supabase and load the demo data:
   ```bash
   npx prisma db push
   npm run seed
   ```
4. `npm run dev` — the store now reads and writes from Supabase.

> **Troubleshooting:** `P1001` (can't reach server) → wrong URI or region;
> `P1000` (auth failed) → wrong password; "already exists" on `db push` →
> run `npx prisma db push --accept-data-loss` only if you're fine wiping data.

---

## 4. Publish on Vercel

### 4.1 Push the code to GitHub

1. Create a new **empty** repository on GitHub (no README, no license).
2. In the project folder:
   ```bash
   git init
   git add .
   git commit -m "Pickora store"
   git remote add origin https://github.com/YOUR-NAME/pickora.git
   git push -u origin main
   ```
   (GitHub's "…or push an existing repository" block shows the exact commands.)

### 4.2 Import into Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → **Import**
   your `pickora` repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default.
3. Open **Environment Variables** and add **all four**:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the full Supabase connection URI from step 3.2 |
   | `APP_SECRET` | a long random string (used to sign session cookies) |
   | `OWNER_PASSWORD` | your dashboard password (used only on first boot) |
   | `NEXT_PUBLIC_SITE_URL` | leave empty now; after deploy set it to `https://your-store.vercel.app` |

   Apply them to **Production**, **Preview** and **Development**.
4. Click **Deploy** and wait ~2 minutes.
5. Open the URL. Done — your store is live. 🎉

### 4.3 After the first deploy

- Open `https://your-store.vercel.app/#/admin`, sign in, change the password.
- Set `NEXT_PUBLIC_SITE_URL` in Vercel → Settings → Environment Variables, then
  redeploy (used for SEO/OG tags).
- Add your own products under **Dashboard → Products** (brand + product video
  optional — brands feed the catalog filter).
- Dress up the home page under **Dashboard → Media & Popups**:
  - **Hero slides** — Temu-style auto-sliding banner (images or videos,
    auto-advance every 4 s). No slides = the classic orange hero.
  - **Popups & wheel** — portrait phone-screen offers, a spin-the-wheel with
    your own prizes, or card popups; pick the delay and once-per-visitor.
  - **Ad widgets (code)** — your own HTML/CSS/JS ads with a live preview;
    run them as popups or embedded on the home page (sandboxed for safety).
- Videos: uploads up to 4 MB embed directly; for bigger clips, paste a URL
  (e.g. a public Supabase Storage file or any CDN link).

---

## 5. Your intro video

The intro plays in this order: **your video → animated WebGL title screen →
"Start shopping" → country & currency picker → store.**

- Drop your clip at `public/intro-video.mp4` (any MP4/H.264, keep it under ~10 MB
  for fast loading).
- It **auto-adjusts to portrait and landscape** — the clip is always cropped to
  fill the screen (like a phone fullscreen video), so shoot/vertical or
  horizontal, both look right.
- No video? The intro opens directly on the animated WebGL title screen.
- Remove the file any time to skip the video phase.

Your real intro clip (portrait 720×1280, 10 s, faststart-encoded for instant
mobile playback) already ships in the zip at `public/intro-video.mp4` — nothing
to do. To swap it for a different clip, just overwrite that file (keep the same
name and it plays everywhere).

---

## 6. Countries & currency conversion

- After "Start shopping", visitors pick their country — **every country in the
  world** — and all prices instantly convert to that currency
  (e.g. $24.99 → SAR 93.71 in Saudi Arabia).
- Exchange rates refresh automatically every 12 h from a free live source
  (`open.er-api.com`, no key needed). If the API is unreachable, a static
  fallback table is used so prices always display.
- Visitors can change country anytime: **header flag chip** or
  **Account → Country & currency**.
- Signed-in shoppers have their country saved to their account — it follows
  them on any device, and they never see the intro again.

---

## 7. What's stored where

| Data | Stored in |
|---|---|
| Products, events, settings, accounts, shouts, subscribers, analytics | Supabase (your database) |
| Favorites & cart (guests) | Browser localStorage |
| Country/currency preference | localStorage (+ account when signed in) |
| Owner & shopper passwords | scrypt salted hashes — never plain text |
| Images | In the repo (`/public`) or any external URL |

Analytics is first-party only (no third-party trackers), and the owner can turn
it off completely in **Dashboard → Settings** — when off, zero events are stored.

---

## 8. Final checklist

- [ ] Supabase project created, `DATABASE_URL` set locally and in Vercel
- [ ] `npm run use:supabase` run, `npx prisma db push` + `npm run seed` done
- [ ] `APP_SECRET` and a custom `OWNER_PASSWORD` set in Vercel
- [ ] Default password changed in Dashboard → Settings
- [ ] Demo products replaced with real picks (with your affiliate links)
- [ ] Your intro video at `public/intro-video.mp4`
- [ ] `NEXT_PUBLIC_SITE_URL` set to the live URL
- [ ] Announcement bar + creator profile filled in (Dashboard → Settings)
