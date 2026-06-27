#!/usr/bin/env node
// Fetches the full AI Engineering From Scratch curriculum (phases + lessons)
// from the GitHub contents API and writes lib/curriculum.json — the single
// catalog consumed by both the DB seeder (web) and the vault generator.
//
// Usage: node scripts/sync-curriculum.mjs
// Re-runnable; pass a GITHUB_TOKEN env var to lift the 60 req/hr anon limit.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "rohitg00/ai-engineering-from-scratch";
const BRANCH = "main";
const TOTAL_HOURS = 320; // headline figure from the course README

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "aiefs-tracker",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function ghContents(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} for ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

const onlyDirs = (entries) =>
  entries.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name));

// "01-linear-algebra-intuition" -> { num: "01", title: "Linear Algebra Intuition" }
function parseSlug(name) {
  const m = name.match(/^(\d+)-(.*)$/);
  const num = m ? m[1] : "";
  const rest = m ? m[2] : name;
  const title = rest
    .split("-")
    .map((w) => (/^(ml|nlp|ai|rl|tts|asr|llm|llms|mcp|gan|gans|vae|cnn|cnns|3d|2d|rag|gpt|bert|clip|vit|rlhf|oauth)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
  return { num, title };
}

async function main() {
  console.log(`Fetching curriculum from ${REPO}@${BRANCH} ...`);
  const phaseDirs = onlyDirs(await ghContents("phases"));
  console.log(`Found ${phaseDirs.length} phases. Fetching lessons ...`);

  const phases = [];
  let totalLessons = 0;

  for (const pd of phaseDirs) {
    const p = parseSlug(pd.name);
    const lessonDirs = onlyDirs(await ghContents(`phases/${pd.name}`));
    const lessons = lessonDirs.map((ld) => {
      const l = parseSlug(ld.name);
      const base = `phases/${pd.name}/${ld.name}`;
      return {
        num: l.num,
        slug: ld.name,
        title: l.title,
        docsUrl: `https://github.com/${REPO}/blob/${BRANCH}/${base}/docs/en.md`,
        codeUrl: `https://github.com/${REPO}/tree/${BRANCH}/${base}/code`,
      };
    });
    totalLessons += lessons.length;
    phases.push({ num: p.num, slug: pd.name, title: p.title, lessons });
    console.log(`  ${pd.name}: ${lessons.length} lessons`);
  }

  // Distribute the 320h budget evenly across lessons (2 decimals so the
  // aggregate stays ≈ TOTAL_HOURS rather than overshooting from rounding).
  const perLesson = Math.round((TOTAL_HOURS / totalLessons) * 100) / 100;
  for (const ph of phases) for (const l of ph.lessons) l.hours = perLesson;

  const catalog = {
    repo: REPO,
    branch: BRANCH,
    generatedAt: new Date().toISOString(),
    totalPhases: phases.length,
    totalLessons,
    totalHours: TOTAL_HOURS,
    phases,
  };

  const out = join(ROOT, "lib", "curriculum.json");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`\nWrote ${out}`);
  console.log(`${phases.length} phases · ${totalLessons} lessons · ${perLesson}h/lesson · ${TOTAL_HOURS}h total`);
}

main().catch((err) => {
  console.error("\nsync-curriculum failed:", err.message);
  process.exit(1);
});
