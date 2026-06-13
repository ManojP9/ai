// /api/companion/profile — read/update a child's profile + personality (Phase 4).
import { NextRequest, NextResponse } from "next/server";
import { getProfile, upsertProfile, ChildProfile } from "@/lib/companion/profiles";
import { PERSONALITY_PRESETS, PersonalityPreset } from "@/lib/companion/personality";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
  try {
    return NextResponse.json(await getProfile(childId));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
    const personality: PersonalityPreset = PERSONALITY_PRESETS.includes(body.personality)
      ? body.personality
      : "gentle";
    const profile: ChildProfile = {
      childId: body.childId,
      childName: body.childName ?? null,
      ageYears: body.ageYears ?? null,
      personality,
      eyeColor: body.eyeColor ?? "#1fb6a6",
      traits: {
        energy: clampPct(body.traits?.energy, 60),
        talkativeness: clampPct(body.traits?.talkativeness, 50),
      },
    };
    await upsertProfile(profile);
    return NextResponse.json(profile);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

function clampPct(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}
