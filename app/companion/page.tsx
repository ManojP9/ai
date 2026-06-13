// /companion — browser tester for the Phase 2 voice loop.
// Lets you hold-to-talk from a laptop mic and hear the companion reply, so the
// loop can be validated before the ESP32-S3 hardware is wired up.
"use client";

import { useRef, useState } from "react";

type Line = { who: "you" | "companion"; text: string };

export default function CompanionTester() {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");
  const sessionId = useRef(`web-${Math.random().toString(36).slice(2)}`);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => send(new Blob(chunksRef.current, { type: "audio/webm" }));
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stop() {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function send(blob: Blob) {
    setBusy(true);
    try {
      const res = await fetch(`/api/companion/voice?sessionId=${sessionId.current}`, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: blob,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const transcript = decodeURIComponent(res.headers.get("X-Transcript") || "");
      const reply = decodeURIComponent(res.headers.get("X-Reply") || "");
      setLines((l) => [...l, { who: "you", text: transcript }, { who: "companion", text: reply }]);
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      await audio.play().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>AI Baby Companion — voice loop tester</h1>
      <p style={{ color: "#666" }}>
        Hold the button, say something, release. Audio → speech-to-text → Claude → speech back.
      </p>
      <button
        onMouseDown={start}
        onMouseUp={stop}
        onTouchStart={start}
        onTouchEnd={stop}
        disabled={busy}
        style={{
          padding: "16px 28px",
          fontSize: 18,
          borderRadius: 999,
          border: 0,
          color: "#fff",
          background: recording ? "#e03131" : busy ? "#868e96" : "#1fb6a6",
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {recording ? "● Listening… (release to send)" : busy ? "Thinking…" : "🎤 Hold to talk"}
      </button>

      {error && <p style={{ color: "#e03131" }}>{error}</p>}

      <div style={{ marginTop: 24 }}>
        {lines.map((l, i) => (
          <p key={i} style={{ margin: "8px 0" }}>
            <strong style={{ color: l.who === "you" ? "#333" : "#1fb6a6" }}>
              {l.who === "you" ? "You" : "Companion"}:
            </strong>{" "}
            {l.text}
          </p>
        ))}
      </div>
    </main>
  );
}
