import { NextRequest, NextResponse } from "next/server";
import { submitClaim } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { restaurant_name, owner_name, email, phone, address } = await req.json();
  if (!restaurant_name || !owner_name || !email) {
    return NextResponse.json({ error: "restaurant_name, owner_name and email are required" }, { status: 400 });
  }
  await submitClaim({ restaurant_name, owner_name, email, phone, address });
  return NextResponse.json({ ok: true });
}
