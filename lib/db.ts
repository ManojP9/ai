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
    WHERE phase IN (1, 2, 3, 4) AND parent_id IS NOT NULL AND status = 'pending'
  `;
  // Phase 5 tasks are growth targets — mark as in_progress
  await sql`
    UPDATE version1 SET status = 'in_progress'
    WHERE phase = 5 AND parent_id IS NOT NULL AND status = 'pending'
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

// ── Phase 3: Monetization ─────────────────────────────────────────────────────

export async function initProfilesExtended() {
  await initProfiles();
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0`;
}

function genCode(userId: string): string {
  const prefix = userId.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}${suffix}`.toLowerCase();
}

export async function ensureReferralCode(userId: string): Promise<string> {
  await initProfilesExtended();
  await sql`INSERT INTO profiles (user_id) VALUES (${userId}) ON CONFLICT DO NOTHING`;
  const { rows } = await sql`SELECT referral_code FROM profiles WHERE user_id = ${userId}`;
  if (rows[0]?.referral_code) return rows[0].referral_code as string;
  const code = genCode(userId);
  await sql`UPDATE profiles SET referral_code = ${code} WHERE user_id = ${userId}`;
  return code;
}

export async function applyReferral(userId: string, refCode: string): Promise<boolean> {
  await initProfilesExtended();
  const { rows } = await sql`SELECT user_id FROM profiles WHERE referral_code = ${refCode}`;
  if (!rows.length) return false;
  const referrerId = (rows[0] as { user_id: string }).user_id;
  if (referrerId === userId) return false;
  const result = await sql`
    UPDATE profiles SET referred_by = ${refCode}
    WHERE user_id = ${userId} AND referred_by IS NULL
    RETURNING user_id
  `;
  if (result.rows.length > 0) {
    await sql`UPDATE profiles SET referral_count = referral_count + 1 WHERE user_id = ${referrerId}`;
    return true;
  }
  return false;
}

export async function getReferralStats(userId: string): Promise<{ code: string; count: number }> {
  await initProfilesExtended();
  const { rows } = await sql`SELECT referral_code, referral_count FROM profiles WHERE user_id = ${userId}`;
  return {
    code: (rows[0]?.referral_code as string) ?? "",
    count: (rows[0]?.referral_count as number) ?? 0,
  };
}

export async function getUserIsPremium(userId: string): Promise<boolean> {
  await initProfilesExtended();
  const { rows } = await sql`SELECT is_premium FROM profiles WHERE user_id = ${userId}`;
  return !!((rows[0] as { is_premium: boolean } | undefined)?.is_premium);
}

export async function getDailySearchCount(userId: string): Promise<number> {
  await initDb();
  const { rows } = await sql`
    SELECT COUNT(*)::int AS count FROM searches
    WHERE user_id = ${userId} AND searched_at > NOW() - INTERVAL '24 hours'
  `;
  return (rows[0] as { count: number }).count;
}

export async function initClaims() {
  await sql`
    CREATE TABLE IF NOT EXISTS restaurant_claims (
      id              SERIAL PRIMARY KEY,
      restaurant_name TEXT NOT NULL,
      owner_name      TEXT NOT NULL,
      email           TEXT NOT NULL,
      phone           TEXT,
      address         TEXT,
      submitted_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function submitClaim(data: {
  restaurant_name: string; owner_name: string; email: string; phone?: string; address?: string;
}) {
  await initClaims();
  await sql`
    INSERT INTO restaurant_claims (restaurant_name, owner_name, email, phone, address)
    VALUES (${data.restaurant_name}, ${data.owner_name}, ${data.email}, ${data.phone ?? null}, ${data.address ?? null})
  `;
}

// ── Phase 4: Growth Loops ─────────────────────────────────────────────────────

export type FoodList = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  item_count?: number;
};

export type FoodListItem = {
  id: number;
  list_id: number;
  food_name: string;
  food_desc: string;
  food_emoji: string;
  food_tag: string;
  food_img: string;
  added_at: string;
};

export async function initFoodLists() {
  await sql`
    CREATE TABLE IF NOT EXISTS food_lists (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT,
      is_public   BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS food_list_items (
      id         SERIAL PRIMARY KEY,
      list_id    INTEGER NOT NULL REFERENCES food_lists(id) ON DELETE CASCADE,
      food_name  TEXT NOT NULL,
      food_desc  TEXT NOT NULL,
      food_emoji TEXT NOT NULL,
      food_tag   TEXT NOT NULL,
      food_img   TEXT NOT NULL,
      added_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getUserLists(userId: string): Promise<FoodList[]> {
  await initFoodLists();
  const { rows } = await sql`
    SELECT fl.*, COUNT(fli.id)::int AS item_count
    FROM food_lists fl
    LEFT JOIN food_list_items fli ON fl.id = fli.list_id
    WHERE fl.user_id = ${userId}
    GROUP BY fl.id
    ORDER BY fl.created_at DESC
  `;
  return rows as FoodList[];
}

export async function getPublicList(id: number): Promise<{ list: FoodList; items: FoodListItem[] } | null> {
  await initFoodLists();
  const { rows } = await sql`SELECT * FROM food_lists WHERE id = ${id} AND is_public = TRUE`;
  if (!rows[0]) return null;
  const { rows: items } = await sql`SELECT * FROM food_list_items WHERE list_id = ${id} ORDER BY added_at`;
  return { list: rows[0] as FoodList, items: items as FoodListItem[] };
}

export async function createFoodList(userId: string, title: string, description?: string): Promise<number> {
  await initFoodLists();
  const { rows } = await sql`
    INSERT INTO food_lists (user_id, title, description)
    VALUES (${userId}, ${title}, ${description ?? null})
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

export async function addFoodToList(
  listId: number, userId: string,
  food: { name: string; desc: string; emoji: string; tag: string; img: string }
) {
  await initFoodLists();
  const { rows } = await sql`SELECT id FROM food_lists WHERE id = ${listId} AND user_id = ${userId}`;
  if (!rows.length) throw new Error("Not found");
  await sql`
    INSERT INTO food_list_items (list_id, food_name, food_desc, food_emoji, food_tag, food_img)
    VALUES (${listId}, ${food.name}, ${food.desc}, ${food.emoji}, ${food.tag}, ${food.img})
  `;
}

export async function deleteFoodList(id: number, userId: string) {
  await initFoodLists();
  await sql`DELETE FROM food_lists WHERE id = ${id} AND user_id = ${userId}`;
}

export async function getPublicUserLists(userId: string): Promise<FoodList[]> {
  await initFoodLists();
  const { rows } = await sql`
    SELECT fl.*, COUNT(fli.id)::int AS item_count
    FROM food_lists fl
    LEFT JOIN food_list_items fli ON fl.id = fli.list_id
    WHERE fl.user_id = ${userId} AND fl.is_public = TRUE
    GROUP BY fl.id
    ORDER BY fl.created_at DESC
  `;
  return rows as FoodList[];
}

export async function getLeaderboard(limit = 20): Promise<{ query: string; count: number }[]> {
  await initDb();
  const { rows } = await sql`
    SELECT lower(query) AS query, COUNT(*)::int AS count
    FROM searches
    GROUP BY lower(query)
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return rows as { query: string; count: number }[];
}

// ── Phase 5: Metrics ──────────────────────────────────────────────────────────

export async function getMetrics() {
  await initDb();
  await initProfilesExtended();
  const [s30, mau, fav, total, premium, thisWeek, lastWeek, weeklyTrend] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM searches WHERE searched_at > NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(DISTINCT user_id)::int AS c FROM searches WHERE user_id IS NOT NULL AND searched_at > NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS c FROM favorites`,
    sql`SELECT COUNT(*)::int AS c FROM searches`,
    sql`SELECT COUNT(*)::int AS c FROM profiles WHERE is_premium = TRUE`,
    sql`SELECT COUNT(DISTINCT user_id)::int AS c FROM searches WHERE user_id IS NOT NULL AND searched_at >= date_trunc('week', NOW())`,
    sql`SELECT COUNT(DISTINCT user_id)::int AS c FROM searches WHERE user_id IS NOT NULL AND searched_at >= date_trunc('week', NOW() - INTERVAL '7 days') AND searched_at < date_trunc('week', NOW())`,
    sql`
      SELECT date_trunc('week', searched_at)::date AS week,
             COUNT(DISTINCT user_id)::int AS users,
             COUNT(*)::int AS searches
      FROM searches
      WHERE user_id IS NOT NULL AND searched_at > NOW() - INTERVAL '8 weeks'
      GROUP BY date_trunc('week', searched_at)
      ORDER BY week
    `,
  ]);
  const tw = (thisWeek.rows[0] as { c: number }).c;
  const lw = (lastWeek.rows[0] as { c: number }).c;
  const wow = lw === 0 ? null : Math.round(((tw - lw) / lw) * 100);
  return {
    searches_30d: (s30.rows[0] as { c: number }).c,
    mau: (mau.rows[0] as { c: number }).c,
    total_favorites: (fav.rows[0] as { c: number }).c,
    total_searches: (total.rows[0] as { c: number }).c,
    premium_users: (premium.rows[0] as { c: number }).c,
    wow_growth: wow,
    this_week_users: tw,
    last_week_users: lw,
    weekly_trend: weeklyTrend.rows as { week: string; users: number; searches: number }[],
  };
}

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
