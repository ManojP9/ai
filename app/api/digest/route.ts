import { NextResponse } from "next/server";
import { getAllProfiles, getUserFavoriteTags } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

function digestEmailHtml(
  foods: { name: string; emoji: string; desc: string; tag: string }[],
  dietary: string,
) {
  const rows = foods
    .map(
      (f) => `
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;margin-bottom:16px;">
      <div style="font-size:28px;margin-bottom:6px;">${f.emoji} ${f.name}</div>
      <div style="color:#94a3b8;font-size:14px;line-height:1.5;">${f.desc}</div>
      <div style="margin-top:10px;display:inline-block;background:rgba(251,146,60,0.15);color:#fb923c;border-radius:999px;padding:2px 12px;font-size:12px;">${f.tag}</div>
    </div>`
    )
    .join("");

  const pref = dietary !== "none" ? ` (${dietary})` : "";

  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#07070f;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">🍽️</div>
      <h1 style="margin:0;font-size:28px;font-weight:900;background:linear-gradient(120deg,#fb923c,#f43f5e,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">3C Foods</h1>
      <p style="color:#64748b;font-size:14px;margin-top:8px;">Your personalised picks this week${pref}</p>
    </div>
    ${rows}
    <div style="text-align:center;margin-top:32px;">
      <a href="https://ai-kohl-nine-89.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#fb923c,#f43f5e);color:#fff;font-weight:700;padding:14px 32px;border-radius:14px;text-decoration:none;font-size:15px;">Discover more →</a>
    </div>
    <p style="text-align:center;color:#334155;font-size:12px;margin-top:32px;">
      You're receiving this because you signed up for 3C Foods.<br>
      <a href="https://ai-kohl-nine-89.vercel.app/profile" style="color:#475569;">Update preferences</a>
    </p>
  </div>
</body>
</html>`;
}

async function generateDigestFoods(
  profile: { dietary: string; spice_level: string; allergies: string | null },
  favTags: string[],
): Promise<{ name: string; emoji: string; desc: string; tag: string }[]> {
  const client = new Anthropic();
  const tagHint = favTags.length > 0 ? ` The user loves: ${favTags.join(", ")}.` : "";
  const prefLine =
    profile.dietary !== "none"
      ? `Dietary: ${profile.dietary}. Spice: ${profile.spice_level}. Avoid: ${profile.allergies || "none"}.`
      : `Spice preference: ${profile.spice_level}.`;

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 512,
    system: `You are a food recommendation expert. Return ONLY valid JSON: {"foods":[{"name":"...","emoji":"...","desc":"...","tag":"..."}]}`,
    messages: [
      {
        role: "user",
        content: `Weekly top-3 picks for a user with these preferences: ${prefLine}${tagHint} Make them feel curated and fresh.`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  const data = JSON.parse(match[0]);
  return (data.foods ?? []).slice(0, 3);
}

export async function GET(req: Request) {
  // Validate cron secret
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY or ANTHROPIC_API_KEY not set" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "digest@3cfoods.app";

  const profiles = await getAllProfiles();
  const results: { email: string; status: string }[] = [];

  for (const profile of profiles) {
    try {
      const favTags = await getUserFavoriteTags(profile.user_id);
      const foods = await generateDigestFoods(profile, favTags);
      if (!foods.length) continue;

      await resend.emails.send({
        from: `3C Foods <${fromEmail}>`,
        to: profile.user_id,
        subject: "🍽️ Your weekly food picks are ready",
        html: digestEmailHtml(foods, profile.dietary),
      });

      results.push({ email: profile.user_id, status: "sent" });
    } catch (e) {
      results.push({ email: profile.user_id, status: `error: ${(e as Error).message}` });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
