import { NextRequest, NextResponse } from "next/server";
import { addFavorite, getFavorites } from "@/lib/db";

export async function GET() {
  const favorites = await getFavorites();
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const food = await req.json();
  if (!food?.name) {
    return NextResponse.json({ error: "Food data required" }, { status: 400 });
  }
  const result = await addFavorite(food);
  return NextResponse.json({ id: result.id });
}
