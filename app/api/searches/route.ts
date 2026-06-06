import { NextRequest, NextResponse } from "next/server";
import { logSearch, getRecentSearches } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }
  const session = await auth();
  const userId = session?.user?.email ?? undefined;
  await logSearch(query.trim(), userId);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email ?? undefined;
  const searches = await getRecentSearches(8, userId);
  return NextResponse.json({ searches });
}
