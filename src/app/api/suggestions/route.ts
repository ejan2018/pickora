import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { recordServerEvent, deviceFromRequest } from "@/lib/server-events";

export const dynamic = "force-dynamic";

export type SuggestionDTO = {
  id: string;
  name: string;
  message: string;
  hidden: boolean;
  createdAt: string;
};

/** GET /api/suggestions → latest visible shouts. ?all=1 (owner) → everything. */
export async function GET(req: NextRequest) {
  const owner = await isOwner();
  const wantAll = req.nextUrl.searchParams.get("all") === "1" && owner;

  const rows = await db.suggestion.findMany({
    where: wantAll ? {} : { hidden: false },
    orderBy: { createdAt: "desc" },
    take: wantAll ? 200 : 30,
  });

  const suggestions: SuggestionDTO[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    message: r.message,
    hidden: r.hidden,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ suggestions, total: suggestions.length });
}

/** POST /api/suggestions { name?, message } — anyone can leave a note. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim().slice(0, 40);
  const message = String(body?.message || "").trim().slice(0, 600);

  if (message.length < 2) {
    return NextResponse.json(
      { error: "Write at least a couple of characters." },
      { status: 400 }
    );
  }

  const row = await db.suggestion.create({
    data: { name, message },
  });

  // Owner-facing analytics: a suggestion landed (content itself is NOT tracked).
  await recordServerEvent("suggestion", {
    device: deviceFromRequest(req),
  }).catch(() => null);

  const suggestion: SuggestionDTO = {
    id: row.id,
    name: row.name,
    message: row.message,
    hidden: row.hidden,
    createdAt: row.createdAt.toISOString(),
  };
  return NextResponse.json({ suggestion }, { status: 201 });
}
