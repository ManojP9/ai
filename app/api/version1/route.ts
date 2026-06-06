import { NextRequest, NextResponse } from "next/server";
import { getVersion1, seedVersion1 } from "@/lib/db";
import { sql } from "@vercel/postgres";

export async function GET() {
  // Auto-seed on first request if table is empty
  await seedVersion1();
  const tasks = await getVersion1();
  return NextResponse.json({ tasks });
}

export async function POST() {
  const result = await seedVersion1();
  return NextResponse.json(result);
}

// Bulk-update all tasks in a phase
export async function PATCH(req: NextRequest) {
  const { phase, status } = await req.json();
  if (!phase || !status) return NextResponse.json({ error: "phase and status required" }, { status: 400 });
  await sql`
    UPDATE version1 SET status = ${status}
    WHERE phase = ${phase} AND parent_id IS NOT NULL
  `;
  return NextResponse.json({ ok: true });
}
