import { NextRequest, NextResponse } from "next/server";
import { getProfile, upsertProfile } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const profile = await getProfile(session.user.email);
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { dietary, spice_level, allergies } = await req.json();
  await upsertProfile(session.user.email, {
    dietary: dietary ?? "none",
    spice_level: spice_level ?? "medium",
    allergies: allergies ?? "",
  });
  return NextResponse.json({ ok: true });
}
