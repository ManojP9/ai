// /api/companion/voice — the full voice loop (Phase 2, task 1/2/3/5).
// Accepts an audio blob, runs STT -> Claude brain -> TTS, and returns MP3 audio.
// The transcript + reply text are returned in headers so the client can display them.
import { NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/lib/companion/stt";
import { synthesize } from "@/lib/companion/tts";
import { converse } from "@/lib/companion/brain";
import { getHistory, appendTurn } from "@/lib/companion/memory";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") || "anon";
    const childName = req.nextUrl.searchParams.get("childName") || undefined;
    const contentType = req.headers.get("content-type") || "audio/webm";
    const audio = await req.arrayBuffer();
    if (!audio.byteLength) {
      return NextResponse.json({ error: "empty audio" }, { status: 400 });
    }

    const transcript = await transcribe(audio, contentType);
    if (!transcript) {
      return NextResponse.json({ error: "no speech detected" }, { status: 422 });
    }

    const history = await getHistory(sessionId).catch(() => []);
    const reply = await converse(history, transcript, { childName });
    await appendTurn(sessionId, "user", transcript).catch(() => {});
    await appendTurn(sessionId, "assistant", reply).catch(() => {});

    const speech = await synthesize(reply);
    return new NextResponse(speech, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Transcript": encodeURIComponent(transcript),
        "X-Reply": encodeURIComponent(reply),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
