import { NextRequest, NextResponse } from "next/server";
import { getCourse, seedCourse, deriveStats } from "@/lib/db";
import { sql } from "@vercel/postgres";

export async function GET() {
  // Auto-seed all 20 phases / 503 lessons on first request if table is empty.
  await seedCourse();
  const tasks = await getCourse();
  const { stats, next } = deriveStats(tasks);
  return NextResponse.json({ tasks, stats, next });
}

export async function POST() {
  const result = await seedCourse();
  return NextResponse.json(result);
}

// Bulk-update every lesson in a phase (e.g. "mark whole phase done").
export async function PATCH(req: NextRequest) {
  const { phase, status } = await req.json();
  if (phase == null || !status) {
    return NextResponse.json({ error: "phase and status required" }, { status: 400 });
  }
  await sql`
    UPDATE course_lessons SET status = ${status}
    WHERE phase = ${phase} AND parent_id IS NOT NULL
  `;
  return NextResponse.json({ ok: true });
}
