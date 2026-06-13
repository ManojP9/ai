// stt.ts — speech-to-text (Phase 2, task 3). Pluggable; default provider Deepgram.
// Reads DEEPGRAM_API_KEY. Returns the transcript text for a chunk of audio.

export async function transcribe(audio: ArrayBuffer, contentType = "audio/webm"): Promise<string> {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("DEEPGRAM_API_KEY not configured");

  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
    {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": contentType },
      body: audio,
    },
  );
  if (!res.ok) {
    throw new Error(`Deepgram STT failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as {
    results?: { channels?: { alternatives?: { transcript?: string }[] }[] };
  };
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
}
