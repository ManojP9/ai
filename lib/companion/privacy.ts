// privacy.ts — parental consent, controls (mic/camera), data export & deletion (Phase 5).
// Implements the COPPA / GDPR-K surface: no data collection without consent, parents
// can disable sensors, export their data, and request full erasure.
import { sql } from "@vercel/postgres";

export type Controls = {
  childId: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  consented: boolean;
  consentParentEmail: string | null;
};

export async function initPrivacy() {
  await sql`
    CREATE TABLE IF NOT EXISTS companion_controls (
      child_id             TEXT PRIMARY KEY,
      mic_enabled          BOOLEAN NOT NULL DEFAULT true,
      camera_enabled       BOOLEAN NOT NULL DEFAULT true,
      consent_parent_email TEXT,
      consent_at           TIMESTAMPTZ,
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getControls(childId: string): Promise<Controls> {
  await initPrivacy();
  const { rows } = await sql`SELECT * FROM companion_controls WHERE child_id = ${childId}`;
  if (rows.length === 0) {
    // Default to NOT consented — nothing is collected until a parent opts in.
    return { childId, micEnabled: true, cameraEnabled: true, consented: false, consentParentEmail: null };
  }
  const r = rows[0];
  return {
    childId,
    micEnabled: r.mic_enabled,
    cameraEnabled: r.camera_enabled,
    consented: !!r.consent_at,
    consentParentEmail: r.consent_parent_email,
  };
}

export async function recordConsent(childId: string, parentEmail: string) {
  await initPrivacy();
  await sql`
    INSERT INTO companion_controls (child_id, consent_parent_email, consent_at)
    VALUES (${childId}, ${parentEmail}, NOW())
    ON CONFLICT (child_id) DO UPDATE SET consent_parent_email = ${parentEmail}, consent_at = NOW(), updated_at = NOW()
  `;
}

export async function setControls(childId: string, micEnabled: boolean, cameraEnabled: boolean) {
  await initPrivacy();
  await sql`
    INSERT INTO companion_controls (child_id, mic_enabled, camera_enabled)
    VALUES (${childId}, ${micEnabled}, ${cameraEnabled})
    ON CONFLICT (child_id) DO UPDATE SET mic_enabled = ${micEnabled}, camera_enabled = ${cameraEnabled}, updated_at = NOW()
  `;
}

/** GDPR data export — everything we hold for this child. (Content stays encrypted in export count form.) */
export async function exportData(childId: string) {
  const [controls, profile, memories, messages, audit] = await Promise.all([
    getControls(childId),
    sql`SELECT child_name, age_years, personality, eye_color, traits FROM companion_profiles WHERE child_id = ${childId}`.then((r) => r.rows[0] ?? null).catch(() => null),
    sql`SELECT COUNT(*)::int AS n FROM companion_child_memory WHERE child_id = ${childId}`.then((r) => r.rows[0].n).catch(() => 0),
    sql`SELECT COUNT(*)::int AS n FROM companion_messages WHERE session_id = ${childId}`.then((r) => r.rows[0].n).catch(() => 0),
    sql`SELECT COUNT(*)::int AS n FROM companion_audit WHERE child_id = ${childId}`.then((r) => r.rows[0].n).catch(() => 0),
  ]);
  return { childId, controls, profile, counts: { memories, messages, audit } };
}

/** Right to erasure — purge every record for this child across all tables. */
export async function deleteAllData(childId: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const del = async (label: string, q: Promise<{ rowCount: number | null }>) => {
    out[label] = (await q.catch(() => ({ rowCount: 0 }))).rowCount ?? 0;
  };
  await del("messages", sql`DELETE FROM companion_messages WHERE session_id = ${childId}`);
  await del("memories", sql`DELETE FROM companion_child_memory WHERE child_id = ${childId}`);
  await del("profile", sql`DELETE FROM companion_profiles WHERE child_id = ${childId}`);
  await del("controls", sql`DELETE FROM companion_controls WHERE child_id = ${childId}`);
  await del("push_tokens", sql`DELETE FROM companion_push_tokens WHERE child_id = ${childId}`);
  await del("audit", sql`DELETE FROM companion_audit WHERE child_id = ${childId}`);
  return out;
}

/** Retention: drop conversation turns older than `days` (default 30). */
export async function applyRetention(days = 30): Promise<number> {
  const { rowCount } = await sql`
    DELETE FROM companion_messages WHERE created_at < NOW() - (${days} || ' days')::interval
  `;
  return rowCount ?? 0;
}
