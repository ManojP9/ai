import { NextRequest, NextResponse } from "next/server";
import { updateCourseLesson, TaskStatus } from "@/lib/db";

const VALID: TaskStatus[] = ["pending", "in_progress", "done", "error"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { status } = await req.json();
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updateCourseLesson(numId, status);
  return NextResponse.json({ ok: true });
}
