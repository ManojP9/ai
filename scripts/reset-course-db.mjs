#!/usr/bin/env node
// One-off: truncate the course_lessons table so the next GET /api/course
// re-seeds it from the current lib/curriculum.json. Reads POSTGRES_URL from
// .env.local. Usage: node scripts/reset-course-db.mjs
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = await readFile(join(ROOT, ".env.local"), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^(POSTGRES_URL|POSTGRES_URL_NON_POOLING|DATABASE_URL)=(.*)$/);
  if (m && m[2]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { sql } = await import("@vercel/postgres");
await sql`TRUNCATE course_lessons RESTART IDENTITY CASCADE`;
console.log("course_lessons truncated — next GET /api/course will re-seed.");
process.exit(0);
