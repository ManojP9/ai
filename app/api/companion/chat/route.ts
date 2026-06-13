// /api/companion/chat — text in, companion reply + emotion + expression out.
// Useful for testing personality/expressions without STT/TTS keys.
import { NextRequest, NextResponse } from "next/server";
import { converse } from "@/lib/companion/brain";
import { getHistory, appendTurn } from "@/lib/companion/memory";
import { getProfile, getMemories } from "@/lib/companion/profiles";
import { expressionFor } from "@/lib/companion/expressions";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, text, childId } = await req.json();
    if (!sessionId || !text?.trim()) {
      return NextResponse.json({ error: "sessionId and text required" }, { status: 400 });
    }
    const cid = childId || sessionId;
    const [profile, notes, history] = await Promise.all([
      getProfile(cid).catch(() => null),
      getMemories(cid).catch(() => []),
      getHistory(sessionId).catch(() => []),
    ]);

    const { reply, emotion } = await converse(history, text.trim(), {
      childName: profile?.childName ?? undefined,
      ageYears: profile?.ageYears ?? undefined,
      personality: profile?.personality,
      traits: profile?.traits,
      longTermNotes: notes,
    });

    await appendTurn(sessionId, "user", text.trim()).catch(() => {});
    await appendTurn(sessionId, "assistant", reply).catch(() => {});

    return NextResponse.json({ reply, emotion, expression: expressionFor(emotion) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
