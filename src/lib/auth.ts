import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

/**
 * Server-side auth utilities.
 * - Owner: single password (scrypt-hashed, stored in Setting "ownerPassword"),
 *   session cookie "pk_owner" = HMAC-signed token.
 * - Visitors: accounts with scrypt password hashes, cookie "pk_user" =
 *   "<createdAtMs>.<username>.<hmac>". No secrets ever reach the client.
 */

const SECRET =
  process.env.APP_SECRET ||
  process.env.OWNER_PASSWORD ||
  "pickora-dev-secret-change-me";

export const OWNER_COOKIE = "pk_owner";
export const USER_COOKIE = "pk_user";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/* ─── Owner ─────────────────────────────────────────────────────── */

export async function getOwnerPasswordHash(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: "ownerPassword" } });
  if (row) {
    const parsed = JSON.parse(row.value) as { hash: string };
    if (parsed.hash) return parsed.hash;
  }
  // First run: adopt the env password (or default) so the owner can sign in.
  const hash = hashPassword(process.env.OWNER_PASSWORD || "pickora2026");
  await db.setting.upsert({
    where: { key: "ownerPassword" },
    update: {},
    create: { key: "ownerPassword", value: JSON.stringify({ hash }) },
  });
  return hash;
}

export async function setOwnerPasswordHash(hash: string) {
  await db.setting.upsert({
    where: { key: "ownerPassword" },
    update: { value: JSON.stringify({ hash }) },
    create: { key: "ownerPassword", value: JSON.stringify({ hash }) },
  });
}

export function makeOwnerToken(): string {
  const payload = `owner.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyOwnerToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [who, ts, mac] = parts;
  if (who !== "owner") return false;
  if (!safeEqual(mac, sign(`${who}.${ts}`))) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age < SESSION_DAYS * 86400_000;
}

export async function isOwner(): Promise<boolean> {
  const store = await cookies();
  return verifyOwnerToken(store.get(OWNER_COOKIE)?.value);
}

/* ─── Visitor accounts ──────────────────────────────────────────── */

export function makeUserToken(username: string): string {
  const payload = `${Date.now()}.${username}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyUserToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [ts, username, mac] = parts;
  if (!safeEqual(mac, sign(`${ts}.${username}`))) return null;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age > SESSION_DAYS * 86400_000) return null;
  return username;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}
