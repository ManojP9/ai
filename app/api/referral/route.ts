import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureReferralCode, applyReferral, getReferralStats } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = await ensureReferralCode(session.user.email);
  const stats = await getReferralStats(session.user.email);
  return NextResponse.json({ code, count: stats.count });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ ok: false });
  const { ref } = await req.json();
  if (!ref) return NextResponse.json({ ok: false });
  const applied = await applyReferral(session.user.email, ref);
  return NextResponse.json({ ok: applied });
}
