import { NextRequest, NextResponse } from "next/server";
import { logSearch, getRecentSearches } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }
  await logSearch(query.trim());
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const searches = await getRecentSearches(8);
  return NextResponse.json({ searches });
}
