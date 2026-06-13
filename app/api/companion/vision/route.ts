// /api/companion/vision — analyze a camera frame with Claude vision (Phase 4, task: camera vision).
// Accepts a JPEG/PNG image (raw body) and returns a structured scene read the device
// can react to (child present? what's happening? overall mood?).
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { COMPANION_MODEL } from "@/lib/companion/brain";

type VisionResult = { childPresent: boolean; faces: number; scene: string; mood: string };

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }
    const contentType = req.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.startsWith("image/") ? contentType : "image/jpeg";
    const bytes = await req.arrayBuffer();
    if (!bytes.byteLength) return NextResponse.json({ error: "empty image" }, { status: 400 });
    const data = Buffer.from(bytes).toString("base64");

    const client = new Anthropic();
    const response = await client.messages.create({
      model: COMPANION_MODEL,
      max_tokens: 300,
      thinking: { type: "disabled" },
      system:
        "You are the vision system of a child's companion toy. Briefly and safely describe what the camera sees. Never identify or name people.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as "image/jpeg", data },
            },
            { type: "text", text: "What does the companion see right now?" },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              childPresent: { type: "boolean" },
              faces: { type: "integer" },
              scene: { type: "string" },
              mood: { type: "string" },
            },
            required: ["childPresent", "faces", "scene", "mood"],
            additionalProperties: false,
          },
        },
      },
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const result = JSON.parse(text) as VisionResult;
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
