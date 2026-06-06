import { NextRequest, NextResponse } from "next/server";
import { removeFavorite } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await removeFavorite(numId);
  return NextResponse.json({ ok: true });
}
