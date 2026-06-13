// /api/companion/privacy — consent, parental controls, data export & erasure (Phase 5).
// GET    ?childId=...&export=1  -> data export (GDPR access)
// GET    ?childId=...           -> current controls + consent + recent audit
// POST   { childId, action: "consent", parentEmail }       -> record consent
// POST   { childId, action: "controls", micEnabled, cameraEnabled } -> set sensor controls
// DELETE ?childId=...           -> erase all data (right to be forgotten)
import { NextRequest, NextResponse } from "next/server";
import {
  getControls,
  recordConsent,
  setControls,
  exportData,
  deleteAllData,
} from "@/lib/companion/privacy";
import { listEvents, logEvent } from "@/lib/companion/audit";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
  try {
    if (req.nextUrl.searchParams.get("export")) {
      const data = await exportData(childId);
      await logEvent(childId, "data_exported").catch(() => {});
      return NextResponse.json(data);
    }
    const [controls, audit] = await Promise.all([getControls(childId), listEvents(childId, 20)]);
    return NextResponse.json({ controls, audit });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, action } = body;
    if (!childId || !action) return NextResponse.json({ error: "childId and action required" }, { status: 400 });

    if (action === "consent") {
      if (!body.parentEmail?.includes("@")) {
        return NextResponse.json({ error: "valid parentEmail required" }, { status: 400 });
      }
      await recordConsent(childId, body.parentEmail);
      await logEvent(childId, "consent_granted", body.parentEmail).catch(() => {});
    } else if (action === "controls") {
      await setControls(childId, body.micEnabled !== false, body.cameraEnabled !== false);
      await logEvent(childId, "controls_changed", `mic=${body.micEnabled !== false} cam=${body.cameraEnabled !== false}`).catch(() => {});
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json(await getControls(childId));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
  try {
    const deleted = await deleteAllData(childId);
    return NextResponse.json({ ok: true, deleted });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
