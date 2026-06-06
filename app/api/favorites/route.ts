import { NextRequest, NextResponse } from "next/server";
import { addFavorite, getFavorites } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email ?? undefined;
  const favorites = await getFavorites(userId);
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const food = await req.json();
  if (!food?.name) {
    return NextResponse.json({ error: "Food data required" }, { status: 400 });
  }
  const session = await auth();
  const userId = session?.user?.email ?? undefined;
  const result = await addFavorite(food, userId);
  return NextResponse.json({ id: result.id });
}
