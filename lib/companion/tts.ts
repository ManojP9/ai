// tts.ts — text-to-speech (Phase 2, task 5). Pluggable; default provider ElevenLabs.
// Reads ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID. Returns MP3 audio bytes.

export async function synthesize(text: string): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY not configured");
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // a warm default voice

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5", // low-latency model for realtime voice
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return res.arrayBuffer();
}
