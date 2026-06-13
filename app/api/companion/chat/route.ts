// /api/companion/chat — text in, companion reply out (Phase 2 brain, no audio).
// Useful for testing the personality without STT/TTS keys.
import { NextRequest, NextResponse } from "next/server";
import { converse } from "@/lib/companion/brain";
import { getHistory, appendTurn } from "@/lib/companion/memory";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, text, childName, ageYears } = await req.json();
    if (!sessionId || !text?.trim()) {
      return NextResponse.json({ error: "sessionId and text required" }, { status: 400 });
    }
    const history = await getHistory(sessionId).catch(() => []);
    const reply = await converse(history, text.trim(), { childName, ageYears });
    await appendTurn(sessionId, "user", text.trim()).catch(() => {});
    await appendTurn(sessionId, "assistant", reply).catch(() => {});
    return NextResponse.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
