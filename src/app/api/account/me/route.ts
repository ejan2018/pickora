import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { USER_COOKIE, verifyUserToken } from "@/lib/auth";

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function publicUser(row: {
  username: string;
  displayName: string;
  favorites: string;
  cart: string;
  country: string | null;
}) {
  return {
    username: row.username,
    displayName: row.displayName,
    favorites: safeParse<string[]>(row.favorites, []),
    cart: safeParse<{ slug: string; qty: number }[]>(row.cart, []),
    country: row.country || null,
  };
}

/** Who am I? (GET) — also used to sync favorites/cart/country (PUT). */
export async function GET() {
  const store = await cookies();
  const username = verifyUserToken(store.get(USER_COOKIE)?.value);
  if (!username) return NextResponse.json({ user: null });

  const row = await db.user.findUnique({ where: { username } });
  if (!row) return NextResponse.json({ user: null });
  return NextResponse.json({ user: publicUser(row) });
}

export async function PUT(req: NextRequest) {
  const store = await cookies();
  const username = verifyUserToken(store.get(USER_COOKIE)?.value);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const favorites = Array.isArray(body.favorites)
    ? body.favorites.filter((s: unknown) => typeof s === "string").slice(0, 500)
    : [];
  const cart = Array.isArray(body.cart)
    ? body.cart
        .filter(
          (i: unknown): i is { slug: string; qty: number } =>
            typeof i === "object" &&
            i !== null &&
            typeof (i as { slug: string }).slug === "string" &&
            Number.isFinite((i as { qty: number }).qty)
        )
        .slice(0, 200)
    : [];

  // Optional country preference (ISO-3166 alpha-2) for currency display.
  const rawCountry =
    typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null;

  const row = await db.user.update({
    where: { username },
    data: {
      favorites: JSON.stringify(favorites),
      cart: JSON.stringify(cart),
      ...(typeof body.country === "string" ? { country } : {}),
    },
  });

  return NextResponse.json({ user: publicUser(row) });
}
