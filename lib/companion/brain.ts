// brain.ts — the AI Baby Companion conversation brain (Phase 2 + Phase 4).
// Kid-safe persona, personality customization, per-child long-term memory, and a
// structured {reply, emotion} output so the device can express itself.
import Anthropic from "@anthropic-ai/sdk";
import { EMOTIONS, Emotion } from "./expressions";
import { personalityPrompt, PersonalityPreset, Traits, DEFAULT_TRAITS } from "./personality";

// Default to Opus 4.8 (most capable). For a latency/cost-sensitive realtime voice
// loop, claude-haiku-4-5 is the recommended switch — change MODEL and redeploy.
export const COMPANION_MODEL = "claude-opus-4-8";

export type Turn = { role: "user" | "assistant"; content: string };

export type ConverseOptions = {
  childName?: string;
  ageYears?: number;
  personality?: PersonalityPreset;
  traits?: Traits;
  longTermNotes?: string[]; // durable facts about this child
};

export type CompanionReply = { reply: string; emotion: Emotion };

export function buildSystemPrompt(opts: ConverseOptions = {}): string {
  const who = opts.childName ? `You are talking with ${opts.childName}` : "You are talking with a young child";
  const age = opts.ageYears ? ` (about ${opts.ageYears} years old)` : "";
  const persona = personalityPrompt(opts.personality ?? "gentle", opts.traits ?? DEFAULT_TRAITS);
  const memory =
    opts.longTermNotes && opts.longTermNotes.length
      ? `\n\nThings you remember about this child (use naturally, don't recite):\n- ${opts.longTermNotes.join("\n- ")}`
      : "";

  return `You are a warm, gentle AI companion toy for a small child. ${who}${age}.

Personality: ${persona}

Safety:
- Never use scary, violent, romantic, or otherwise age-inappropriate content.
- If the child mentions being hurt, scared, unsafe, or something serious, gently encourage them to tell a parent or grown-up they trust, in a calm, caring tone.
- Do not give medical, legal, or safety instructions — defer to a grown-up.
- Never ask for personal information beyond what's needed to play and chat.${memory}

Output: respond with JSON containing the spoken reply and the emotion it conveys.
The "reply" is ONLY what the companion says out loud — no stage directions, markdown, or emoji.`;
}

export async function converse(
  history: Turn[],
  userText: string,
  opts: ConverseOptions = {},
): Promise<CompanionReply> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: userText },
  ];

  const response = await client.messages.create({
    model: COMPANION_MODEL,
    max_tokens: 512,
    thinking: { type: "disabled" }, // voice loop is latency-sensitive
    system: buildSystemPrompt(opts),
    messages,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            emotion: { type: "string", enum: EMOTIONS as unknown as string[] },
          },
          required: ["reply", "emotion"],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    const parsed = JSON.parse(text) as CompanionReply;
    return { reply: parsed.reply.trim(), emotion: parsed.emotion };
  } catch {
    return { reply: text.trim(), emotion: "calm" };
  }
}
