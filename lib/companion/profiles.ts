// profiles.ts — per-child profile + lightweight long-term memory (Phase 4, task: per-child context).
import { sql } from "@vercel/postgres";
import { DEFAULT_TRAITS, PersonalityPreset, Traits } from "./personality";

export type ChildProfile = {
  childId: string;
  childName: string | null;
  ageYears: number | null;
  personality: PersonalityPreset;
  eyeColor: string;
  traits: Traits;
};

export async function initProfiles() {
  await sql`
    CREATE TABLE IF NOT EXISTS companion_profiles (
      child_id     TEXT PRIMARY KEY,
      child_name   TEXT,
      age_years    INTEGER,
      personality  TEXT NOT NULL DEFAULT 'gentle',
      eye_color    TEXT NOT NULL DEFAULT '#1fb6a6',
      traits       JSONB NOT NULL DEFAULT '{"energy":60,"talkativeness":50}',
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS companion_child_memory (
      id         SERIAL PRIMARY KEY,
      child_id   TEXT NOT NULL,
      note       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_child_memory ON companion_child_memory (child_id, id)`;
}

export async function getProfile(childId: string): Promise<ChildProfile> {
  await initProfiles();
  const { rows } = await sql`SELECT * FROM companion_profiles WHERE child_id = ${childId}`;
  if (rows.length === 0) {
    return {
      childId,
      childName: null,
      ageYears: null,
      personality: "gentle",
      eyeColor: "#1fb6a6",
      traits: DEFAULT_TRAITS,
    };
  }
  const r = rows[0];
  return {
    childId,
    childName: r.child_name,
    ageYears: r.age_years,
    personality: r.personality as PersonalityPreset,
    eyeColor: r.eye_color,
    traits: typeof r.traits === "string" ? JSON.parse(r.traits) : r.traits,
  };
}

export async function upsertProfile(p: ChildProfile): Promise<void> {
  await initProfiles();
  await sql`
    INSERT INTO companion_profiles (child_id, child_name, age_years, personality, eye_color, traits, updated_at)
    VALUES (${p.childId}, ${p.childName}, ${p.ageYears}, ${p.personality}, ${p.eyeColor}, ${JSON.stringify(p.traits)}, NOW())
    ON CONFLICT (child_id) DO UPDATE SET
      child_name = EXCLUDED.child_name,
      age_years  = EXCLUDED.age_years,
      personality = EXCLUDED.personality,
      eye_color  = EXCLUDED.eye_color,
      traits     = EXCLUDED.traits,
      updated_at = NOW()
  `;
}

export async function getMemories(childId: string, limit = 8): Promise<string[]> {
  await initProfiles();
  const { rows } = await sql`
    SELECT note FROM companion_child_memory
    WHERE child_id = ${childId} ORDER BY id DESC LIMIT ${limit}
  `;
  return rows.map((r) => r.note as string);
}

export async function addMemory(childId: string, note: string): Promise<void> {
  await initProfiles();
  await sql`INSERT INTO companion_child_memory (child_id, note) VALUES (${childId}, ${note})`;
}
