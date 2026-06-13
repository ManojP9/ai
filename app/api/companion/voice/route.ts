// /api/companion/voice — full voice loop with personality + expressions.
// audio -> STT -> Claude (personality, memory) -> TTS, returns MP3 + emotion headers.
import { NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/lib/companion/stt";
import { synthesize } from "@/lib/companion/tts";
import { converse } from "@/lib/companion/brain";
import { getHistory, appendTurn } from "@/lib/companion/memory";
import { getProfile, getMemories } from "@/lib/companion/profiles";
import { expressionFor } from "@/lib/companion/expressions";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") || "anon";
    const childId = req.nextUrl.searchParams.get("childId") || sessionId;
    const contentType = req.headers.get("content-type") || "audio/webm";
    const audio = await req.arrayBuffer();
    if (!audio.byteLength) return NextResponse.json({ error: "empty audio" }, { status: 400 });

    const transcript = await transcribe(audio, contentType);
    if (!transcript) return NextResponse.json({ error: "no speech detected" }, { status: 422 });

    const [profile, notes, history] = await Promise.all([
      getProfile(childId).catch(() => null),
      getMemories(childId).catch(() => []),
      getHistory(sessionId).catch(() => []),
    ]);

    const { reply, emotion } = await converse(history, transcript, {
      childName: profile?.childName ?? undefined,
      ageYears: profile?.ageYears ?? undefined,
      personality: profile?.personality,
      traits: profile?.traits,
      longTermNotes: notes,
    });
    await appendTurn(sessionId, "user", transcript).catch(() => {});
    await appendTurn(sessionId, "assistant", reply).catch(() => {});

    const expr = expressionFor(emotion);
    const speech = await synthesize(reply);
    return new NextResponse(speech, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Transcript": encodeURIComponent(transcript),
        "X-Reply": encodeURIComponent(reply),
        "X-Emotion": expr.emotion,
        "X-Eye-Color": expr.eyeColor,
        "X-Gesture": expr.gesture,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
