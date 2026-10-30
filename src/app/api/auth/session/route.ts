import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { getSettings } from "@/lib/server-data";

/** Is the current visitor the signed-in owner? Also returns the owner display name. */
export async function GET() {
  const authenticated = await isOwner();
  let account: string | null = null;
  if (authenticated) {
    try {
      const settings = await getSettings();
      account = `${settings.creator.name || "Aaliyan"} (Admin)`;
    } catch {
      account = "Aaliyan (Admin)";
    }
  }
  return NextResponse.json({ authenticated, account });
}
