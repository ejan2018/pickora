#!/usr/bin/env node
/**
 * Switch the Prisma schema from SQLite to PostgreSQL (Supabase).
 * Usage: npm run use:supabase
 * Reverts nothing — to go back to SQLite, re-install or restore the sqlite
 * provider line in prisma/schema.prisma.
 */
import { copyFileSync } from "node:fs";

try {
  copyFileSync("prisma/schema.supabase.prisma", "prisma/schema.prisma");
  console.log("✔ Prisma schema switched to PostgreSQL (Supabase).");
  console.log("  Next: set DATABASE_URL in .env, then run: npx prisma db push && npm run seed");
} catch {
  console.error("✖ Could not copy prisma/schema.supabase.prisma — run this from the project root.");
  process.exit(1);
}
