// audit.ts — transparent activity log (Phase 5, task: audit log).
import { sql } from "@vercel/postgres";

export type AuditEvent =
  | "voice_interaction"
  | "vision_capture"
  | "settings_changed"
  | "consent_granted"
  | "controls_changed"
  | "data_exported"
  | "data_deleted";

export async function initAudit() {
  await sql`
    CREATE TABLE IF NOT EXISTS companion_audit (
      id         SERIAL PRIMARY KEY,
      child_id   TEXT NOT NULL,
      event      TEXT NOT NULL,
      detail     TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_child ON companion_audit (child_id, id)`;
}

export async function logEvent(childId: string, event: AuditEvent, detail?: string) {
  await initAudit();
  await sql`INSERT INTO companion_audit (child_id, event, detail) VALUES (${childId}, ${event}, ${detail ?? null})`;
}

export async function listEvents(childId: string, limit = 50) {
  await initAudit();
  const { rows } = await sql`
    SELECT event, detail, created_at FROM companion_audit
    WHERE child_id = ${childId} ORDER BY id DESC LIMIT ${limit}
  `;
  return rows;
}
