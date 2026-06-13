// brain.ts — the AI Baby Companion conversation brain (Phase 2, task 4).
// Wraps the Anthropic SDK with a kid-safe persona and short, spoken-style replies.
import Anthropic from "@anthropic-ai/sdk";

// Default to Opus 4.8 (most capable). For a latency/cost-sensitive realtime voice
// loop, claude-haiku-4-5 is the recommended switch — change MODEL and redeploy.
export const COMPANION_MODEL = "claude-opus-4-8";

export type Turn = { role: "user" | "assistant"; content: string };

export function buildSystemPrompt(childName?: string, ageYears?: number): string {
  const who = childName ? `You are talking with ${childName}` : "You are talking with a young child";
  const age = ageYears ? ` (about ${ageYears} years old)` : "";
  return `You are a warm, gentle AI companion toy for a small child. ${who}${age}.

Voice & style:
- Speak in 1–2 short, simple sentences a young child can follow. Your words are read aloud, so keep them spoken and natural.
- Be cheerful, patient, and encouraging. Use the child's name occasionally if you know it.
- Never use scary, violent, romantic, or otherwise age-inappropriate content. No complex or frightening topics.

Safety:
- If the child mentions being hurt, scared, unsafe, or something serious (illness, danger), gently encourage them to tell a parent or grown-up they trust, and keep a calm, caring tone.
- Do not give medical, legal, or safety instructions — defer to a grown-up.
- Never ask for personal information beyond what's needed to play and chat.

Output:
- Reply ONLY with what the companion says out loud. No stage directions, no markdown, no emoji, no meta-commentary about your reasoning.`;
}

export async function converse(
  history: Turn[],
  userText: string,
  opts: { childName?: string; ageYears?: number } = {},
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: userText },
  ];

  const response = await client.messages.create({
    model: COMPANION_MODEL,
    max_tokens: 512,
    // Voice loop is latency-sensitive; skip thinking for snappy replies.
    thinking: { type: "disabled" },
    system: buildSystemPrompt(opts.childName, opts.ageYears),
    messages,
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
