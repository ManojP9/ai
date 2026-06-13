// /api/companion/retention — scheduled data-retention sweep (Phase 5).
// Deletes conversation turns older than the retention window. Wire to a Vercel Cron
// (e.g. daily) via vercel.json. Protected by CRON_SECRET if set.
import { NextRequest, NextResponse } from "next/server";
import { applyRetention } from "@/lib/companion/privacy";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const days = Number(process.env.COMPANION_RETENTION_DAYS || 30);
  try {
    const deleted = await applyRetention(days);
    return NextResponse.json({ ok: true, deletedTurns: deleted, days });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
