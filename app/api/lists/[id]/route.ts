import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPublicList, deleteFoodList } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicList(Number(id));
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteFoodList(Number(id), session.user.email);
  return NextResponse.json({ ok: true });
}
