// /api/companion/push — register an Expo push token and send notifications (Phase 4).
// POST { childId, token }  -> store token
// PUT  { childId, title, body } -> send a push to that child's registered tokens
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function initPush() {
  await sql`
    CREATE TABLE IF NOT EXISTS companion_push_tokens (
      token      TEXT PRIMARY KEY,
      child_id   TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  try {
    const { childId, token } = await req.json();
    if (!childId || !token) return NextResponse.json({ error: "childId and token required" }, { status: 400 });
    await initPush();
    await sql`
      INSERT INTO companion_push_tokens (token, child_id) VALUES (${token}, ${childId})
      ON CONFLICT (token) DO UPDATE SET child_id = EXCLUDED.child_id
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { childId, title, body } = await req.json();
    if (!childId || !title) return NextResponse.json({ error: "childId and title required" }, { status: 400 });
    await initPush();
    const { rows } = await sql`SELECT token FROM companion_push_tokens WHERE child_id = ${childId}`;
    if (rows.length === 0) return NextResponse.json({ sent: 0 });

    const messages = rows.map((r) => ({ to: r.token as string, sound: "default", title, body: body ?? "" }));
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    if (!res.ok) throw new Error(`Expo push failed: ${res.status}`);
    return NextResponse.json({ sent: messages.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
