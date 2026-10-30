import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/server-data";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Partial<SiteSettings> | null;
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const current = await getSettings();
  const next: SiteSettings = {
    ...current,
    brand: body.brand?.trim() || current.brand,
    announcement: body.announcement ?? current.announcement,
    announcementEnabled: body.announcementEnabled ?? current.announcementEnabled,
    homeTitle: body.homeTitle?.trim() || current.homeTitle,
    homeSubtitle: body.homeSubtitle ?? current.homeSubtitle,
    defaultTheme:
      body.defaultTheme && ["day", "night", "system"].includes(body.defaultTheme)
        ? body.defaultTheme
        : current.defaultTheme,
    analyticsEnabled: body.analyticsEnabled ?? current.analyticsEnabled,
    creator: { ...current.creator, ...(body.creator || {}) },
  };
  await saveSettings(next);
  return NextResponse.json({ settings: next });
}
