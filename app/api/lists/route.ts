import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserLists, createFoodList } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lists = await getUserLists(session.user.email);
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  const id = await createFoodList(session.user.email, title.trim(), description);
  return NextResponse.json({ id });
}
