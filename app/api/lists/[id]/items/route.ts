import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addFoodToList } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const food = await req.json();
  if (!food?.name) return NextResponse.json({ error: "food required" }, { status: 400 });
  try {
    await addFoodToList(Number(id), session.user.email, food);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
