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
}

export async function logSearch(query: string) {
  await initDb();
  await sql`INSERT INTO searches (query) VALUES (${query})`;
}

export async function getRecentSearches(limit = 8) {
  await initDb();
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
};

export async function addFavorite(food: {
  name: string;
  desc: string;
  emoji: string;
  tag: string;
  img: string;
}) {
  await initDb();
  const { rows } = await sql`
    INSERT INTO favorites (food_name, food_desc, food_emoji, food_tag, food_img)
    VALUES (${food.name}, ${food.desc}, ${food.emoji}, ${food.tag}, ${food.img})
    RETURNING id
  `;
  return rows[0] as { id: number };
}

export async function getFavorites() {
  await initDb();
  const { rows } = await sql`
    SELECT * FROM favorites ORDER BY saved_at DESC
  `;
  return rows as FavoriteRow[];
}

export async function removeFavorite(id: number) {
  await initDb();
  await sql`DELETE FROM favorites WHERE id = ${id}`;
}
