import { NextResponse } from "next/server";
import { getVersion1, seedVersion1 } from "@/lib/db";

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
