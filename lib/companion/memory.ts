// memory.ts — per-session conversation memory (Phase 2, task: per-child context).
// Stores turns in Postgres so a session keeps short-term context across requests.
import { sql } from "@vercel/postgres";
import type { Turn } from "./brain";
import { encryptField, decryptField } from "./crypto";

export async function initCompanionMemory() {
  await sql`
    CREATE TABLE IF NOT EXISTS companion_messages (
      id          SERIAL PRIMARY KEY,
      session_id  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
      content     TEXT NOT NULL,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_companion_session ON companion_messages (session_id, id)`;
}

export async function getHistory(sessionId: string, limit = 12): Promise<Turn[]> {
  await initCompanionMemory();
  const { rows } = await sql<{ role: "user" | "assistant"; content: string }>`
    SELECT role, content FROM (
      SELECT role, content, id FROM companion_messages
      WHERE session_id = ${sessionId}
      ORDER BY id DESC LIMIT ${limit}
    ) recent ORDER BY id ASC
  `;
  return rows.map((r) => ({ role: r.role, content: decryptField(r.content) }));
}

export async function appendTurn(sessionId: string, role: "user" | "assistant", content: string) {
  await initCompanionMemory();
  await sql`
    INSERT INTO companion_messages (session_id, role, content)
    VALUES (${sessionId}, ${role}, ${encryptField(content)})
  `;
}
