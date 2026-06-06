import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";

export async function GET() {
  const board = await getLeaderboard(30);
  return NextResponse.json({ board });
}
