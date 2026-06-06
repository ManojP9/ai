import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProfile } from "@/lib/db";

const UNS = (q: string) =>
  `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(q)}`;

function buildSystemPrompt(
  profile: { dietary: string; spice_level: string; allergies: string | null } | null,
  city?: string,
) {
  const prefs = profile && profile.dietary !== "none"
    ? `\nThe user has these dietary preferences — strictly follow them:
- Dietary: ${profile.dietary}
- Spice preference: ${profile.spice_level}
- Avoid/allergies: ${profile.allergies || "none"}
All 3 recommendations MUST comply with the above.`
    : "";
  const loc = city ? `\nThe user is in ${city} — if relevant, prioritise locally popular dishes.` : "";

  return `You are a food recommendation expert. When given a query, respond with exactly 3 food recommendations as valid JSON.${prefs}${loc}

Return ONLY this JSON structure — no preamble, no explanation, no markdown:
{
  "foods": [
    {
      "name": "Food Name",
      "desc": "One sentence describing what makes this dish special and delicious",
      "emoji": "🍕",
      "tag": "Cuisine Type",
      "imgQuery": "comma,separated,photo,keywords"
    }
  ]
}

The imgQuery should be 3-4 comma-separated keywords for finding a relevant food photo on Unsplash.`;
}

export async function POST(req: NextRequest) {
  const { query, city } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Fetch profile for signed-in users
  const session = await auth();
  const profile = session?.user?.email
    ? await getProfile(session.user.email).catch(() => null)
    : null;

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: buildSystemPrompt(profile, city),
    messages: [
      { role: "user", content: `Recommend the top 3 foods for: "${query.trim()}"` },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const data = JSON.parse(jsonMatch[0]);
    const foods = (data.foods ?? []).slice(0, 3).map(
      (f: { name: string; desc: string; emoji: string; tag: string; imgQuery: string }) => ({
        name: f.name, desc: f.desc, emoji: f.emoji, tag: f.tag, img: UNS(f.imgQuery),
      })
    );
    return NextResponse.json({ foods, personalized: !!profile });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
