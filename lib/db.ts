import { sql } from "@vercel/postgres";

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS searches (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      food_name TEXT NOT NULL,
      food_desc TEXT NOT NULL,
      food_emoji TEXT NOT NULL,
      food_tag TEXT NOT NULL,
      food_img TEXT NOT NULL,
      saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  // Phase 1: user_id on searches + favorites
  await sql`ALTER TABLE searches  ADD COLUMN IF NOT EXISTS user_id TEXT`;
  await sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS user_id TEXT`;
  // Phase 2: ratings on favorites
  await sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5)`;
  await sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS tried_at TIMESTAMPTZ`;
}

export async function logSearch(query: string, userId?: string) {
  await initDb();
  await sql`INSERT INTO searches (query, user_id) VALUES (${query}, ${userId ?? null})`;
}

export async function getRecentSearches(limit = 8, userId?: string) {
  await initDb();
  if (userId) {
    const { rows } = await sql`
      SELECT DISTINCT ON (lower(query)) query, MAX(searched_at) as last_searched
      FROM searches
      WHERE user_id = ${userId}
      GROUP BY lower(query)
      ORDER BY MAX(searched_at) DESC
      LIMIT ${limit}
    `;
    return rows as { query: string; last_searched: string }[];
  }
  const { rows } = await sql`
    SELECT DISTINCT ON (lower(query)) query, MAX(searched_at) as last_searched
    FROM searches
    GROUP BY lower(query)
    ORDER BY MAX(searched_at) DESC
    LIMIT ${limit}
  `;
  return rows as { query: string; last_searched: string }[];
}

export type FavoriteRow = {
  id: number;
  food_name: string;
  food_desc: string;
  food_emoji: string;
  food_tag: string;
  food_img: string;
  saved_at: string;
  rating: number | null;
  tried_at: string | null;
};

export async function addFavorite(
  food: { name: string; desc: string; emoji: string; tag: string; img: string },
  userId?: string,
) {
  await initDb();
  const { rows } = await sql`
    INSERT INTO favorites (food_name, food_desc, food_emoji, food_tag, food_img, user_id)
    VALUES (${food.name}, ${food.desc}, ${food.emoji}, ${food.tag}, ${food.img}, ${userId ?? null})
    RETURNING id
  `;
  return rows[0] as { id: number };
}

export async function getFavorites(userId?: string) {
  await initDb();
  if (userId) {
    const { rows } = await sql`
      SELECT * FROM favorites WHERE user_id = ${userId} ORDER BY saved_at DESC
    `;
    return rows as FavoriteRow[];
  }
  const { rows } = await sql`SELECT * FROM favorites ORDER BY saved_at DESC`;
  return rows as FavoriteRow[];
}

export async function removeFavorite(id: number) {
  await initDb();
  await sql`DELETE FROM favorites WHERE id = ${id}`;
}

export async function rateFood(id: number, rating: number) {
  await initDb();
  await sql`
    UPDATE favorites SET rating = ${rating}, tried_at = NOW() WHERE id = ${id}
  `;
}

// ── profiles ─────────────────────────────────────────────────────────────────

export type Profile = {
  user_id: string;
  dietary: string;
  spice_level: string;
  allergies: string | null;
  updated_at: string;
};

export async function initProfiles() {
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id     TEXT PRIMARY KEY,
      dietary     TEXT NOT NULL DEFAULT 'none',
      spice_level TEXT NOT NULL DEFAULT 'medium',
      allergies   TEXT,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  await initProfiles();
  const { rows } = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
  return (rows[0] as Profile) ?? null;
}

export async function upsertProfile(
  userId: string,
  data: { dietary: string; spice_level: string; allergies: string }
) {
  await initProfiles();
  await sql`
    INSERT INTO profiles (user_id, dietary, spice_level, allergies, updated_at)
    VALUES (${userId}, ${data.dietary}, ${data.spice_level}, ${data.allergies || null}, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET dietary = EXCLUDED.dietary,
          spice_level = EXCLUDED.spice_level,
          allergies = EXCLUDED.allergies,
          updated_at = NOW()
  `;
}

export async function getAllProfiles(): Promise<Profile[]> {
  await initProfiles();
  const { rows } = await sql`SELECT * FROM profiles`;
  return rows as Profile[];
}

export async function getUserFavoriteTags(userId: string): Promise<string[]> {
  await initDb();
  const { rows } = await sql`
    SELECT food_tag, COUNT(*)::int AS cnt
    FROM favorites
    WHERE user_id = ${userId}
    GROUP BY food_tag
    ORDER BY cnt DESC
    LIMIT 3
  `;
  return rows.map((r) => r.food_tag as string);
}

// ── version1: phasewise feature roadmap ──────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "done" | "error";

export type Version1Row = {
  id: number;
  parent_id: number | null;
  title: string;
  description: string | null;
  phase: number | null;
  order_index: number;
  status: TaskStatus;
  error_note: string | null;
  created_at: string;
};

export type Version1Node = Version1Row & { children: Version1Node[] };

export async function initVersion1() {
  await sql`
    CREATE TABLE IF NOT EXISTS version1 (
      id          SERIAL PRIMARY KEY,
      parent_id   INTEGER REFERENCES version1(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      phase       INTEGER,
      order_index INTEGER DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'pending',
      error_note  TEXT,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  // safe migration for existing tables created before status/error_note columns
  await sql`ALTER TABLE version1 ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`;
  await sql`ALTER TABLE version1 ADD COLUMN IF NOT EXISTS error_note TEXT`;
  // auto-mark shipped phases as done (only touches rows still at default 'pending')
  await sql`
    UPDATE version1 SET status = 'done'
    WHERE phase IN (1, 2) AND parent_id IS NOT NULL AND status = 'pending'
  `;
}

export async function updateVersion1Task(id: number, status: TaskStatus, error_note?: string) {
  await initVersion1();
  await sql`
    UPDATE version1
    SET status = ${status}, error_note = ${error_note ?? null}
    WHERE id = ${id}
  `;
}

export async function getVersion1(): Promise<Version1Node[]> {
  await initVersion1();
  const { rows } = await sql<Version1Row>`
    SELECT * FROM version1 ORDER BY phase NULLS LAST, order_index, id
  `;
  const map = new Map<number, Version1Node>();
  for (const r of rows) map.set(r.id, { ...r, children: [] });
  const roots: Version1Node[] = [];
  for (const node of map.values()) {
    if (node.parent_id == null) roots.push(node);
    else map.get(node.parent_id)?.children.push(node);
  }
  return roots;
}

const ROADMAP = [
  {
    phase: 1,
    title: "Phase 1 — Real Product (Week 1–2)",
    description: "Turn the prototype into something measurable",
    tasks: [
      { title: "Google Sign-In (NextAuth)", description: "Identify real users, enable personalization" },
      { title: "PostHog / Plausible analytics", description: "Track DAU, search events, retention" },
      { title: "PWA (installable on phone)", description: "Food decisions happen on mobile" },
      { title: "Share button on food cards", description: "Organic growth loop" },
      { title: "Error boundary + loading skeletons", description: "Polish for real users" },
    ],
  },
  {
    phase: 2,
    title: "Phase 2 — Personalization (Week 3–4)",
    description: "Give users a reason to come back",
    tasks: [
      { title: "Dietary profile (vegan, halal, gluten-free)", description: "Niche = defensibility" },
      { title: "AI recommendations use user profile", description: "Results feel personal" },
      { title: "Search history per user (not just browser)", description: "Cross-device continuity" },
      { title: "Tried it / ratings on saved favorites", description: "Engagement signal" },
      { title: "Weekly email digest (Your top picks)", description: "Retention loop" },
    ],
  },
  {
    phase: 3,
    title: "Phase 3 — Monetization (Week 5–6)",
    description: "First dollar of revenue",
    tasks: [
      { title: "Delivery app deep links (Uber Eats, DoorDash)", description: "Affiliate revenue per order" },
      { title: "Order Now button on food cards", description: "Converts discovery to revenue" },
      { title: "Restaurant claim page (basic)", description: "B2B lead generation" },
      { title: "Premium tier: unlimited AI searches", description: "Subscription seed" },
      { title: "Referral system", description: "Viral growth metric for YC" },
    ],
  },
  {
    phase: 4,
    title: "Phase 4 — Growth Loops (Week 7–8)",
    description: "Organic user acquisition",
    tasks: [
      { title: "Shareable food lists (My top 5 Italian spots)", description: "Social content = distribution" },
      { title: "Public user profiles", description: "SEO + community" },
      { title: "Location-aware recommendations", description: "Hyper-local niche" },
      { title: "Restaurant leaderboards by city", description: "Content marketing flywheel" },
      { title: "Embeddable food widget for blogs", description: "B2B2C distribution" },
    ],
  },
  {
    phase: 5,
    title: "Phase 5 — YC Application Ready",
    description: "Numbers worth presenting",
    tasks: [
      { title: "500+ MAU", description: "Achieve via referral + social sharing from Phase 4" },
      { title: "10%+ week-over-week growth", description: "Track in PostHog dashboard" },
      { title: "$500+ MRR", description: "Affiliate commissions + premium subscriptions" },
      { title: "Clear retention curve", description: "Users returning 3+ consecutive weeks" },
      { title: "1-minute demo video", description: "Record the full end-to-end flow" },
    ],
  },
];

export async function seedVersion1(): Promise<{ seeded: boolean; phases: number; tasks: number }> {
  await initVersion1();
  const { rows: existing } = await sql`SELECT COUNT(*)::int AS count FROM version1`;
  if ((existing[0] as { count: number }).count > 0) {
    return { seeded: false, phases: 0, tasks: 0 };
  }

  let phaseCount = 0;
  let taskCount = 0;

  for (const [i, phase] of ROADMAP.entries()) {
    const { rows } = await sql`
      INSERT INTO version1 (parent_id, title, description, phase, order_index)
      VALUES (NULL, ${phase.title}, ${phase.description}, ${phase.phase}, ${i})
      RETURNING id
    `;
    const phaseId = (rows[0] as { id: number }).id;
    phaseCount++;

    for (const [j, task] of phase.tasks.entries()) {
      await sql`
        INSERT INTO version1 (parent_id, title, description, phase, order_index)
        VALUES (${phaseId}, ${task.title}, ${task.description}, ${phase.phase}, ${j})
      `;
      taskCount++;
    }
  }

  return { seeded: true, phases: phaseCount, tasks: taskCount };
}
